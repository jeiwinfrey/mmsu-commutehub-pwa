import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { user, text } from "./lib/auth";
import { commuteRoutes } from "../src/lib/commute-catalog";
import { internal } from "./_generated/api";
const fields = {
  routeId: v.string(),
  category: v.string(),
  area: v.string(),
  description: v.string(),
};
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_time")
      .order("desc")
      .take(100);
    return Promise.all(
      reports.map(async (r) => {
        const confirmations = await ctx.db
          .query("confirmations")
          .withIndex("by_report", (q) => q.eq("reportId", r._id))
          .collect();
        const { userId, ...safe } = r;
        return {
          ...safe,
          mine: identity?.subject === userId,
          confirmed: confirmations.some((c) => c.userId === identity?.subject),
          count: confirmations.length,
        };
      }),
    );
  },
});
export const publish = mutation({
  args: { ...fields, id: v.optional(v.id("reports")) },
  handler: async (ctx, a) => {
    const i = await user(ctx);
    if (
      !commuteRoutes.some((r) => r.id === a.routeId) ||
      !["traffic", "queue", "crowding", "service", "safety"].includes(
        a.category,
      )
    )
      throw new ConvexError("Invalid report category or route.");
    const data = {
      routeId: a.routeId,
      category: a.category,
      area: text(a.area, 2, 80, "Area"),
      description: text(a.description, 10, 600, "Report"),
      updatedAt: Date.now(),
    };
    if (a.id) {
      const old = await ctx.db.get(a.id);
      if (!old || old.userId !== i.subject)
        throw new ConvexError("Report not found.");
      if (old.resolved || old.expiresAt < Date.now())
        throw new ConvexError("This report is no longer active.");
      await ctx.db.patch(a.id, data);
      return a.id;
    }
    const recent = await ctx.db
      .query("reports")
      .withIndex("by_user", (q) => q.eq("userId", i.subject))
      .order("desc")
      .first();
    if (recent && Date.now() - recent.createdAt < 30000)
      throw new ConvexError("Please wait 30 seconds between reports.");
    const p = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", i.subject))
      .unique();
    const id = await ctx.db.insert("reports", {
      ...data,
      userId: i.subject,
      author: p?.name ?? "Commuter",
      createdAt: Date.now(),
      expiresAt: Date.now() + 2 * 3600000,
      resolved: false,
    });
    await ctx.scheduler.runAfter(0, internal.notifications.fanout, {
      reportId: id,
    });
    return id;
  },
});
export const resolve = mutation({
  args: { id: v.id("reports") },
  handler: async (ctx, { id }) => {
    const i = await user(ctx),
      r = await ctx.db.get(id);
    if (!r || r.userId !== i.subject)
      throw new ConvexError("Report not found.");
    await ctx.db.patch(id, { resolved: true, updatedAt: Date.now() });
  },
});
export const confirm = mutation({
  args: { id: v.id("reports") },
  handler: async (ctx, { id }) => {
    const i = await user(ctx),
      r = await ctx.db.get(id);
    if (!r || r.resolved || r.expiresAt < Date.now())
      throw new ConvexError("Report is no longer active.");
    if (r.userId === i.subject)
      throw new ConvexError("You cannot confirm your own report.");
    const old = await ctx.db
      .query("confirmations")
      .withIndex("by_user_report", (q) =>
        q.eq("userId", i.subject).eq("reportId", id),
      )
      .unique();
    if (old) await ctx.db.delete(old._id);
    else
      await ctx.db.insert("confirmations", { userId: i.subject, reportId: id });
  },
});
export const flag = mutation({
  args: { id: v.id("reports"), reason: v.string() },
  handler: async (ctx, { id, reason }) => {
    const i = await user(ctx);
    if (!(await ctx.db.get(id))) throw new ConvexError("Report not found.");
    const old = await ctx.db
      .query("flags")
      .withIndex("by_user_report", (q) =>
        q.eq("userId", i.subject).eq("reportId", id),
      )
      .unique();
    if (!old)
      await ctx.db.insert("flags", {
        userId: i.subject,
        reportId: id,
        reason: text(reason, 3, 200, "Reason"),
      });
  },
});
