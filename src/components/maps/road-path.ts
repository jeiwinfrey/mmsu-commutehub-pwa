import { useMemo, useState } from "react";
import type { Coordinate, DemoRoute } from "@/lib/commute-catalog";
import { distanceMeters } from "@/lib/commute-catalog";
export type RoadPath = {
  points: Coordinate[];
  source: "osrm" | "schematic";
  error?: string;
};
import { useQuery, useAction } from "convex/react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/backend";
/** Geometry is fetched once by the backend, not once per browser or vehicle tick. */
export function useRoadPath(route: DemoRoute) {
  const retryAction = useAction(api.vehicles.retryPath);
  const [retrying, setRetrying] = useState(false);
  const paths = useQuery(api.vehicles.paths);
  const road = paths?.find((p) => p.routeId === route.id);
  const path: RoadPath | null = useMemo(
    () =>
      paths
        ? {
            points: (road?.points ??
              route.stops.map((s) => s.coordinates)) as Coordinate[],
            source: road?.source === "osrm" ? "osrm" : "schematic",
            error:
              road?.source === "osrm"
                ? undefined
                : "Road routing is unavailable. The dashed line is schematic; stop selection still works.",
          }
        : null,
    [paths, road, route],
  );
  return {
    path,
    loading: paths === undefined,
    retrying,
    retry: async () => {
      if (retrying) return;
      setRetrying(true);
      try {
        await retryAction({ routeId: route.id });
        toast.success("Road route updated");
      } catch (e) {
        toast.error(errorMessage(e));
      } finally {
        setRetrying(false);
      }
    },
  };
}
export function cumulativeDistances(points: readonly Coordinate[]) {
  const values = [0];
  for (let i = 1; i < points.length; i++)
    values.push(values[i - 1] + distanceMeters(points[i - 1], points[i]));
  return values;
}
export function distanceOnPath(
  points: readonly Coordinate[],
  distances: readonly number[],
  point: Coordinate,
) {
  let best = Infinity,
    index = 0;
  points.forEach((p, i) => {
    const d = distanceMeters(p, point);
    if (d < best) {
      best = d;
      index = i;
    }
  });
  return distances[index] ?? 0;
}
export function pointOnPath(
  points: readonly Coordinate[],
  distances: readonly number[],
  distance: number,
): Coordinate {
  if (!points.length) return [120.5937, 18.1955];
  if (distance <= 0) return points[0];
  for (let i = 1; i < points.length; i++) {
    if (distances[i] >= distance) {
      const part =
        (distance - distances[i - 1]) / (distances[i] - distances[i - 1] || 1);
      return [
        points[i - 1][0] + (points[i][0] - points[i - 1][0]) * part,
        points[i - 1][1] + (points[i][1] - points[i - 1][1]) * part,
      ];
    }
  }
  return points[points.length - 1];
}
