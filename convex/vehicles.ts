import {
  fleetNetwork,
  projectFleetVehicle,
  offerForRoute,
  runAtOrdinal,
  runMetersAt,
  BOARDING_GRACE_SECONDS,
  FLEET_VERSION,
} from "../src/lib/fleet-simulation";
import { endAbandonedTrip } from "./lib/tripLifecycle";
import { sweptDistance } from "./lib/geometry";
import { v, ConvexError } from "convex/values";
import {
  query,
  action,
  internalMutation,
  internalAction,
} from "./_generated/server";
import {
  commuteRoutes,
  vehiclesFor,
  matchingRoutes,
} from "../src/lib/commute-catalog";
import { internal } from "./_generated/api";
export const list = query({
  args: {},
  handler: async (ctx) => {
    await ctx.db
      .query("simulationState")
      .withIndex("by_key", (q) => q.eq("key", "fleet-clock"))
      .first();
    const actors = await ctx.db.query("vehicles").collect(),
      roads = await ctx.db.query("roadPaths").collect(),
      network = fleetNetwork(roads),
      now = Date.now();
    return actors.map((actor) => projectFleetVehicle(actor, network, now));
  },
});
export const offers = query({
  args: {
    from: v.string(),
    to: v.string(),
    routeId: v.optional(v.string()),
    refreshBucket: v.optional(v.number()),
  },
  handler: async (ctx, a) => {
    await ctx.db
      .query("simulationState")
      .withIndex("by_key", (q) => q.eq("key", "fleet-clock"))
      .first();
    const actors = await ctx.db.query("vehicles").collect(),
      roads = await ctx.db.query("roadPaths").collect(),
      network = fleetNetwork(roads),
      now = Date.now(),
      routes = matchingRoutes(a.from, a.to).filter(
        (r) => !a.routeId || r.id === a.routeId,
      );
    const offers = [];
    for (const route of routes)
      for (const actor of actors) {
        const home = commuteRoutes.find((r) => r.id === actor.routeId);
        if (home?.mode !== route.mode || home.corridor !== route.corridor)
          continue;
        const offer = offerForRoute(
          actor,
          network,
          route.id,
          a.from,
          a.to,
          now,
        );
        if (offer) offers.push(offer);
      }
    return offers.sort((a, b) => a.pickupArrivesAt - b.pickupArrivesAt);
  },
});
export const tick = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    if (!(await ctx.db.query("vehicles").first())) {
      for (const route of commuteRoutes)
        for (const [i, vehicle] of vehiclesFor(
          route,
          route.stops[0].id,
          route.stops.at(-1)!.id,
        ).entries())
          await ctx.db.insert("vehicles", {
            key: vehicle.id,
            routeId: route.id,
            label: vehicle.label.replace("Sample ", "Simulated "),
            speedKmh: route.speedKmh,
            occupancy: vehicle.occupancy,
            phase: i * 0.24,
            updatedAt: now,
            scenarioEpoch: now,
          });
    }
    const waiting = await ctx.db
      .query("trips")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .collect();
    const eligible = waiting.filter(
      (t) => !t.runStartAt || t.runStartAt <= now,
    );
    if (!eligible.length) return;
    const actors = await ctx.db.query("vehicles").collect(),
      roads = await ctx.db.query("roadPaths").collect(),
      network = fleetNetwork(roads),
      clock = await ctx.db
        .query("simulationState")
        .withIndex("by_key", (q) => q.eq("key", "fleet-clock"))
        .first();
    for (const original of eligible) {
      let trip = original;
      const actor = actors.find((a) => a.key === trip.vehicleId);
      if (!actor) {
        await endAbandonedTrip(
          ctx,
          trip,
          "expired",
          "The selected simulated vehicle is no longer available. Choose a new run.",
        );
        continue;
      }
      if (!trip.runId || trip.runOrdinal === undefined) {
        const offer = offerForRoute(
          actor,
          network,
          trip.routeId,
          trip.pickupId,
          trip.to,
          now,
        );
        if (!offer) {
          await endAbandonedTrip(
            ctx,
            trip,
            "expired",
            "The old simulated watch could not be resumed. Select a new run.",
          );
          continue;
        }
        const snapshot = {
          runId: offer.runId,
          runOrdinal: offer.runOrdinal,
          runVersion: offer.runVersion,
          runStartAt: offer.runStartAt,
          runEndAt: offer.runEndAt,
          pickupArrivesAt: offer.pickupArrivesAt,
          pickupDepartsAt: offer.pickupDepartsAt,
          destinationArrivesAt: offer.destinationArrivesAt,
          expiryAt: offer.pickupDepartsAt + BOARDING_GRACE_SECONDS * 1000,
          watchVersion: 1,
        };
        await ctx.db.patch(trip._id, snapshot);
        trip = { ...trip, ...snapshot };
        await ctx.scheduler.runAt(
          Math.max(now, snapshot.expiryAt),
          internal.trips.expire,
          { id: trip._id, status: "waiting", expectedAt: snapshot.expiryAt },
        );
      }
      const run = runAtOrdinal(actor, network, trip.runOrdinal!);
      if (run.version !== trip.runVersion) {
        await endAbandonedTrip(
          ctx,
          trip,
          "expired",
          "The simulated road route changed. Choose a fresh vehicle run.",
        );
        continue;
      }
      if (now > trip.pickupDepartsAt! + BOARDING_GRACE_SECONDS * 1000) {
        await endAbandonedTrip(
          ctx,
          trip,
          "missed",
          "The selected run passed your pickup without boarding being recorded. Choose another vehicle; a new loop will not restart this trip.",
        );
        continue;
      }
      if (now < run.startAt) continue;
      const pickup = run.leg.route.stops.find((s) => s.id === trip.pickupId)!;
      const began = Math.max(
          run.startAt,
          trip.createdAt,
          clock?.updatedAt ?? trip.createdAt,
        ),
        before = runMetersAt(run, began),
        current = runMetersAt(run, now);
      const pickupProgress = run.leg.stops.find(
        (stop) => stop.id === trip.pickupId,
      )!;
      if (
        current.meters > pickupProgress.meters + 30 &&
        now > trip.pickupDepartsAt!
      ) {
        await endAbandonedTrip(
          ctx,
          trip,
          "missed",
          "The selected run passed your pickup without boarding being recorded. Select another vehicle run.",
        );
        continue;
      }
      if (trip.notified) continue;
      const distance = sweptDistance(
        run.leg.points,
        before.meters / run.leg.meters,
        current.meters / run.leg.meters,
        pickup.coordinates,
      );
      if (distance <= trip.radius) {
        await ctx.db.patch(trip._id, { notified: true, notifiedAt: now });
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", trip.userId))
          .unique();
        if (profile?.nearbyAlerts !== false) {
          const eventKey = `${trip._id}:${trip.runId}:${trip.watchVersion ?? 1}:proximity`;
          if (
            !(await ctx.db
              .query("notifications")
              .withIndex("by_event", (q) => q.eq("eventKey", eventKey))
              .first())
          ) {
            const payload = {
              kind: "proximity",
              title: "Your simulated vehicle is nearby",
              body: `It entered your ${trip.radius} m pickup area. Get ready; boarding is not guaranteed.`,
              href: "/commute/tracking",
            };
            await ctx.db.insert("notifications", {
              ...payload,
              userId: trip.userId,
              eventKey,
              read: false,
              createdAt: now,
            });
            await ctx.scheduler.runAfter(0, internal.push.send, {
              ...payload,
              userId: trip.userId,
              tripId: trip._id,
            });
          }
        }
      }
    }
    if (clock)
      await ctx.db.patch(clock._id, { updatedAt: now, version: FLEET_VERSION });
    else
      await ctx.db.insert("simulationState", {
        key: "fleet-clock",
        updatedAt: now,
        version: FLEET_VERSION,
      });
  },
});

export const paths = query({
  args: {},
  handler: async (ctx) => ctx.db.query("roadPaths").collect(),
});
export const storePath = internalMutation({
  args: {
    routeId: v.string(),
    points: v.array(v.array(v.number())),
    source: v.string(),
  },
  handler: async (ctx, a) => {
    const old = await ctx.db
      .query("roadPaths")
      .withIndex("by_route", (q) => q.eq("routeId", a.routeId))
      .unique();
    if (old) await ctx.db.patch(old._id, { ...a, updatedAt: Date.now() });
    else await ctx.db.insert("roadPaths", { ...a, updatedAt: Date.now() });
  },
});
export const seedPaths = internalAction({
  args: {},
  handler: async (ctx) => {
    for (const route of commuteRoutes) {
      const coords = route.stops.map((s) => s.coordinates.join(",")).join(";");
      let points: number[][] = route.stops.map((s) => s.coordinates),
        source = "schematic";
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`,
          { signal: AbortSignal.timeout(20000) },
        );
        const data = await response.json();
        if (
          response.ok &&
          data.code === "Ok" &&
          data.routes?.[0]?.geometry?.coordinates?.length > 1
        ) {
          points = data.routes[0].geometry.coordinates;
          source = "osrm";
        }
      } catch {
        console.warn("Road geometry unavailable for", route.id);
      }
      await ctx.runMutation(internal.vehicles.storePath, {
        routeId: route.id,
        points,
        source,
      });
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
  },
});

export const claimRouteRetry = internalMutation({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }) => {
    const route = commuteRoutes.find((r) => r.id === routeId);
    if (!route) throw new ConvexError("Unknown corridor.");
    const paths = await ctx.db.query("roadPaths").collect(),
      path = paths.find((p) => p.routeId === routeId);
    if (path?.source === "osrm") return "ready" as const;
    const now = Date.now();
    if (now - (path?.retryAt ?? 0) < 60000) return "cooldown" as const;
    if (now - Math.max(0, ...paths.map((p) => p.retryAt ?? 0)) < 1200)
      return "busy" as const;
    if (path) await ctx.db.patch(path._id, { retryAt: now });
    else
      await ctx.db.insert("roadPaths", {
        routeId,
        points: route.stops.map((s) => s.coordinates),
        source: "schematic",
        updatedAt: now,
        retryAt: now,
      });
    return "claimed" as const;
  },
});
export const retryPath = action({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }): Promise<{ source: "osrm" }> => {
    const route = commuteRoutes.find((r) => r.id === routeId);
    if (!route) throw new ConvexError("Unknown corridor.");
    const claim = await ctx.runMutation(internal.vehicles.claimRouteRetry, {
      routeId,
    });
    if (claim === "ready") return { source: "osrm" };
    if (claim !== "claimed")
      throw new ConvexError(
        claim === "cooldown"
          ? "Please wait one minute before retrying this road route. Manual stop selection still works."
          : "Routing is handling another request. Try again in a moment.",
      );
    try {
      const coordinates = route.stops
        .map((s) => s.coordinates.join(","))
        .join(";");
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`,
        { signal: AbortSignal.timeout(20000) },
      );
      const data = await response.json(),
        points: unknown = data.routes?.[0]?.geometry?.coordinates;
      if (
        !response.ok ||
        data.code !== "Ok" ||
        !Array.isArray(points) ||
        points.length < 2 ||
        points.length > 100000 ||
        !points.every(
          (p) =>
            Array.isArray(p) &&
            p.length >= 2 &&
            Number.isFinite(p[0]) &&
            Number.isFinite(p[1]) &&
            Math.abs(p[0]) <= 180 &&
            Math.abs(p[1]) <= 90,
        )
      )
        throw new Error("Invalid road geometry");
      await ctx.runMutation(internal.vehicles.storePath, {
        routeId,
        points: points as number[][],
        source: "osrm",
      });
      return { source: "osrm" };
    } catch {
      throw new ConvexError(
        "Road routing is unavailable. You can still select a listed pickup stop.",
      );
    }
  },
});
