/// <reference types="vite/client" />
import { test, expect, vi, afterEach } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";
import { distanceMeters } from "../../src/lib/commute-catalog";
import {
  fleetNetwork,
  projectFleetVehicle,
  runAtOrdinal,
  runMetersAt,
  offerForRoute,
} from "../../src/lib/fleet-simulation";
const modules = import.meta.glob("../../convex/**/*.ts"),
  routeId = "modern-jeepney-jeepney-outbound",
  epoch = Date.parse("2026-11-04T08:00:00+08:00"),
  network = fleetNetwork([]),
  actor = {
    key: `${routeId}-vehicle-1`,
    routeId,
    label: "QA vehicle",
    occupancy: "seats-available",
    speedKmh: 30,
    phase: 0,
    updatedAt: epoch,
    _creationTime: epoch,
    scenarioEpoch: epoch,
    scenarioOffsetSeconds: 0,
  };
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});
test("terminal and intermediate dwell are stationary and the return run starts at the same terminal", () => {
  const run = runAtOrdinal(actor, network, 0),
    start = projectFleetVehicle(actor, network, epoch + 30000);
  expect(start.speedKmh).toBe(0);
  expect(start.phase).toBe(0);
  const stop = run.leg.stops[1],
    at = run.startAt + (stop.arriveSeconds + 5) * 1000;
  expect(runMetersAt(run, at).speedKmh).toBe(0);
  const before = projectFleetVehicle(actor, network, run.endAt - 1),
    after = projectFleetVehicle(actor, network, run.endAt + 1);
  expect(before.runId).not.toBe(after.runId);
  expect(after.routeId).toContain("inbound");
  expect(distanceMeters(before.position, after.position)).toBeLessThan(2);
  expect(after.speedKmh).toBe(0);
});
test("passed pickups are excluded from this run while a future directional run stays explicit", () => {
  const run = runAtOrdinal(actor, network, 0),
    time = epoch + 5 * 60000;
  const next = offerForRoute(actor, network, routeId, "laoag", "mmsu", time);
  expect(next!.scheduled).toBe(true);
  expect(next!.runId).not.toBe(run.id);
  expect(
    offerForRoute(actor, network, routeId, "laoag", "mmsu", time, run.id),
  ).toBeNull();
  const mid = offerForRoute(
    actor,
    network,
    routeId,
    "batac",
    "mmsu",
    time,
    run.id,
  );
  expect(mid?.runId).toBe(run.id);
});
async function setup() {
  const t = convexTest(schema, modules),
    user = t.withIdentity({ subject: "qa-owner" });
  await t.mutation(internal.vehicles.tick, {});
  const record = await t.run((ctx) =>
    ctx.db
      .query("vehicles")
      .withIndex("by_key", (q) => q.eq("key", actor.key))
      .unique(),
  );
  await t.run((ctx) =>
    ctx.db.patch(record!._id, {
      scenarioEpoch: epoch,
      scenarioOffsetSeconds: 0,
    }),
  );
  return { t, user };
}
test("waiting run expires as missed once; its next circuit cannot resurrect or notify it", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(epoch);
  const { t, user } = await setup();
  const id = await user.mutation(api.trips.start, {
    routeId,
    vehicleId: actor.key,
    runId: runAtOrdinal(actor, network, 0).id,
    from: "laoag",
    to: "mmsu",
    pickupId: "laoag",
    radius: 100,
    student: true,
  });
  const trip = (await user.query(api.trips.byId, { id }))!;
  expect(trip.runId).toBeDefined();
  vi.setSystemTime(trip.expiryAt! + 1);
  await t.mutation(internal.trips.expire, {
    id,
    status: "waiting",
    expectedAt: trip.expiryAt!,
  });
  await t.mutation(internal.trips.expire, {
    id,
    status: "waiting",
    expectedAt: trip.expiryAt!,
  });
  expect((await user.query(api.trips.byId, { id }))!.status).toBe("missed");
  expect(await user.query(api.trips.active)).toBeNull();
  vi.setSystemTime(epoch + 2 * 86400000);
  await t.mutation(internal.vehicles.tick, {});
  expect((await user.query(api.trips.byId, { id }))!.status).toBe("missed");
  expect(
    (await user.query(api.notifications.list)).filter((n) => n.kind === "trip"),
  ).toHaveLength(1);
  expect(
    await t.withIdentity({ subject: "other" }).query(api.trips.byId, { id }),
  ).toBeNull();
});
test("boarding cancels waiting expiry; detected destination never auto-completes and abandoned ride expires", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(epoch);
  const { t, user } = await setup();
  const id = await user.mutation(api.trips.start, {
      routeId,
      vehicleId: actor.key,
      from: "laoag",
      to: "mmsu",
      pickupId: "laoag",
      radius: 500,
      student: true,
    }),
    waiting = (await user.query(api.trips.byId, { id }))!;
  await user.mutation(api.trips.update, { id, status: "riding" });
  vi.setSystemTime(waiting.expiryAt! + 1);
  await t.mutation(internal.trips.expire, {
    id,
    status: "waiting",
    expectedAt: waiting.expiryAt!,
  });
  expect((await user.query(api.trips.byId, { id }))!.status).toBe("riding");
  vi.setSystemTime(waiting.destinationArrivesAt! + 1);
  await t.mutation(internal.trips.detectArrival, { id, runId: waiting.runId! });
  await t.mutation(internal.trips.detectArrival, { id, runId: waiting.runId! });
  const riding = (await user.query(api.trips.byId, { id }))!;
  expect(riding.status).toBe("riding");
  expect(riding.arrivalDetectedAt).toBeDefined();
  expect(
    (await user.query(api.notifications.list)).filter((n) =>
      n.title.includes("destination"),
    ),
  ).toHaveLength(1);
  vi.setSystemTime(riding.expiryAt! + 1);
  await t.mutation(internal.trips.expire, {
    id,
    status: "riding",
    expectedAt: riding.expiryAt!,
  });
  expect((await user.query(api.trips.byId, { id }))!.status).toBe("expired");
});

test("delivery claims prevent duplicate sends and stale retry completions", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(epoch);
  const { t, user } = await setup();
  await user.mutation(api.notifications.subscribe, {
    endpoint: "https://fcm.googleapis.com/qa-endpoint",
    p256dh: "test-key",
    auth: "test-auth",
  });
  const subscription = await t.run((ctx) =>
    ctx.db.query("pushSubscriptions").first(),
  );
  const args = {
    userId: "qa-owner",
    eventKey: "qa-proximity",
    subscriptionId: subscription!._id,
    expiresAt: epoch + 120000,
  };
  const first = await t.mutation(internal.delivery.begin, args);
  expect(first?.attempt).toBe(1);
  expect(await t.mutation(internal.delivery.begin, args)).toBeNull();
  await t.mutation(internal.delivery.finish, {
    id: first!.id,
    attempt: 1,
    status: "retry",
    statusCode: 503,
  });
  const second = await t.mutation(internal.delivery.begin, args);
  expect(second?.attempt).toBe(2);
  await t.mutation(internal.delivery.finish, {
    id: first!.id,
    attempt: 1,
    status: "sent",
  });
  expect((await t.run((ctx) => ctx.db.get(first!.id)))!.status).toBe("sending");
  await t.mutation(internal.delivery.finish, {
    id: second!.id,
    attempt: 2,
    status: "sent",
  });
  expect(await t.mutation(internal.delivery.begin, args)).toBeNull();
  expect(
    await t.mutation(internal.delivery.begin, {
      ...args,
      eventKey: "expired",
      expiresAt: epoch,
    }),
  ).toBeNull();
});
test("departure reminders respect independent account preferences", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(epoch);
  const { t, user } = await setup();
  const defaults = {
    name: "QA",
    campus: "MMSU Batac Main Campus",
    mode: "any",
    student: true,
    nearbyAlerts: true,
    communityAlerts: true,
    onboarded: true,
    departureAlerts: false,
    defaultRadius: 250,
  };
  await user.mutation(api.accounts.save, defaults);
  expect((await user.query(api.accounts.me))!.defaultRadius).toBe(250);
  await expect(
    user.mutation(api.accounts.save, { ...defaults, defaultRadius: 12 }),
  ).rejects.toThrow("supported alert radius");
  const id = await t.run((ctx) =>
    ctx.db.insert("plans", {
      userId: "qa-owner",
      from: "laoag",
      to: "mmsu",
      mode: "any",
      classAt: epoch + 3600000,
      leaveAt: epoch,
      arriveAt: epoch + 3000000,
      rideMinutes: 30,
      waitMinutes: 5,
      walkMinutes: 12,
      bufferMinutes: 10,
      reminded: false,
      revision: 1,
    }),
  );
  await t.mutation(internal.planner.remind, { id, revision: 1 });
  expect(await user.query(api.notifications.list)).toHaveLength(0);
  expect(
    await t.query(internal.notifications.deliveryAllowed, {
      userId: "qa-owner",
      planId: id,
      revision: 1,
    }),
  ).toBe(false);
});

test("retention removes old delivery records and unflagged reports while preserving flagged evidence", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(epoch);
  const { t } = await setup();
  const ids = await t.run(async (ctx) => {
    const sub = await ctx.db.insert("pushSubscriptions", {
      userId: "qa-owner",
      endpoint: "https://fcm.googleapis.com/test",
      p256dh: "test",
      auth: "test",
    });
    await ctx.db.insert("deliveryAttempts", {
      userId: "qa-owner",
      eventKey: "old",
      subscriptionId: sub,
      status: "sent",
      attempt: 1,
      createdAt: epoch - 31 * 86400000,
      updatedAt: epoch - 31 * 86400000,
      expiresAt: epoch - 31 * 86400000,
    });
    const base = {
      userId: "qa-owner",
      author: "QA",
      routeId,
      category: "traffic",
      area: "Laoag",
      description: "Old report for retention testing.",
      createdAt: epoch - 92 * 86400000,
      updatedAt: epoch - 92 * 86400000,
      expiresAt: epoch - 91 * 86400000,
      resolved: true,
    };
    const removed = await ctx.db.insert("reports", base),
      held = await ctx.db.insert("reports", base);
    await ctx.db.insert("confirmations", {
      userId: "someone",
      reportId: removed,
    });
    await ctx.db.insert("flags", {
      userId: "someone",
      reportId: held,
      reason: "Review needed",
    });
    return { removed, held };
  });
  await t.mutation(internal.retention.clean, {});
  expect(
    await t.run((ctx) => ctx.db.query("deliveryAttempts").collect()),
  ).toHaveLength(0);
  expect(await t.run((ctx) => ctx.db.get(ids.removed))).toBeNull();
  expect((await t.run((ctx) => ctx.db.get(ids.held)))!.retentionHold).toBe(
    true,
  );
  expect(
    await t.run((ctx) => ctx.db.query("confirmations").collect()),
  ).toHaveLength(0);
});
