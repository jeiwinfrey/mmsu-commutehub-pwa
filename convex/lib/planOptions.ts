import { ConvexError } from "convex/values";
import type { QueryCtx } from "../_generated/server";
import { matchingRoutes, type Coordinate } from "../../src/lib/commute-catalog";
import { planRoute, serviceFor } from "./planning";
export type PlanningInput = {
  from: string;
  to: string;
  mode: string;
  classAt: number;
  bufferMinutes: number;
};
export async function suggestions(
  ctx: QueryCtx,
  a: PlanningInput,
  now: number,
) {
  if (
    !Number.isFinite(a.classAt) ||
    a.classAt <= now ||
    a.classAt > now + 366 * 86400000 ||
    ![5, 10, 15, 20, 30].includes(a.bufferMinutes)
  )
    throw new ConvexError("Choose a future class time and valid buffer.");
  if (!["any", "traditional-jeepney", "modern-jeepney", "bus"].includes(a.mode))
    throw new ConvexError("Choose a supported transport mode.");
  const routes = matchingRoutes(a.from, a.to).filter(
    (r) => a.mode === "any" || a.mode === r.mode,
  );
  if (!routes.length)
    throw new ConvexError("No supported direct route for these choices.");
  type Plan = NonNullable<ReturnType<typeof planRoute>>;
  const onTime: Plan[] = [],
    earlier: Plan[] = [],
    next: Plan[] = [];
  let availableRoads = 0;
  for (const route of routes) {
    const road = await ctx.db
      .query("roadPaths")
      .withIndex("by_route", (q) => q.eq("routeId", route.id))
      .unique();
    if (!road || road.source !== "osrm") continue;
    availableRoads++;
    const points = road.points as Coordinate[];
    const best = planRoute(
      route,
      points,
      a.from,
      a.to,
      a.classAt,
      a.bufferMinutes,
      now,
    );
    if (best) {
      onTime.push(best);
      // A complete headway earlier yields a distinct, still feasible run.
      const previous = planRoute(
        route,
        points,
        a.from,
        a.to,
        a.classAt - serviceFor(route).headway * 60000,
        a.bufferMinutes,
        now,
      );
      if (previous) earlier.push(previous);
    }
    const first = planRoute(
      route,
      points,
      a.from,
      a.to,
      a.classAt,
      a.bufferMinutes,
      now,
      "earliest",
    );
    if (first) next.push(first);
  }
  onTime.sort((a, b) => b.leaveAt - a.leaveAt);
  const recommended = onTime[0] ?? null;
  const alternative = recommended
    ? ([...onTime.slice(1), ...earlier]
        .filter((p) => p.leaveAt < recommended.leaveAt)
        .sort((a, b) => b.leaveAt - a.leaveAt)[0] ?? null)
    : null;
  next.sort((a, b) => a.arriveAt - b.arriveAt);
  return {
    calculatedAt: now,
    coverage:
      availableRoads === routes.length
        ? ("complete" as const)
        : ("partial" as const),
    recommended,
    earlier: alternative,
    earliest: recommended ? null : (next[0] ?? null),
    unavailable:
      availableRoads === 0
        ? "Road routes are unavailable. Retry after the road geometry has loaded."
        : null,
  };
}
