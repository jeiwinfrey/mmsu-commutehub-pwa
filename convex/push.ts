"use node";
import webpush from "web-push";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
export const send = internalAction({
  args: {
    userId: v.string(),
    reportId: v.optional(v.id("reports")),
    planId: v.optional(v.id("plans")),
    revision: v.optional(v.number()),
    tripId: v.optional(v.id("trips")),
    title: v.string(),
    body: v.string(),
    href: v.string(),
    kind: v.string(),
    eventKey: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, a) => {
    const source = {
      userId: a.userId,
      reportId: a.reportId,
      planId: a.planId,
      revision: a.revision,
      tripId: a.tripId,
    };
    if (!(await ctx.runQuery(internal.notifications.deliveryAllowed, source)))
      return;
    const pub = process.env.VAPID_PUBLIC_KEY,
      priv = process.env.VAPID_PRIVATE_KEY;
    if (!pub || !priv) return;
    const expiresAt =
      a.expiresAt ?? Date.now() + (a.kind === "proximity" ? 120000 : 300000);
    if (Date.now() >= expiresAt) return;
    const eventKey =
      a.eventKey ??
      `${a.kind}:${a.userId}:${a.reportId ?? a.tripId ?? a.planId ?? a.href}:${a.revision ?? 1}`;
    webpush.setVapidDetails("mailto:jeiwinfreyulep12@gmail.com", pub, priv);
    const subscriptions = await ctx.runMutation(
      internal.notifications.subscriptions,
      { userId: a.userId },
    );
    let retryDelay: number | null = null;
    for (const subscription of subscriptions) {
      const claim = await ctx.runMutation(internal.delivery.begin, {
        userId: a.userId,
        eventKey,
        subscriptionId: subscription._id,
        expiresAt,
      });
      if (!claim) continue;
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify({
            title: a.title,
            body: a.body,
            href: a.href,
            eventId: eventKey,
          }),
          {
            TTL: Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000)),
            timeout: 15000,
          },
        );
        await ctx.runMutation(internal.delivery.finish, {
          id: claim.id,
          attempt: claim.attempt,
          status: "sent",
        });
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode,
          transient = !statusCode || statusCode === 429 || statusCode >= 500,
          delay = Math.min(60000, 15000 * 2 ** (claim.attempt - 1)),
          retry =
            transient && claim.attempt < 4 && Date.now() + delay < expiresAt;
        await ctx.runMutation(internal.delivery.finish, {
          id: claim.id,
          attempt: claim.attempt,
          status: retry ? "retry" : "failed",
          ...(statusCode ? { statusCode } : {}),
        });
        if (statusCode === 404 || statusCode === 410)
          await ctx.runMutation(internal.notifications.prune, {
            id: subscription._id,
          });
        if (retry)
          retryDelay =
            retryDelay === null ? delay : Math.min(retryDelay, delay);
      }
    }
    if (retryDelay !== null)
      await ctx.scheduler.runAfter(retryDelay, internal.push.send, {
        ...a,
        eventKey,
        expiresAt,
      });
  },
});
