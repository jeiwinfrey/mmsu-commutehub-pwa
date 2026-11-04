import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
export default defineSchema({
  deliveryAttempts: defineTable({
    userId: v.string(),
    eventKey: v.string(),
    subscriptionId: v.id("pushSubscriptions"),
    status: v.union(
      v.literal("sending"),
      v.literal("sent"),
      v.literal("retry"),
      v.literal("failed"),
    ),
    attempt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    expiresAt: v.number(),
    statusCode: v.optional(v.number()),
  })
    .index("by_event_subscription", ["eventKey", "subscriptionId"])
    .index("by_user", ["userId"])
    .index("by_created", ["createdAt"]),
  simulationState: defineTable({
    key: v.string(),
    updatedAt: v.number(),
    version: v.string(),
  }).index("by_key", ["key"]),
  profiles: defineTable({
    userId: v.string(),
    name: v.string(),
    campus: v.string(),
    mode: v.string(),
    student: v.boolean(),
    nearbyAlerts: v.boolean(),
    departureAlerts: v.optional(v.boolean()),
    defaultRadius: v.optional(v.number()),
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
    scenarioEpoch: v.optional(v.number()),
    scenarioOffsetSeconds: v.optional(v.number()),
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
    runId: v.optional(v.string()),
    runOrdinal: v.optional(v.number()),
    runVersion: v.optional(v.string()),
    runStartAt: v.optional(v.number()),
    runEndAt: v.optional(v.number()),
    pickupArrivesAt: v.optional(v.number()),
    pickupDepartsAt: v.optional(v.number()),
    destinationArrivesAt: v.optional(v.number()),
    watchVersion: v.optional(v.number()),
    notifiedAt: v.optional(v.number()),
    arrivalDetectedAt: v.optional(v.number()),
    expiryAt: v.optional(v.number()),
    endReason: v.optional(v.string()),
    fareVersion: v.optional(v.string()),
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
      v.literal("missed"),
      v.literal("expired"),
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
    retentionHold: v.optional(v.boolean()),
  })
    .index("by_time", ["createdAt"])
    .index("by_expiry", ["expiresAt"])
    .index("by_user", ["userId"]),
  confirmations: defineTable({ userId: v.string(), reportId: v.id("reports") })
    .index("by_report", ["reportId"])
    .index("by_user_report", ["userId", "reportId"]),
  flags: defineTable({
    userId: v.string(),
    reportId: v.id("reports"),
    reason: v.string(),
  })
    .index("by_user_report", ["userId", "reportId"])
    .index("by_report", ["reportId"]),
  notifications: defineTable({
    userId: v.string(),
    eventKey: v.optional(v.string()),
    kind: v.string(),
    title: v.string(),
    body: v.string(),
    href: v.string(),
    reportId: v.optional(v.id("reports")),
    routeId: v.optional(v.string()),
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_event", ["eventKey"])
    .index("by_user", ["userId"])
    .index("by_created", ["createdAt"])
    .index("by_report", ["reportId"])
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
