import type { MutationCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
export async function endAbandonedTrip(
  ctx: MutationCtx,
  trip: Doc<"trips">,
  status: "missed" | "expired",
  reason: string,
) {
  const current = await ctx.db.get(trip._id);
  if (!current || !["waiting", "riding"].includes(current.status)) return;
  await ctx.db.patch(trip._id, {
    status,
    endedAt: Date.now(),
    endReason: reason,
  });
  const eventKey = `${trip._id}:${status}`;
  if (
    !(await ctx.db
      .query("notifications")
      .withIndex("by_event", (q) => q.eq("eventKey", eventKey))
      .first())
  )
    await ctx.db.insert("notifications", {
      userId: trip.userId,
      kind: "trip",
      title:
        status === "missed"
          ? "Your simulated pickup was missed"
          : "Your trip has expired",
      body: reason,
      href: `/trips/${trip._id}`,
      eventKey,
      read: false,
      createdAt: Date.now(),
    });
}
