import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { isModerator, moderator } from "./lib/moderator";
import { text } from "./lib/auth";
export const access = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return Boolean(identity && isModerator(identity.subject));
  },
});
export const queue = query({
  args: { paginationOpts: paginationOptsValidator, reviewed: v.boolean() },
  handler: async (ctx, { paginationOpts, reviewed }) => {
    await moderator(ctx);
    const result = await ctx.db
      .query("flags")
      .withIndex("by_reviewed", (q) =>
        reviewed
          ? q.gt("reviewedAt", undefined)
          : q.eq("reviewedAt", undefined),
      )
      .order("desc")
      .paginate(paginationOpts);
    return {
      ...result,
      page: await Promise.all(
        result.page.map(async (flag) => {
          const report = await ctx.db.get(flag.reportId);
          return {
            id: flag._id,
            reason: flag.reason,
            createdAt: flag._creationTime,
            reviewedAt: flag.reviewedAt,
            report: report
              ? {
                  id: report._id,
                  author: report.author,
                  category: report.category,
                  area: report.area,
                  description: report.description,
                  routeId: report.routeId,
                  createdAt: report.createdAt,
                  expiresAt: report.expiresAt,
                  hidden: report.hidden ?? false,
                  resolved: report.resolved,
                }
              : null,
          };
        }),
      ),
    };
  },
});
export const history = query({
  args: { reportId: v.id("reports") },
  handler: async (ctx, { reportId }) => {
    await moderator(ctx);
    // Actor identifiers remain private; the server retains them for investigation.
    const events = await ctx.db
      .query("moderationAudit")
      .withIndex("by_report", (q) => q.eq("reportId", reportId))
      .order("desc")
      .take(50);
    return events.map(({ actor: _actor, ...event }) => {
      void _actor;
      return event;
    });
  },
});
export const review = mutation({
  args: {
    flagId: v.id("flags"),
    action: v.union(
      v.literal("hide"),
      v.literal("reinstate"),
      v.literal("resolve"),
      v.literal("dismiss"),
    ),
    reason: v.string(),
  },
  handler: async (ctx, { flagId, action, reason }) => {
    const identity = await moderator(ctx);
    const explanation = text(reason, 10, 500, "Review reason");
    const flag = await ctx.db.get(flagId);
    if (!flag) throw new ConvexError("Flag no longer exists.");
    const report = await ctx.db.get(flag.reportId);
    if (!report) throw new ConvexError("Report no longer exists.");
    const hidden =
      action === "hide"
        ? true
        : action === "reinstate"
          ? false
          : Boolean(report.hidden);
    const resolved = action === "resolve" ? true : report.resolved;
    if (
      (action === "hide" && report.hidden) ||
      (action === "reinstate" && !report.hidden) ||
      (action === "resolve" && report.resolved) ||
      (action === "dismiss" && flag.reviewedAt)
    )
      throw new ConvexError(
        "This decision is already applied. Refresh the review.",
      );
    const now = Date.now();
    await ctx.db.patch(report._id, {
      hidden,
      resolved,
      updatedAt: now,
      retentionHold: true,
    });
    await ctx.db.patch(flagId, { reviewedAt: now });
    await ctx.db.insert("moderationAudit", {
      reportId: report._id,
      actor: identity.subject,
      action,
      reason: explanation,
      beforeHidden: Boolean(report.hidden),
      afterHidden: hidden,
      beforeResolved: report.resolved,
      afterResolved: resolved,
      createdAt: now,
    });
    // Restoration never extends expiry, resets confirmations, or re-sends alerts.
  },
});
