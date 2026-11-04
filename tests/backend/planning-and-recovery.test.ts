/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { test, expect, vi, afterEach } from "vitest";
import { api, internal } from "../../convex/_generated/api";
import schema from "../../convex/schema";
import { commuteRoutes } from "../../src/lib/commute-catalog";
import { planRoute, serviceFor } from "../../convex/lib/planning";
const modules = import.meta.glob("../../convex/**/*.ts"),
  route = commuteRoutes.find(
    (r) => r.id === "modern-jeepney-jeepney-outbound",
  )!;
const points = route.stops.map((s) => s.coordinates);
const classAt = Date.parse("2026-11-05T10:00:00+08:00"),
  now = Date.parse("2026-11-04T12:00:00+08:00");
const defaults = {
  name: "QA",
  campus: "MMSU Batac Main Campus",
  mode: "any",
  student: true,
  nearbyAlerts: true,
  communityAlerts: true,
  onboarded: true,
};
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});
test("backward planning selects a scheduled departure and counts every leg once", () => {
  const plan = planRoute(route, points, "laoag", "mmsu", classAt, 10, now)!;
  expect(plan).not.toBeNull();
  expect(
    plan.leaveAt +
      (plan.walkMinutes + plan.waitMinutes + plan.rideMinutes) * 60000,
  ).toBe(plan.arriveAt);
  expect(plan.arriveAt).toBeLessThanOrEqual(classAt - 10 * 60000);
  expect(classAt - 10 * 60000 - plan.arriveAt).toBeLessThan(
    serviceFor(route).headway * 60000,
  );
  const localMinutes =
    new Date(plan.departureAt + 8 * 3600000).getUTCHours() * 60 +
    new Date(plan.departureAt + 8 * 3600000).getUTCMinutes();
  expect((localMinutes - 300) % 12).toBe(0);
  expect(plan.studentFareCentavos).toBe(
    Math.round(plan.regularFareCentavos * 0.8),
  );
});
test("service windows handle previous-day classes and reject an unreachable deadline", () => {
  const midnight = Date.parse("2026-11-05T00:30:00+08:00");
  const plan = planRoute(route, points, "laoag", "mmsu", midnight, 10, now)!;
  expect(new Date(plan.departureAt + 8 * 3600000).getUTCDate()).toBe(4);
  expect(plan.arriveAt).toBeLessThan(midnight);
  expect(
    planRoute(
      route,
      points,
      "laoag",
      "mmsu",
      Date.parse("2026-11-05T04:00:00+08:00"),
      10,
      Date.parse("2026-11-04T23:00:00+08:00"),
    ),
  ).toBeNull();
  expect(
    planRoute(route, points, "mmsu", "laoag", classAt, 10, now),
  ).toBeNull();
});
test("edited and cancelled plans invalidate reminders and preserve owner boundaries", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  const t = convexTest(schema, modules),
    a = t.withIdentity({ subject: "qa-a" }),
    b = t.withIdentity({ subject: "qa-b" });
  await t.mutation(internal.vehicles.storePath, {
    routeId: route.id,
    points,
    source: "osrm",
  });
  const args = {
    from: "laoag",
    to: "mmsu",
    mode: "modern-jeepney",
    classAt,
    bufferMinutes: 10,
  };
  const id = await a.mutation(api.planner.save, args);
  const old = (await a.query(api.planner.list))[0];
  await expect(b.mutation(api.planner.save, { ...args, id })).rejects.toThrow(
    "Plan not found",
  );
  await a.mutation(api.planner.save, {
    ...args,
    id,
    classAt: classAt + 3600000,
  });
  const updated = (await a.query(api.planner.list))[0];
  vi.setSystemTime(old.leaveAt);
  await t.mutation(internal.planner.remind, { id, revision: old.revision! });
  expect(await a.query(api.notifications.list)).toHaveLength(0);
  vi.setSystemTime(updated.leaveAt);
  await t.mutation(internal.planner.remind, {
    id,
    revision: updated.revision!,
  });
  await t.mutation(internal.planner.remind, {
    id,
    revision: updated.revision!,
  });
  expect(await a.query(api.notifications.list)).toHaveLength(1);
  await a.mutation(api.planner.remove, { id });
  expect(
    await t.query(internal.notifications.deliveryAllowed, {
      userId: "qa-a",
      planId: id,
      revision: updated.revision,
    }),
  ).toBe(false);
});
test("historical trip deletion cannot remove an active trip or another owner's history", async () => {
  const t = convexTest(schema, modules),
    a = t.withIdentity({ subject: "qa-a" }),
    b = t.withIdentity({ subject: "qa-b" });
  await t.mutation(internal.vehicles.tick, {});
  const vehicle = (await t.query(api.vehicles.list)).find(
    (v) => v.routeId === route.id && v.occupancy === "seats-available",
  )!;
  const id = await a.mutation(api.trips.start, {
    routeId: route.id,
    vehicleId: vehicle.key,
    from: "laoag",
    to: "mmsu",
    pickupId: "laoag",
    radius: 500,
    student: true,
  });
  await expect(a.mutation(api.trips.remove, { id })).rejects.toThrow(
    "active trip",
  );
  await a.mutation(api.trips.update, { id, status: "cancelled" });
  await expect(b.mutation(api.trips.remove, { id })).rejects.toThrow(
    "Trip not found",
  );
  expect(
    (
      await a.query(api.trips.history, {
        paginationOpts: { numItems: 10, cursor: null },
      })
    ).page,
  ).toHaveLength(1);
  await a.mutation(api.trips.remove, { id });
  expect(
    (
      await a.query(api.trips.history, {
        paginationOpts: { numItems: 10, cursor: null },
      })
    ).page,
  ).toHaveLength(0);
});
test("community alerts follow report edits, expiry, resolution, and deduplicate fanout", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  const t = convexTest(schema, modules),
    a = t.withIdentity({ subject: "qa-a" }),
    b = t.withIdentity({ subject: "qa-b" });
  await b.mutation(api.accounts.save, defaults);
  await b.mutation(api.accounts.toggleRoute, { routeId: route.id });
  const args = {
    routeId: route.id,
    category: "crowding",
    area: "Batac",
    description: "A long boarding queue has formed.",
  };
  const id = await a.mutation(api.community.publish, args);
  await t.mutation(internal.notifications.fanout, { reportId: id });
  await t.mutation(internal.notifications.fanout, { reportId: id });
  expect(await b.query(api.notifications.list)).toHaveLength(1);
  await a.mutation(api.community.publish, {
    ...args,
    id,
    description: "The boarding queue is moving again.",
  });
  expect((await b.query(api.notifications.list))[0].body).toBe(
    "The boarding queue is moving again.",
  );
  await a.mutation(api.community.resolve, { id });
  expect((await b.query(api.notifications.list))[0].reportResolved).toBe(true);
  expect(
    await t.query(internal.notifications.deliveryAllowed, {
      userId: "qa-b",
      reportId: id,
    }),
  ).toBe(false);
  expect(await t.query(api.community.byId, { id: "not-an-id" })).toBeNull();
});
test("crowding expires after fifteen minutes and posting is limited to three in ten minutes", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  const t = convexTest(schema, modules),
    a = t.withIdentity({ subject: "qa-a" }),
    b = t.withIdentity({ subject: "qa-b" });
  const args = {
    routeId: route.id,
    category: "crowding",
    area: "Batac",
    description: "A long boarding queue has formed.",
  };
  const id = await a.mutation(api.community.publish, args);
  const report = await t.query(api.community.byId, { id });
  expect(report!.expiresAt - report!.createdAt).toBe(15 * 60000);
  await a.mutation(api.community.publish, args);
  await a.mutation(api.community.publish, args);
  await expect(a.mutation(api.community.publish, args)).rejects.toThrow(
    "three reports",
  );
  vi.setSystemTime(now + 15 * 60000);
  await expect(b.mutation(api.community.confirm, { id })).rejects.toThrow(
    "no longer active",
  );
});

test("road retries use fixed corridors, throttle requests, and preserve fallback on failure", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  const t = convexTest(schema, modules);
  const request = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ code: "NoRoute" }), { status: 503 }),
    );
  vi.stubGlobal("fetch", request);
  try {
    await expect(
      t.action(api.vehicles.retryPath, { routeId: "not-a-route" }),
    ).rejects.toThrow("Unknown corridor");
    expect(request).not.toHaveBeenCalled();
    await expect(
      t.action(api.vehicles.retryPath, { routeId: route.id }),
    ).rejects.toThrow("Road routing is unavailable");
    expect((await t.query(api.vehicles.paths))[0].source).toBe("schematic");
    await expect(
      t.action(api.vehicles.retryPath, { routeId: route.id }),
    ).rejects.toThrow("one minute");
    const other = commuteRoutes.find((r) => r.id !== route.id)!;
    await expect(
      t.action(api.vehicles.retryPath, { routeId: other.id }),
    ).rejects.toThrow("another request");
    expect(request).toHaveBeenCalledTimes(1);
    vi.setSystemTime(now + 61000);
    request.mockResolvedValue(
      new Response(
        JSON.stringify({
          code: "Ok",
          routes: [{ geometry: { coordinates: points } }],
        }),
        { status: 200 },
      ),
    );
    await expect(
      t.action(api.vehicles.retryPath, { routeId: route.id }),
    ).resolves.toEqual({ source: "osrm" });
    expect((await t.query(api.vehicles.paths))[0].source).toBe("osrm");
    await t.action(api.vehicles.retryPath, { routeId: route.id });
    expect(request).toHaveBeenCalledTimes(2);
  } finally {
    vi.unstubAllGlobals();
  }
});

test("planner compares an earlier run and revalidates a chosen departure before saving", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  const t = convexTest(schema, modules),
    owner = t.withIdentity({ subject: "planner-owner" });
  await t.mutation(internal.vehicles.storePath, {
    routeId: route.id,
    points,
    source: "osrm",
  });
  const args = {
    from: "laoag",
    to: "mmsu",
    mode: "modern-jeepney",
    classAt,
    bufferMinutes: 10,
  };
  await expect(t.query(api.planner.suggestions, args)).rejects.toThrow(
    "Sign in",
  );
  const options = await owner.query(api.planner.suggestions, args);
  expect(options.recommended).not.toBe(null);
  expect(options.earlier).not.toBe(null);
  expect(options.earlier!.departureAt).toBe(
    options.recommended!.departureAt - 12 * 60000,
  );
  expect(options.earlier!.arriveAt).toBeLessThan(options.recommended!.arriveAt);
  const selected = options.earlier!;
  const id = await owner.mutation(api.planner.save, {
    ...args,
    routeId: selected.routeId,
    departureAt: selected.departureAt,
  });
  expect(
    (await owner.query(api.planner.list)).find((p) => p._id === id)?.leaveAt,
  ).toBe(selected.leaveAt);
  await owner.mutation(api.planner.save, { ...args, id });
  expect(
    (await owner.query(api.planner.list)).find((p) => p._id === id)
      ?.departureAt,
  ).toBe(selected.departureAt);
  await expect(
    owner.mutation(api.planner.save, {
      ...args,
      routeId: selected.routeId,
      departureAt: selected.departureAt + 1,
    }),
  ).rejects.toThrow("no longer available");
  await expect(
    owner.mutation(api.planner.save, {
      ...args,
      routeId: "invented",
      departureAt: selected.departureAt,
    }),
  ).rejects.toThrow("no longer available");
});
test("an unreachable target shows earliest arrival and requires explicit acceptance to save", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(Date.parse("2026-11-04T23:00:00+08:00"));
  const t = convexTest(schema, modules),
    owner = t.withIdentity({ subject: "planner-owner" });
  await t.mutation(internal.vehicles.storePath, {
    routeId: route.id,
    points,
    source: "osrm",
  });
  const args = {
    from: "laoag",
    to: "mmsu",
    mode: "modern-jeepney",
    classAt: Date.parse("2026-11-05T04:00:00+08:00"),
    bufferMinutes: 10,
  };
  const options = await owner.query(api.planner.suggestions, args);
  expect(options.recommended).toBe(null);
  expect(options.earlier).toBe(null);
  const first = options.earliest!;
  expect(new Date(first.departureAt + 8 * 3600000).getUTCHours()).toBe(5);
  expect(first.bufferShortfallMinutes).toBe(first.lateMinutes + 10);
  expect(first.leaveAt).toBeGreaterThan(Date.now());
  await expect(owner.mutation(api.planner.save, args)).rejects.toThrow(
    "No simulated service",
  );
  const selected = {
    ...args,
    routeId: first.routeId,
    departureAt: first.departureAt,
  };
  await expect(owner.mutation(api.planner.save, selected)).rejects.toThrow(
    "Explicitly choose",
  );
  const id = await owner.mutation(api.planner.save, {
    ...selected,
    acceptLate: true,
  });
  const saved = (await owner.query(api.planner.list))[0];
  expect(saved.lateMinutes).toBe(first.lateMinutes);
  expect(saved.arriveAt).toBe(first.arriveAt);
  vi.setSystemTime(saved.leaveAt);
  await t.mutation(internal.planner.remind, { id, revision: saved.revision! });
  expect((await owner.query(api.notifications.list))[0].body).toContain(
    "misses your arrival target",
  );
});
test("missing road geometry is distinct from no direct service and does not invent an itinerary", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  const t = convexTest(schema, modules),
    owner = t.withIdentity({ subject: "planner-owner" });
  const args = {
    from: "laoag",
    to: "mmsu",
    mode: "modern-jeepney",
    classAt,
    bufferMinutes: 10,
  };
  const unavailable = await owner.query(api.planner.suggestions, args);
  expect(unavailable.unavailable).toContain("Road routes are unavailable");
  expect(unavailable.recommended).toBe(null);
  expect(unavailable.earliest).toBe(null);
  await expect(
    owner.query(api.planner.suggestions, { ...args, mode: "bus" }),
  ).rejects.toThrow("No supported direct route");
  await expect(
    owner.query(api.planner.suggestions, { ...args, mode: "invented" }),
  ).rejects.toThrow("supported transport mode");
});

test("a missed arrival buffer is not mislabeled as arriving after class", () => {
  const morning = Date.parse("2026-11-05T05:05:00+08:00");
  const first = planRoute(
    route,
    points,
    "laoag",
    "mmsu",
    classAt,
    10,
    morning,
    "earliest",
  )!;
  const tightClass = first.arriveAt + 3 * 60000;
  expect(
    planRoute(route, points, "laoag", "mmsu", tightClass, 10, morning),
  ).toBe(null);
  const fallback = planRoute(
    route,
    points,
    "laoag",
    "mmsu",
    tightClass,
    10,
    morning,
    "earliest",
  )!;
  expect(fallback.lateMinutes).toBe(0);
  expect(fallback.bufferShortfallMinutes).toBe(7);
  expect(fallback.arriveAt).toBeLessThan(tightClass);
});

test("earliest planning includes previous-day departures still reaching downstream stops after midnight", () => {
  const bus = {
    ...commuteRoutes.find((r) => r.id === "bus-vigan-outbound")!,
    speedKmh: 10,
  };
  const afterMidnight = Date.parse("2026-11-05T00:05:00+08:00");
  const first = planRoute(
    bus,
    bus.stops.map((s) => s.coordinates),
    "badoc",
    "vigan",
    classAt,
    10,
    afterMidnight,
    "earliest",
  )!;
  expect(first).not.toBe(null);
  expect(first.leaveAt).toBeGreaterThan(afterMidnight);
  expect(new Date(first.departureAt + 8 * 3600000).getUTCHours()).toBeLessThan(
    5,
  );
  expect(
    first.leaveAt +
      (first.walkMinutes + first.waitMinutes + first.rideMinutes) * 60000,
  ).toBe(first.arriveAt);
});
