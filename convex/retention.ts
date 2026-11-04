import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
/** Bounded cleanup; follow-up batches continue only while eligible rows remain. */
export const clean = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now(),
      attempts = await ctx.db
        .query("deliveryAttempts")
        .withIndex("by_created", (q) => q.lt("createdAt", now - 30 * 86400000))
        .take(100);
    for (const attempt of attempts) await ctx.db.delete(attempt._id);
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_created", (q) => q.lt("createdAt", now - 90 * 86400000))
      .take(100);
    for (const notification of notifications)
      await ctx.db.delete(notification._id);
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_expiry", (q) => q.lt("expiresAt", now - 90 * 86400000))
      .filter((q) => q.neq(q.field("retentionHold"), true))
      .take(10);
    for (const report of reports) {
      const flags = await ctx.db
        .query("flags")
        .withIndex("by_report", (q) => q.eq("reportId", report._id))
        .take(1);
      if (flags.length) {
        await ctx.db.patch(report._id, { retentionHold: true });
        continue;
      }
      const confirmations = await ctx.db
        .query("confirmations")
        .withIndex("by_report", (q) => q.eq("reportId", report._id))
        .take(100);
      for (const confirmation of confirmations)
        await ctx.db.delete(confirmation._id);
      const alerts = await ctx.db
        .query("notifications")
        .withIndex("by_report", (q) => q.eq("reportId", report._id))
        .take(100);
      for (const alert of alerts) await ctx.db.delete(alert._id);
      if (confirmations.length < 100 && alerts.length < 100)
        await ctx.db.delete(report._id);
    }
    if (
      attempts.length === 100 ||
      notifications.length === 100 ||
      reports.length === 10
    )
      await ctx.scheduler.runAfter(1000, internal.retention.clean, {});
  },
});
