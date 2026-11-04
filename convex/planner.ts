import { query, mutation, internalMutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { user } from "./lib/auth";
import { matchingRoutes, type Coordinate } from "../src/lib/commute-catalog";
import { planRoute } from "./lib/planning";
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
  },
  handler: async (ctx, a) => {
    const identity = await user(ctx),
      now = Date.now();
    const old = a.id ? await ctx.db.get(a.id) : null;
    if (a.id && (!old || old.userId !== identity.subject))
      throw new ConvexError("Plan not found.");
    if (
      a.classAt <= now ||
      a.classAt > now + 366 * 86400000 ||
      !Number.isFinite(a.classAt) ||
      ![5, 10, 15, 20, 30].includes(a.bufferMinutes)
    )
      throw new ConvexError("Choose a future class time and valid buffer.");
    const routes = matchingRoutes(a.from, a.to).filter(
      (r) => a.mode === "any" || a.mode === r.mode,
    );
    if (!routes.length)
      throw new ConvexError("No supported direct route for these choices.");
    const candidates = [];
    for (const route of routes) {
      const road = await ctx.db
        .query("roadPaths")
        .withIndex("by_route", (q) => q.eq("routeId", route.id))
        .unique();
      if (!road || road.source !== "osrm") continue;
      const plan = planRoute(
        route,
        road.points as Coordinate[],
        a.from,
        a.to,
        a.classAt,
        a.bufferMinutes,
        now,
      );
      if (plan) candidates.push(plan);
    }
    candidates.sort((a, b) => b.leaveAt - a.leaveAt);
    const plan = candidates[0];
    if (!plan)
      throw new ConvexError(
        "No simulated service can meet this class deadline from now. Try a later class or another mode. Road routes must also be available.",
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
      p.classAt < Date.now()
    )
      return;
    await ctx.db.patch(id, { reminded: true });
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
