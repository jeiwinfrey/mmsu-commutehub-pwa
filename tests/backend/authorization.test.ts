import { sweptDistance } from "../../convex/lib/geometry";
/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { test, expect, vi, afterEach } from "vitest";
import schema from "../../convex/schema";
import { api, internal } from "../../convex/_generated/api";
const modules = import.meta.glob("../../convex/**/*.ts");
const defaults = {
  name: "Student",
  campus: "MMSU Batac Main Campus",
  mode: "any",
  student: true,
  nearbyAlerts: true,
  communityAlerts: true,
  onboarded: true,
};
const routeId = "modern-jeepney-jeepney-outbound";
afterEach(() => vi.useRealTimers());
test("private endpoints require real authentication", async () => {
  const t = convexTest(schema, modules);
  await expect(t.query(api.trips.list)).rejects.toThrow("Sign in");
  await expect(t.mutation(api.accounts.save, defaults)).rejects.toThrow(
    "Sign in",
  );
  await expect(t.query(api.notifications.list)).rejects.toThrow("Sign in");
});
test("accounts and saved routes are isolated", async () => {
  const t = convexTest(schema, modules),
    a = t.withIdentity({ subject: "test-a" }),
    b = t.withIdentity({ subject: "test-b" });
  await a.mutation(api.accounts.save, { ...defaults, name: "A" });
  await b.mutation(api.accounts.save, { ...defaults, name: "B" });
  await a.mutation(api.accounts.toggleRoute, { routeId });
  expect((await a.query(api.accounts.me))?.name).toBe("A");
  expect(await a.query(api.accounts.saved)).toHaveLength(1);
  expect(await b.query(api.accounts.saved)).toHaveLength(0);
  await expect(
    a.mutation(api.accounts.toggleRoute, { routeId: "invented" }),
  ).rejects.toThrow("Unknown route");
});
test("server computes fares, rejects duplicate trips, and enforces ownership and transitions", async () => {
  const t = convexTest(schema, modules),
    a = t.withIdentity({ subject: "test-a" }),
    b = t.withIdentity({ subject: "test-b" });
  await t.mutation(internal.vehicles.tick, {});
  const vehicle = (await t.query(api.vehicles.list)).find(
    (v) => v.routeId === routeId && v.occupancy === "seats-available",
  )!;
  const args = {
    routeId,
    vehicleId: vehicle.key,
    from: "laoag",
    to: "mmsu",
    pickupId: "san-nicolas",
    radius: 500,
    student: true,
  };
  const id = await a.mutation(api.trips.start, args);
  const trip = (await a.query(api.trips.list))[0];
  expect(trip.fareCentavos).toBeGreaterThan(0);
  expect(await b.query(api.trips.list)).toHaveLength(0);
  await expect(
    b.mutation(api.trips.update, { id, status: "cancelled" }),
  ).rejects.toThrow("Trip not found");
  await expect(a.mutation(api.trips.start, args)).rejects.toThrow(
    "active trip",
  );
  await expect(
    a.mutation(api.trips.update, { id, status: "completed" }),
  ).rejects.toThrow("cannot change");
  await a.mutation(api.trips.update, { id, status: "riding" });
  await a.mutation(api.trips.update, { id, status: "completed" });
  await expect(
    a.mutation(api.trips.update, { id, status: "riding" }),
  ).rejects.toThrow("cannot change");
  await expect(
    a.mutation(api.trips.start, { ...args, radius: 1 }),
  ).rejects.toThrow("Invalid journey");
});
test("reports protect author IDs and restrict edits and confirmations", async () => {
  const t = convexTest(schema, modules),
    a = t.withIdentity({ subject: "test-a" }),
    b = t.withIdentity({ subject: "test-b" });
  const data = {
    routeId,
    category: "queue",
    area: "Batac",
    description: "Long queue beside the candidate stop.",
  };
  const id = await a.mutation(api.community.publish, data);
  await expect(
    b.mutation(api.community.publish, { ...data, id }),
  ).rejects.toThrow("Report not found");
  await expect(a.mutation(api.community.confirm, { id })).rejects.toThrow(
    "own report",
  );
  await b.mutation(api.community.confirm, { id });
  const report = (await t.query(api.community.list))[0];
  expect(report.count).toBe(1);
  expect(report).not.toHaveProperty("userId");
  await a.mutation(api.community.resolve, { id });
  await expect(b.mutation(api.community.confirm, { id })).rejects.toThrow(
    "no longer active",
  );
});
test("planner validates connections and time, scopes records to owner", async () => {
  const t = convexTest(schema, modules),
    a = t.withIdentity({ subject: "test-a" }),
    b = t.withIdentity({ subject: "test-b" });
  const data = {
    from: "laoag",
    to: "mmsu",
    mode: "modern-jeepney",
    classAt: Date.now() + 86400000,
    bufferMinutes: 15,
  };
  const id = await a.mutation(api.planner.save, data);
  expect(await b.query(api.planner.list)).toHaveLength(0);
  await expect(b.mutation(api.planner.remove, { id })).rejects.toThrow(
    "Plan not found",
  );
  await expect(
    a.mutation(api.planner.save, { ...data, mode: "bus" }),
  ).rejects.toThrow("No supported direct route");
  await expect(
    a.mutation(api.planner.save, { ...data, classAt: 1 }),
  ).rejects.toThrow("future class");
});
test("proximity notification is deduplicated and private", async () => {
  const t = convexTest(schema, modules),
    a = t.withIdentity({ subject: "test-a" }),
    b = t.withIdentity({ subject: "test-b" });
  await a.mutation(api.accounts.save, defaults);
  await t.mutation(internal.vehicles.tick, {});
  const vehicle = (await t.query(api.vehicles.list)).find(
    (v) => v.routeId === routeId && v.occupancy === "seats-available",
  )!;
  const id = await a.mutation(api.trips.start, {
    routeId,
    vehicleId: vehicle.key,
    from: "laoag",
    to: "mmsu",
    pickupId: "laoag",
    radius: 500,
    student: true,
  });
  await t.run((ctx) =>
    ctx.db.patch(vehicle._id, { phase: 0, updatedAt: Date.now() }),
  );
  await t.mutation(internal.vehicles.tick, {});
  await t.mutation(internal.vehicles.tick, {});
  expect(
    (await a.query(api.trips.list)).find((t) => t._id === id)?.notified,
  ).toBe(true);
  const alerts = await a.query(api.notifications.list);
  expect(alerts).toHaveLength(1);
  expect(await b.query(api.notifications.list)).toHaveLength(0);
  await expect(
    b.mutation(api.notifications.read, { id: alerts[0]._id }),
  ).rejects.toThrow("Alert not found");
});

test("small geofences catch crossings between ticks without false alerts on wrap", () => {
  const points: [number, number][] = [
    [120, 18],
    [120.01, 18],
  ];
  expect(sweptDistance(points, 0.1, 0.4, [120.0025, 18])).toBeLessThan(1);
  expect(sweptDistance(points, 0.95, 0.05, [120.005, 18])).toBeGreaterThan(400);
});
