"use node";
import webpush from "web-push";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
export const send = internalAction({
  args: {
    userId: v.string(),
    title: v.string(),
    body: v.string(),
    href: v.string(),
    kind: v.string(),
  },
  handler: async (ctx, a) => {
    const pub = process.env.VAPID_PUBLIC_KEY,
      priv = process.env.VAPID_PRIVATE_KEY;
    if (!pub || !priv) return;
    webpush.setVapidDetails("mailto:jeiwinfreyulep12@gmail.com", pub, priv);
    const subscriptions = await ctx.runMutation(
      internal.notifications.subscriptions,
      { userId: a.userId },
    );
    for (const s of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ title: a.title, body: a.body, href: a.href }),
          { TTL: 300 },
        );
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410)
          await ctx.runMutation(internal.notifications.prune, { id: s._id });
        else console.error("Push delivery failed", status ?? "network");
      }
    }
  },
});
