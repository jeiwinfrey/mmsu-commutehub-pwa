import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { user } from "./lib/auth";
import { matchingRoutes, distanceMeters } from "../src/lib/commute-catalog";
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
    from: v.string(),
    to: v.string(),
    mode: v.string(),
    classAt: v.number(),
    bufferMinutes: v.number(),
  },
  handler: async (ctx, a) => {
    const i = await user(ctx);
    if (
      a.classAt < Date.now() ||
      a.classAt > Date.now() + 366 * 86400000 ||
      !Number.isFinite(a.classAt) ||
      ![5, 10, 15, 20, 30].includes(a.bufferMinutes)
    )
      throw new ConvexError("Choose a future class time and valid buffer.");
    const routes = matchingRoutes(a.from, a.to).filter(
      (r) => a.mode === "any" || r.mode === a.mode,
    );
    if (!routes.length)
      throw new ConvexError("No supported direct route for these choices.");
    const r = routes[0],
      start = r.stops.findIndex((s) => s.id === a.from),
      end = r.stops.findIndex((s) => s.id === a.to);
    let meters = 0;
    for (let j = start + 1; j <= end; j++)
      meters += distanceMeters(
        r.stops[j - 1].coordinates,
        r.stops[j].coordinates,
      );
    const rideMinutes = Math.ceil(((meters * 1.25) / (r.speedKmh * 1000)) * 60),
      waitMinutes = 12,
      walkMinutes = 8,
      arriveAt = a.classAt - a.bufferMinutes * 60000,
      leaveAt = arriveAt - (rideMinutes + waitMinutes + walkMinutes) * 60000;
    if (leaveAt < Date.now())
      throw new ConvexError(
        "The suggested departure has already passed. Choose a later class.",
      );
    return ctx.db.insert("plans", {
      ...a,
      userId: i.subject,
      rideMinutes,
      waitMinutes,
      walkMinutes,
      arriveAt,
      leaveAt,
      reminded: false,
    });
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
