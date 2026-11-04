import type { QueryCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
export async function presentReport(
  ctx: QueryCtx,
  report: Doc<"reports">,
  subject?: string,
) {
  const confirmations = await ctx.db
    .query("confirmations")
    .withIndex("by_report", (q) => q.eq("reportId", report._id))
    .collect();
  const { userId, ...safe } = report;
  return {
    ...safe,
    mine: subject === userId,
    confirmed: confirmations.some((c) => c.userId === subject),
    count: confirmations.length,
  };
}
