import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { user, text } from "./lib/auth";
import { commuteRoutes } from "../src/lib/commute-catalog";
export const me = query({
  args: {},
  handler: async (ctx) => {
    const i = await ctx.auth.getUserIdentity();
    if (!i) return null;
    return await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", i.subject))
      .unique();
  },
});
export const save = mutation({
  args: {
    name: v.string(),
    campus: v.string(),
    mode: v.string(),
    student: v.boolean(),
    nearbyAlerts: v.boolean(),
    departureAlerts: v.optional(v.boolean()),
    defaultRadius: v.optional(v.number()),
    communityAlerts: v.boolean(),
    onboarded: v.boolean(),
  },
  handler: async (ctx, args) => {
    const i = await user(ctx);
    if (
      !["any", "traditional-jeepney", "modern-jeepney", "bus"].includes(
        args.mode,
      )
    )
      throw new ConvexError("Invalid transport mode.");
    if (
      args.defaultRadius !== undefined &&
      ![100, 250, 500, 1000].includes(args.defaultRadius)
    )
      throw new ConvexError("Choose a supported alert radius.");
    if (args.campus !== "MMSU Batac Main Campus")
      throw new ConvexError(
        "This campus does not have a supported route connection yet.",
      );
    const data = {
      ...args,
      name: text(args.name, 1, 50, "Name"),
      campus: text(args.campus, 1, 100, "Campus"),
    };
    const old = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", i.subject))
      .unique();
    if (old) await ctx.db.patch(old._id, data);
    else await ctx.db.insert("profiles", { ...data, userId: i.subject });
  },
});
export const saved = query({
  args: {},
  handler: async (ctx) => {
    const i = await user(ctx);
    return ctx.db
      .query("savedRoutes")
      .withIndex("by_user", (q) => q.eq("userId", i.subject))
      .collect();
  },
});
export const toggleRoute = mutation({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }) => {
    const i = await user(ctx);
    if (!commuteRoutes.some((r) => r.id === routeId))
      throw new ConvexError("Unknown route.");
    const all = await ctx.db
      .query("savedRoutes")
      .withIndex("by_user", (q) => q.eq("userId", i.subject))
      .collect();
    const old = all.find((r) => r.routeId === routeId);
    if (old) await ctx.db.delete(old._id);
    else await ctx.db.insert("savedRoutes", { userId: i.subject, routeId });
  },
});
