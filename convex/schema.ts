import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
export default defineSchema({
  profiles: defineTable({
    userId: v.string(),
    name: v.string(),
    campus: v.string(),
    mode: v.string(),
    student: v.boolean(),
    nearbyAlerts: v.boolean(),
    communityAlerts: v.boolean(),
    onboarded: v.boolean(),
  }).index("by_user", ["userId"]),
  savedRoutes: defineTable({ userId: v.string(), routeId: v.string() })
    .index("by_user", ["userId"])
    .index("by_route", ["routeId"]),
  roadPaths: defineTable({
    routeId: v.string(),
    points: v.array(v.array(v.number())),
    source: v.string(),
    updatedAt: v.number(),
    retryAt: v.optional(v.number()),
  }).index("by_route", ["routeId"]),
  vehicles: defineTable({
    key: v.string(),
    routeId: v.string(),
    label: v.string(),
    speedKmh: v.number(),
    occupancy: v.string(),
    phase: v.number(),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_route", ["routeId"]),
  trips: defineTable({
    userId: v.string(),
    routeId: v.string(),
    vehicleId: v.string(),
    from: v.string(),
    to: v.string(),
    pickupId: v.string(),
    radius: v.number(),
    fareCentavos: v.number(),
    student: v.boolean(),
    status: v.union(
      v.literal("waiting"),
      v.literal("riding"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    notified: v.boolean(),
    createdAt: v.number(),
    boardedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),
  plans: defineTable({
    userId: v.string(),
    from: v.string(),
    to: v.string(),
    mode: v.string(),
    routeId: v.optional(v.string()),
    selectedMode: v.optional(v.string()),
    departureAt: v.optional(v.number()),
    originWalkMinutes: v.optional(v.number()),
    campusWalkMinutes: v.optional(v.number()),
    headwayMinutes: v.optional(v.number()),
    regularFareCentavos: v.optional(v.number()),
    studentFareCentavos: v.optional(v.number()),
    serviceVersion: v.optional(v.string()),
    revision: v.optional(v.number()),
    student: v.optional(v.boolean()),
    classAt: v.number(),
    leaveAt: v.number(),
    arriveAt: v.number(),
    rideMinutes: v.number(),
    waitMinutes: v.number(),
    walkMinutes: v.number(),
    bufferMinutes: v.number(),
    reminded: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_leave", ["leaveAt"])
    .index("by_route", ["routeId"]),
  reports: defineTable({
    userId: v.string(),
    author: v.string(),
    routeId: v.string(),
    category: v.string(),
    area: v.string(),
    description: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    expiresAt: v.number(),
    resolved: v.boolean(),
  })
    .index("by_time", ["createdAt"])
    .index("by_user", ["userId"]),
  confirmations: defineTable({ userId: v.string(), reportId: v.id("reports") })
    .index("by_report", ["reportId"])
    .index("by_user_report", ["userId", "reportId"]),
  flags: defineTable({
    userId: v.string(),
    reportId: v.id("reports"),
    reason: v.string(),
  }).index("by_user_report", ["userId", "reportId"]),
  notifications: defineTable({
    userId: v.string(),
    kind: v.string(),
    title: v.string(),
    body: v.string(),
    href: v.string(),
    reportId: v.optional(v.id("reports")),
    routeId: v.optional(v.string()),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"])
    .index("by_user_report", ["userId", "reportId"])
    .index("by_user_route_time", ["userId", "routeId", "createdAt"]),
  pushSubscriptions: defineTable({
    userId: v.string(),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"]),
});
