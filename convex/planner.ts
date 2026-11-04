import { query, mutation, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { user } from "./lib/auth";
import { suggestions as planSuggestions } from "./lib/planOptions";
import { internal } from "./_generated/api";
export const list = query({
  args: {},
  handler: async (ctx) => {
    const i = await user(ctx);
    return ctx.db
      .query("plans")
      .withIndex("by_user", (q) => q.eq("userId", i.subject))
      .order("desc")
      .take(50);
  },
});
export const save = mutation({
  args: {
    id: v.optional(v.id("plans")),
    from: v.string(),
    to: v.string(),
    mode: v.string(),
    classAt: v.number(),
    bufferMinutes: v.number(),
    student: v.optional(v.boolean()),
    routeId: v.optional(v.string()),
    departureAt: v.optional(v.number()),
    acceptLate: v.optional(v.boolean()),
  },
  handler: async (ctx, a) => {
    const identity = await user(ctx),
      now = Date.now();
    const old = a.id ? await ctx.db.get(a.id) : null;
    if (a.id && (!old || old.userId !== identity.subject))
      throw new ConvexError("Plan not found.");
    const results = await planSuggestions(ctx, a, now);
    const options = [
      results.recommended,
      results.earlier,
      results.earliest,
    ].filter((p) => p !== null);
    const unchanged =
      old &&
      old.from === a.from &&
      old.to === a.to &&
      old.mode === a.mode &&
      old.classAt === a.classAt &&
      old.bufferMinutes === a.bufferMinutes;
    const plan =
      a.departureAt === undefined
        ? unchanged && old.departureAt
          ? options.find(
              (p) =>
                p.routeId === old.routeId && p.departureAt === old.departureAt,
            )
          : results.recommended
        : options.find(
            (p) => p.routeId === a.routeId && p.departureAt === a.departureAt,
          );
    if (!plan)
      throw new ConvexError(
        results.unavailable ??
          "No simulated service can meet this class deadline from now, or the selected suggestion is no longer available. Compare departures again.",
      );
    if (
      plan.bufferShortfallMinutes > 0 &&
      !a.acceptLate &&
      !(unchanged && old.bufferShortfallMinutes)
    )
      throw new ConvexError(
        "This journey misses your arrival target. Explicitly choose the late-arrival option to save it.",
      );
    const data = {
      ...plan,
      userId: identity.subject,
      from: a.from,
      to: a.to,
      mode: a.mode,
      classAt: a.classAt,
      bufferMinutes: a.bufferMinutes,
      student: a.student ?? true,
      revision: (old?.revision ?? 0) + 1,
      reminded: false,
    };
    const id = a.id ?? (await ctx.db.insert("plans", data));
    if (a.id) await ctx.db.patch(id, data);
    await ctx.scheduler.runAt(plan.leaveAt, internal.planner.remind, {
      id,
      revision: data.revision,
    });
    return id;
  },
});
export const remove = mutation({
  args: { id: v.id("plans") },
  handler: async (ctx, { id }) => {
    const i = await user(ctx),
      p = await ctx.db.get(id);
    if (!p || p.userId !== i.subject) throw new ConvexError("Plan not found.");
    await ctx.db.delete(id);
  },
});
export const remind = internalMutation({
  args: { id: v.id("plans"), revision: v.number() },
  handler: async (ctx, { id, revision }) => {
    const p = await ctx.db.get(id);
    if (
      !p ||
      p.revision !== revision ||
      p.reminded ||
      p.leaveAt > Date.now() ||
      p.arriveAt < Date.now()
    )
      return;
    await ctx.db.patch(id, { reminded: true });
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", p.userId))
      .unique();
    if (profile?.departureAlerts === false) return;
    const payload = {
      kind: "planner",
      title: "Time to leave for class",
      body: p.bufferShortfallMinutes
        ? "Your saved departure time has arrived. This plan misses your arrival target; check its arrival time before travelling."
        : "Your saved departure time has arrived. Check current conditions before travelling.",
      href: "/planner",
    };
    await ctx.db.insert("notifications", {
      ...payload,
      userId: p.userId,
      read: false,
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.push.send, {
      ...payload,
      userId: p.userId,
      planId: p._id,
      revision: p.revision,
    });
  },
});

export const suggestions = query({
  args: {
    from: v.string(),
    to: v.string(),
    mode: v.string(),
    classAt: v.number(),
    bufferMinutes: v.number(),
    // Cache invalidation only; the server's clock remains authoritative.
    refreshBucket: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await user(ctx);
    return planSuggestions(ctx, args, Date.now());
  },
});
