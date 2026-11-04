import { mutation } from "./_generated/server";
import { user } from "./lib/auth";
/** Called only after the signed-in user confirms deletion in the application. */
export const removeMyData = mutation({
  args: {},
  handler: async (ctx) => {
    const i = await user(ctx);
    const reports = await ctx.db
      .query("reports")
      .withIndex("by_user", (q) => q.eq("userId", i.subject))
      .collect();
    for (const r of reports) {
      const confirmations = await ctx.db
        .query("confirmations")
        .withIndex("by_report", (q) => q.eq("reportId", r._id))
        .collect();
      for (const c of confirmations) await ctx.db.delete(c._id);
      const flags = await ctx.db
        .query("flags")
        .filter((q) => q.eq(q.field("reportId"), r._id))
        .collect();
      for (const f of flags) await ctx.db.delete(f._id);
      const alerts = await ctx.db
        .query("notifications")
        .filter((q) => q.eq(q.field("reportId"), r._id))
        .collect();
      for (const a of alerts) await ctx.db.delete(a._id);
      await ctx.db.delete(r._id);
    }
    for (const table of [
      "deliveryAttempts",
      "profiles",
      "savedRoutes",
      "trips",
      "plans",
      "notifications",
      "pushSubscriptions",
    ] as const) {
      const rows = await ctx.db
        .query(table)
        .withIndex("by_user", (q) => q.eq("userId", i.subject))
        .collect();
      for (const row of rows) await ctx.db.delete(row._id);
    }
    for (const table of ["confirmations", "flags"] as const) {
      const rows = await ctx.db
        .query(table)
        .filter((q) => q.eq(q.field("userId"), i.subject))
        .collect();
      for (const row of rows) await ctx.db.delete(row._id);
    }
  },
});
