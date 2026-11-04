import { paginationOptsValidator } from "convex/server";
import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { user } from "./lib/auth";
import { commuteRoutes, estimateFare } from "../src/lib/commute-catalog";
export const list = query({
  args: {},
  handler: async (ctx) => {
    const i = await user(ctx);
    return ctx.db
      .query("trips")
      .withIndex("by_user", (q) => q.eq("userId", i.subject))
      .order("desc")
      .take(100);
  },
});
export const start = mutation({
  args: {
    routeId: v.string(),
    vehicleId: v.string(),
    from: v.string(),
    to: v.string(),
    pickupId: v.string(),
    radius: v.number(),
    student: v.boolean(),
  },
  handler: async (ctx, a) => {
    const i = await user(ctx);
    const r = commuteRoutes.find((r) => r.id === a.routeId);
    const fare = r && estimateFare(r, a.pickupId, a.to);
    if (!r || !fare || ![100, 250, 500, 1000].includes(a.radius))
      throw new ConvexError("Invalid journey.");
    const from = r.stops.findIndex((s) => s.id === a.from),
      pickup = r.stops.findIndex((s) => s.id === a.pickupId);
    if (from < 0 || pickup < from)
      throw new ConvexError("Pickup must follow your origin.");
    const vehicle = await ctx.db
      .query("vehicles")
      .withIndex("by_key", (q) => q.eq("key", a.vehicleId))
      .unique();
    if (!vehicle || vehicle.routeId !== r.id || vehicle.occupancy === "full")
      throw new ConvexError("This vehicle is unavailable.");
    const existing = await ctx.db
      .query("trips")
      .withIndex("by_user", (q) => q.eq("userId", i.subject))
      .collect();
    if (existing.some((t) => t.status === "waiting" || t.status === "riding"))
      throw new ConvexError("Finish or cancel your active trip first.");
    return ctx.db.insert("trips", {
      ...a,
      userId: i.subject,
      fareCentavos: a.student ? fare.studentCentavos : fare.regularCentavos,
      status: "waiting",
      notified: false,
      createdAt: Date.now(),
    });
  },
});
export const update = mutation({
  args: {
    id: v.id("trips"),
    status: v.union(
      v.literal("riding"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
  },
  handler: async (ctx, { id, status }) => {
    const i = await user(ctx),
      trip = await ctx.db.get(id);
    if (!trip || trip.userId !== i.subject)
      throw new ConvexError("Trip not found.");
    const allowed =
      trip.status === "waiting"
        ? ["riding", "cancelled"]
        : trip.status === "riding"
          ? ["completed", "cancelled"]
          : [];
    if (!allowed.includes(status))
      throw new ConvexError("This trip cannot change to that state.");
    await ctx.db.patch(id, {
      status,
      ...(status === "riding"
        ? { boardedAt: Date.now() }
        : { endedAt: Date.now() }),
    });
  },
});
export const active = query({
  args: {},
  handler: async (ctx) => {
    const i = await user(ctx);
    return ctx.db
      .query("trips")
      .withIndex("by_user", (q) => q.eq("userId", i.subject))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "waiting"),
          q.eq(q.field("status"), "riding"),
        ),
      )
      .first();
  },
});
export const history = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    const i = await user(ctx);
    return ctx.db
      .query("trips")
      .withIndex("by_user", (q) => q.eq("userId", i.subject))
      .order("desc")
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "completed"),
          q.eq(q.field("status"), "cancelled"),
        ),
      )
      .paginate(paginationOpts);
  },
});
export const remove = mutation({
  args: { id: v.id("trips") },
  handler: async (ctx, { id }) => {
    const i = await user(ctx),
      trip = await ctx.db.get(id);
    if (!trip || trip.userId !== i.subject)
      throw new ConvexError("Trip not found.");
    if (trip.status === "waiting" || trip.status === "riding")
      throw new ConvexError(
        "Finish or cancel an active trip before deleting it.",
      );
    await ctx.db.delete(id);
  },
});
