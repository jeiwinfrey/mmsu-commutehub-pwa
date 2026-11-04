import { paginationOptsValidator } from "convex/server";
import { presentReport } from "./lib/reports";
import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { user, text } from "./lib/auth";
import { commuteRoutes } from "../src/lib/commute-catalog";
import { internal } from "./_generated/api";
const expiryMinutes = (category: string) =>
  category === "crowding"
    ? 15
    : ["traffic", "queue"].includes(category)
      ? 60
      : 120;
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
      reports.map((r) => presentReport(ctx, r, identity?.subject)),
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
      description: text(a.description, 10, 500, "Report"),
      updatedAt: Date.now(),
    };
    if (a.id) {
      const old = await ctx.db.get(a.id);
      if (!old || old.userId !== i.subject)
        throw new ConvexError("Report not found.");
      if (old.resolved || old.expiresAt <= Date.now())
        throw new ConvexError("This report is no longer active.");
      if (old.routeId !== a.routeId)
        throw new ConvexError(
          "Resolve this report and post a new one to change its corridor.",
        );
      await ctx.db.patch(a.id, {
        ...data,
        expiresAt: old.createdAt + expiryMinutes(a.category) * 60000,
      });
      return a.id;
    }
    const recent = await ctx.db
      .query("reports")
      .withIndex("by_user", (q) => q.eq("userId", i.subject))
      .order("desc")
      .take(3);
    if (recent.length === 3 && recent[2].createdAt > Date.now() - 10 * 60000)
      throw new ConvexError(
        "You can share up to three reports in ten minutes. Please wait before posting again.",
      );
    const p = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", i.subject))
      .unique();
    const id = await ctx.db.insert("reports", {
      ...data,
      userId: i.subject,
      author: p?.name ?? "Commuter",
      createdAt: Date.now(),
      expiresAt: Date.now() + expiryMinutes(a.category) * 60000,
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
    if (!r || r.resolved || r.expiresAt <= Date.now())
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

export const byId = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const reportId = ctx.db.normalizeId("reports", id);
    if (!reportId) return null;
    const report = await ctx.db.get(reportId);
    if (!report) return null;
    const identity = await ctx.auth.getUserIdentity();
    return presentReport(ctx, report, identity?.subject);
  },
});
export const feed = query({
  args: {
    paginationOpts: paginationOptsValidator,
    category: v.optional(v.string()),
    routeId: v.optional(v.string()),
  },
  handler: async (ctx, { paginationOpts, category, routeId }) => {
    const identity = await ctx.auth.getUserIdentity();
    let feed = ctx.db.query("reports").withIndex("by_time").order("desc");
    if (category)
      feed = feed.filter((q) => q.eq(q.field("category"), category));
    if (routeId) feed = feed.filter((q) => q.eq(q.field("routeId"), routeId));
    const result = await feed.paginate(paginationOpts);
    return {
      ...result,
      page: await Promise.all(
        result.page.map((r) => presentReport(ctx, r, identity?.subject)),
      ),
    };
  },
});
