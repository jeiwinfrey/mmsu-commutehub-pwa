import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
export const begin = internalMutation({
  args: {
    userId: v.string(),
    eventKey: v.string(),
    subscriptionId: v.id("pushSubscriptions"),
    expiresAt: v.number(),
  },
  handler: async (ctx, a) => {
    const now = Date.now();
    if (now >= a.expiresAt) return null;
    const subscription = await ctx.db.get(a.subscriptionId);
    if (!subscription || subscription.userId !== a.userId) return null;
    const old = await ctx.db
      .query("deliveryAttempts")
      .withIndex("by_event_subscription", (q) =>
        q.eq("eventKey", a.eventKey).eq("subscriptionId", a.subscriptionId),
      )
      .unique();
    if (
      old &&
      (old.status === "sent" ||
        old.status === "failed" ||
        old.attempt >= 4 ||
        (old.status === "sending" && now - old.updatedAt < 30000))
    )
      return null;
    const attempt = (old?.attempt ?? 0) + 1;
    if (old) {
      await ctx.db.patch(old._id, {
        status: "sending",
        attempt,
        updatedAt: now,
      });
      return { id: old._id, attempt };
    }
    const id = await ctx.db.insert("deliveryAttempts", {
      ...a,
      status: "sending",
      attempt,
      createdAt: now,
      updatedAt: now,
    });
    return { id, attempt };
  },
});
export const finish = internalMutation({
  args: {
    id: v.id("deliveryAttempts"),
    attempt: v.number(),
    status: v.union(v.literal("sent"), v.literal("retry"), v.literal("failed")),
    statusCode: v.optional(v.number()),
  },
  handler: async (ctx, a) => {
    const old = await ctx.db.get(a.id);
    if (!old || old.status !== "sending" || old.attempt !== a.attempt) return;
    await ctx.db.patch(a.id, {
      status: a.status,
      statusCode: a.statusCode,
      updatedAt: Date.now(),
    });
  },
});
