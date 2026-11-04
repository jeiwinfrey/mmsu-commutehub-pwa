import { query, mutation, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { user } from "./lib/auth";
import { internal } from "./_generated/api";
export const list = query({
  args: {},
  handler: async (ctx) => {
    const i = await user(ctx);
    return ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", i.subject))
      .order("desc")
      .take(100);
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
    const profiles = await ctx.db.query("profiles").collect();
    for (const p of profiles) {
      if (p.userId === r.userId || !p.communityAlerts) continue;
      const saved = await ctx.db
        .query("savedRoutes")
        .withIndex("by_user", (q) => q.eq("userId", p.userId))
        .collect();
      if (!saved.some((s) => s.routeId === r.routeId)) continue;
      const payload = {
        kind: "community",
        title: `${r.category} report · ${r.area}`,
        body: r.description,
        href: `/community?report=${r._id}`,
      };
      await ctx.db.insert("notifications", {
        ...payload,
        userId: p.userId,
        reportId: r._id,
        read: false,
        createdAt: Date.now(),
      });
      await ctx.scheduler.runAfter(0, internal.push.send, {
        userId: p.userId,
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
