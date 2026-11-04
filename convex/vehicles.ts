import { sweptDistance } from "./lib/geometry";
import { v } from "convex/values";
import { query, internalMutation, internalAction } from "./_generated/server";
import {
  commuteRoutes,
  vehiclesFor,
  distanceMeters,
} from "../src/lib/commute-catalog";
import { internal } from "./_generated/api";
export const list = query({
  args: {},
  handler: async (ctx) => {
    const vehicles = await ctx.db.query("vehicles").collect();
    const paths = await ctx.db.query("roadPaths").collect();
    const now = Date.now();
    return vehicles.map((vehicle) => {
      const route = commuteRoutes.find((r) => r.id === vehicle.routeId)!;
      const points = (paths.find((p) => p.routeId === route.id)?.points ??
        route.stops.map((s) => s.coordinates)) as [number, number][];
      let total = 0;
      for (let i = 1; i < points.length; i++)
        total += distanceMeters(points[i - 1], points[i]);
      return {
        ...vehicle,
        phase:
          (vehicle.phase +
            ((Math.max(0, now - vehicle.updatedAt) / 1000) * vehicle.speedKmh) /
              3.6 /
              total) %
          1,
        updatedAt: now,
      };
    });
  },
});
// Only operations are simulated. Shared server clock, never a user's precise location.
export const tick = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const waiting = await ctx.db
      .query("trips")
      .withIndex("by_status", (q) => q.eq("status", "waiting"))
      .collect();
    const plans = await ctx.db
      .query("plans")
      .withIndex("by_leave", (q) =>
        q.gte("leaveAt", now - 120000).lte("leaveAt", now),
      )
      .collect();
    const existing = await ctx.db.query("vehicles").first();
    // Avoid reading road geometry and writing the fleet all night when nobody is waiting.
    if (existing && !waiting.length && !plans.some((p) => !p.reminded)) return;
    const paths = await ctx.db.query("roadPaths").collect();
    let vehicles = await ctx.db.query("vehicles").collect();
    if (!vehicles.length) {
      for (const r of commuteRoutes) {
        for (const [i, v] of vehiclesFor(
          r,
          r.stops[0].id,
          r.stops.at(-1)!.id,
        ).entries()) {
          await ctx.db.insert("vehicles", {
            key: v.id,
            routeId: r.id,
            label: v.label.replace("Sample ", "Simulated "),
            speedKmh: r.speedKmh,
            occupancy: v.occupancy,
            phase: i * 0.24,
            updatedAt: now,
          });
        }
      }
      vehicles = await ctx.db.query("vehicles").collect();
    }
    const previousVehicles = new Map(
      vehicles.map((v) => [v.key, { phase: v.phase, updatedAt: v.updatedAt }]),
    );
    for (const vehicle of vehicles) {
      const route = commuteRoutes.find((r) => r.id === vehicle.routeId)!;
      const road = paths.find((p) => p.routeId === route.id);
      const points = road?.points as [number, number][] | undefined;
      let total = 0;
      const geometry = points ?? route.stops.map((s) => s.coordinates);
      for (let j = 1; j < geometry.length; j++)
        total += distanceMeters(geometry[j - 1], geometry[j]);
      const phase =
        (vehicle.phase +
          (Math.max(0, (now - vehicle.updatedAt) / 1000) * vehicle.speedKmh) /
            3.6 /
            total) %
        1;
      await ctx.db.patch(vehicle._id, { phase, updatedAt: now });
      vehicle.phase = phase;
    }
    for (const t of waiting) {
      if (t.notified) continue;
      const vehicle = vehicles.find((v) => v.key === t.vehicleId),
        r = commuteRoutes.find((r) => r.id === t.routeId);
      if (!vehicle || !r) continue;
      const road = paths.find((p) => p.routeId === r.id);
      const points = (road?.points ?? r.stops.map((s) => s.coordinates)) as [
        number,
        number,
      ][];
      const pickup = r.stops.find((s) => s.id === t.pickupId)!;
      const previous = previousVehicles.get(vehicle.key)!;
      let routeLength = 0;
      for (let j = 1; j < points.length; j++)
        routeLength += distanceMeters(points[j - 1], points[j]);
      const began = Math.max(t.createdAt, previous.updatedAt);
      const previousPhase =
        (previous.phase +
          ((Math.max(0, began - previous.updatedAt) / 1000) *
            vehicle.speedKmh) /
            3.6 /
            routeLength) %
        1;
      const travelled =
        ((Math.max(0, now - began) / 1000) * vehicle.speedKmh) /
        3.6 /
        routeLength;
      const remaining = sweptDistance(
        points,
        travelled >= 1 ? 0 : previousPhase,
        travelled >= 1 ? 1 : vehicle.phase,
        pickup.coordinates,
      );
      if (remaining <= t.radius) {
        await ctx.db.patch(t._id, { notified: true });
        const p = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", t.userId))
          .unique();
        if (p?.nearbyAlerts !== false) {
          const payload = {
            kind: "proximity",
            title: "Your simulated vehicle is nearby",
            body: `It entered your ${t.radius} m pickup area. Get ready; boarding is not guaranteed.`,
            href: "/commute/tracking",
          };
          await ctx.db.insert("notifications", {
            ...payload,
            userId: t.userId,
            read: false,
            createdAt: now,
          });
          await ctx.scheduler.runAfter(0, internal.push.send, {
            ...payload,
            userId: t.userId,
          });
        }
      }
    }
    for (const p of plans)
      if (!p.reminded && p.leaveAt <= now && p.leaveAt > now - 120000) {
        await ctx.db.patch(p._id, { reminded: true });
        const payload = {
          kind: "planner",
          title: "Time to leave for class",
          body: "Your saved departure time has arrived. Check current conditions before travelling.",
          href: "/planner",
        };
        await ctx.db.insert("notifications", {
          ...payload,
          userId: p.userId,
          read: false,
          createdAt: now,
        });
        await ctx.scheduler.runAfter(0, internal.push.send, {
          ...payload,
          userId: p.userId,
        });
      }
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
