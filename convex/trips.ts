import { paginationOptsValidator } from "convex/server";
import { query, mutation, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { user } from "./lib/auth";
import { commuteRoutes, estimateFare } from "../src/lib/commute-catalog";
import {
  fleetNetwork,
  offerForRoute,
  projectFleetVehicle,
  BOARDING_GRACE_SECONDS,
} from "../src/lib/fleet-simulation";
import { internal } from "./_generated/api";
import { endAbandonedTrip } from "./lib/tripLifecycle";
const isActive = (status: string) =>
  status === "waiting" || status === "riding";
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await user(ctx);
    return ctx.db
      .query("trips")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(100);
  },
});
export const byId = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const identity = await user(ctx),
      tripId = ctx.db.normalizeId("trips", id);
    if (!tripId) return null;
    const trip = await ctx.db.get(tripId);
    return trip?.userId === identity.subject ? trip : null;
  },
});
export const active = query({
  args: {},
  handler: async (ctx) => {
    const identity = await user(ctx);
    return ctx.db
      .query("trips")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
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
    const identity = await user(ctx);
    return ctx.db
      .query("trips")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .filter((q) =>
        q.and(
          q.neq(q.field("status"), "waiting"),
          q.neq(q.field("status"), "riding"),
        ),
      )
      .paginate(paginationOpts);
  },
});
export const tracking = query({
  args: {},
  handler: async (ctx) => {
    const identity = await user(ctx);
    const trip = await ctx.db
      .query("trips")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "waiting"),
          q.eq(q.field("status"), "riding"),
        ),
      )
      .first();
    if (!trip) return null;
    const actor = await ctx.db
      .query("vehicles")
      .withIndex("by_key", (q) => q.eq("key", trip.vehicleId))
      .unique();
    if (!actor) return { trip, vehicle: null, heartbeatAt: 0 };
    const roads = await ctx.db.query("roadPaths").collect(),
      network = fleetNetwork(roads),
      clock = await ctx.db
        .query("simulationState")
        .withIndex("by_key", (q) => q.eq("key", "fleet-clock"))
        .first();
    return {
      trip,
      vehicle: projectFleetVehicle(actor, network, Date.now()),
      heartbeatAt: clock?.updatedAt ?? 0,
    };
  },
});
export const start = mutation({
  args: {
    routeId: v.string(),
    vehicleId: v.string(),
    runId: v.optional(v.string()),
    from: v.string(),
    to: v.string(),
    pickupId: v.string(),
    radius: v.number(),
    student: v.boolean(),
  },
  handler: async (ctx, a) => {
    const identity = await user(ctx),
      now = Date.now(),
      route = commuteRoutes.find((r) => r.id === a.routeId),
      fare = route && estimateFare(route, a.pickupId, a.to);
    if (!route || !fare || ![100, 250, 500, 1000].includes(a.radius))
      throw new ConvexError("Invalid journey.");
    const from = route.stops.findIndex((s) => s.id === a.from),
      pickup = route.stops.findIndex((s) => s.id === a.pickupId);
    if (from < 0 || pickup < from)
      throw new ConvexError("Pickup must follow your origin.");
    const actor = await ctx.db
      .query("vehicles")
      .withIndex("by_key", (q) => q.eq("key", a.vehicleId))
      .unique();
    if (!actor || actor.occupancy === "full")
      throw new ConvexError("This vehicle is unavailable.");
    const roads = await ctx.db.query("roadPaths").collect(),
      network = fleetNetwork(roads);
    const offer = offerForRoute(
      actor,
      network,
      route.id,
      a.pickupId,
      a.to,
      now,
      a.runId,
    );
    if (!offer)
      throw new ConvexError(
        "This simulated run has ended or passed your pickup. Choose another vehicle.",
      );
    const existing = await ctx.db
      .query("trips")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
    if (existing.some((t) => isActive(t.status)))
      throw new ConvexError("Finish or cancel your active trip first.");
    const expiryAt = offer.pickupDepartsAt + BOARDING_GRACE_SECONDS * 1000;
    const id = await ctx.db.insert("trips", {
      ...a,
      userId: identity.subject,
      fareCentavos: a.student ? fare.studentCentavos : fare.regularCentavos,
      fareVersion: "illustrative-tariff-v1",
      status: "waiting",
      notified: false,
      createdAt: now,
      runId: offer.runId,
      runOrdinal: offer.runOrdinal,
      runVersion: offer.runVersion,
      runStartAt: offer.runStartAt,
      runEndAt: offer.runEndAt,
      pickupArrivesAt: offer.pickupArrivesAt,
      pickupDepartsAt: offer.pickupDepartsAt,
      destinationArrivesAt: offer.destinationArrivesAt,
      watchVersion: 1,
      expiryAt,
    });
    await ctx.scheduler.runAt(Math.max(now, expiryAt), internal.trips.expire, {
      id,
      status: "waiting",
      expectedAt: expiryAt,
    });
    await ctx.scheduler.runAfter(0, internal.vehicles.tick, {});
    return id;
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
    const identity = await user(ctx),
      trip = await ctx.db.get(id);
    if (!trip || trip.userId !== identity.subject)
      throw new ConvexError("Trip not found.");
    const allowed =
      trip.status === "waiting"
        ? ["riding", "cancelled"]
        : trip.status === "riding"
          ? ["completed", "cancelled"]
          : [];
    if (!allowed.includes(status))
      throw new ConvexError("This trip cannot change to that state.");
    const now = Date.now();
    if (status === "riding") {
      const expiryAt = now + 12 * 3600000;
      await ctx.db.patch(id, { status, boardedAt: now, expiryAt });
      await ctx.scheduler.runAt(expiryAt, internal.trips.expire, {
        id,
        status: "riding",
        expectedAt: expiryAt,
      });
      if (trip.destinationArrivesAt)
        await ctx.scheduler.runAt(
          Math.max(now, trip.destinationArrivesAt),
          internal.trips.detectArrival,
          { id, runId: trip.runId ?? "legacy" },
        );
    } else await ctx.db.patch(id, { status, endedAt: now });
  },
});
export const remove = mutation({
  args: { id: v.id("trips") },
  handler: async (ctx, { id }) => {
    const identity = await user(ctx),
      trip = await ctx.db.get(id);
    if (!trip || trip.userId !== identity.subject)
      throw new ConvexError("Trip not found.");
    if (isActive(trip.status))
      throw new ConvexError(
        "Finish or cancel an active trip before deleting it.",
      );
    await ctx.db.delete(id);
  },
});
export const expire = internalMutation({
  args: {
    id: v.id("trips"),
    status: v.union(v.literal("waiting"), v.literal("riding")),
    expectedAt: v.number(),
  },
  handler: async (ctx, a) => {
    const trip = await ctx.db.get(a.id);
    if (
      !trip ||
      trip.status !== a.status ||
      trip.expiryAt !== a.expectedAt ||
      Date.now() < a.expectedAt
    )
      return;
    await endAbandonedTrip(
      ctx,
      trip,
      a.status === "waiting" ? "missed" : "expired",
      a.status === "waiting"
        ? "The selected simulated run passed your pickup without boarding being recorded. Choose another vehicle."
        : "This trip was still marked riding after twelve hours. It was closed without assuming that you reached your destination.",
    );
  },
});
export const detectArrival = internalMutation({
  args: { id: v.id("trips"), runId: v.string() },
  handler: async (ctx, { id, runId }) => {
    const trip = await ctx.db.get(id);
    if (
      !trip ||
      trip.status !== "riding" ||
      trip.runId !== runId ||
      !trip.destinationArrivesAt ||
      Date.now() < trip.destinationArrivesAt ||
      trip.arrivalDetectedAt
    )
      return;
    await ctx.db.patch(id, { arrivalDetectedAt: Date.now() });
    const eventKey = `${id}:${runId}:arrival`;
    await ctx.db.insert("notifications", {
      userId: trip.userId,
      eventKey,
      kind: "trip",
      title: "Your simulated ride reached the destination",
      body: "Confirm your own arrival in Trips. The simulation does not confirm that you have alighted or reached class.",
      href: `/trips/${id}`,
      read: false,
      createdAt: Date.now(),
    });
  },
});
