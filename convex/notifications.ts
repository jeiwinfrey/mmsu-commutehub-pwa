import {
  query,
  mutation,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { user } from "./lib/auth";
import { internal } from "./_generated/api";
export const list = query({
  args: {},
  handler: async (ctx) => {
    const i = await user(ctx);
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", i.subject))
      .order("desc")
      .take(100);
    return Promise.all(
      notifications.map(async (notification) => {
        const report = notification.reportId
          ? await ctx.db.get(notification.reportId)
          : null;
        return {
          ...notification,
          title: report
            ? `${report.category} report · ${report.area}`
            : notification.title,
          body: report?.description ?? notification.body,
          reportResolved: report?.resolved ?? false,
          reportExpiresAt: report?.expiresAt,
          reportObservedAt: report?.createdAt,
          reportAuthor: report?.author,
        };
      }),
    );
  },
});
export const read = mutation({
  args: { id: v.optional(v.id("notifications")) },
  handler: async (ctx, { id }) => {
    const i = await user(ctx);
    if (id) {
      const n = await ctx.db.get(id);
      if (!n || n.userId !== i.subject)
        throw new ConvexError("Alert not found.");
      await ctx.db.patch(id, { read: true });
    } else {
      const all = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", i.subject))
        .collect();
      for (const n of all)
        if (!n.read) await ctx.db.patch(n._id, { read: true });
    }
  },
});
export const subscribe = mutation({
  args: { endpoint: v.string(), p256dh: v.string(), auth: v.string() },
  handler: async (ctx, a) => {
    const i = await user(ctx);
    let url: URL;
    try {
      url = new URL(a.endpoint);
    } catch {
      throw new ConvexError("Invalid push endpoint.");
    }
    const hosts = [
      "fcm.googleapis.com",
      "updates.push.services.mozilla.com",
      "notify.windows.com",
      "push.apple.com",
    ];
    if (
      !hosts.some(
        (h) => url.hostname === h || url.hostname.endsWith("." + h),
      ) ||
      url.protocol !== "https:" ||
      a.endpoint.length > 3000 ||
      a.p256dh.length > 200 ||
      a.auth.length > 100
    )
      throw new ConvexError("Invalid push subscription.");
    const old = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", a.endpoint))
      .unique();
    if (old) {
      if (old.userId !== i.subject) await ctx.db.delete(old._id);
      else return;
    }
    await ctx.db.insert("pushSubscriptions", { ...a, userId: i.subject });
  },
});
export const unsubscribe = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, { endpoint }) => {
    const i = await user(ctx),
      s = await ctx.db
        .query("pushSubscriptions")
        .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
        .unique();
    if (s && s.userId === i.subject) await ctx.db.delete(s._id);
  },
});
export const fanout = internalMutation({
  args: { reportId: v.id("reports") },
  handler: async (ctx, { reportId }) => {
    const r = await ctx.db.get(reportId);
    if (!r) return;
    if (r.resolved || r.expiresAt <= Date.now()) return;
    const recipients = new Set<string>();
    const saved = await ctx.db
      .query("savedRoutes")
      .withIndex("by_route", (q) => q.eq("routeId", r.routeId))
      .collect();
    for (const s of saved) recipients.add(s.userId);
    for (const status of ["waiting", "riding"] as const) {
      const trips = await ctx.db
        .query("trips")
        .withIndex("by_status", (q) => q.eq("status", status))
        .filter((q) => q.eq(q.field("routeId"), r.routeId))
        .collect();
      for (const t of trips) recipients.add(t.userId);
    }
    const plans = await ctx.db
      .query("plans")
      .withIndex("by_route", (q) => q.eq("routeId", r.routeId))
      .filter((q) => q.gte(q.field("classAt"), Date.now()))
      .collect();
    for (const p of plans) recipients.add(p.userId);
    for (const userId of recipients) {
      if (userId === r.userId) continue;
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique();
      if (profile?.communityAlerts === false) continue;
      const existing = await ctx.db
        .query("notifications")
        .withIndex("by_user_report", (q) =>
          q.eq("userId", userId).eq("reportId", reportId),
        )
        .first();
      if (existing) continue;
      const recent = await ctx.db
        .query("notifications")
        .withIndex("by_user_route_time", (q) =>
          q
            .eq("userId", userId)
            .eq("routeId", r.routeId)
            .gte("createdAt", Date.now() - 15 * 60000),
        )
        .first();
      const payload = {
        kind: "community",
        title: `${r.category} report · ${r.area}`,
        body: r.description,
        href: `/community?report=${r._id}`,
      };
      await ctx.db.insert("notifications", {
        ...payload,
        userId,
        reportId: r._id,
        routeId: r.routeId,
        read: false,
        createdAt: Date.now(),
      });
      if (!recent)
        await ctx.scheduler.runAfter(0, internal.push.send, {
          userId,
          reportId: r._id,
          ...payload,
        });
    }
  },
});
export const subscriptions = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) =>
    ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect(),
});
export const prune = internalMutation({
  args: { id: v.id("pushSubscriptions") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) =>
        q.eq("userId", identity.subject).eq("read", false),
      )
      .take(100);
    return unread.length;
  },
});

export const deliveryAllowed = internalQuery({
  args: {
    userId: v.string(),
    reportId: v.optional(v.id("reports")),
    planId: v.optional(v.id("plans")),
    revision: v.optional(v.number()),
    tripId: v.optional(v.id("trips")),
  },
  handler: async (ctx, a) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", a.userId))
      .unique();
    if (a.reportId) {
      const r = await ctx.db.get(a.reportId);
      if (
        !r ||
        r.resolved ||
        r.expiresAt <= Date.now() ||
        profile?.communityAlerts === false
      )
        return false;
    }
    if (a.planId) {
      const p = await ctx.db.get(a.planId);
      if (
        !p ||
        p.userId !== a.userId ||
        p.revision !== a.revision ||
        !p.reminded
      )
        return false;
    }
    if (a.tripId) {
      const t = await ctx.db.get(a.tripId);
      if (
        !t ||
        t.userId !== a.userId ||
        t.status !== "waiting" ||
        profile?.nearbyAlerts === false
      )
        return false;
    }
    return true;
  },
});
