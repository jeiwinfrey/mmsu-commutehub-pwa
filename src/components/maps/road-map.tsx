"use client";
import dynamic from "next/dynamic";
import type { Coordinate, DemoStop } from "@/lib/commute-catalog";
import type { RoadPath } from "./road-path";
import { Skeleton } from "@/components/ui/skeleton";
export type RoadMapProps = {
  path: RoadPath;
  stops: readonly DemoStop[];
  pickup?: DemoStop;
  radius?: number;
  vehicle?: Coordinate;
  onPick?: (id: string) => void;
  onInvalidPick?: () => void;
  focusPickup?: boolean;
};
const LeafletMap = dynamic(() => import("./road-map-client"), {
  ssr: false,
  loading: () => (
    <div role="status">
      <Skeleton className="h-[260px] w-full" />
      <span className="sr-only">Loading map</span>
    </div>
  ),
});
export function RoadMap(props: RoadMapProps) {
  return (
    <div
      className="map-shell"
      role="region"
      aria-label="Interactive sample commute map"
    >
      <LeafletMap {...props} />
    </div>
  );
}
