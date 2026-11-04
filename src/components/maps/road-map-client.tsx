"use client";
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Circle,
  CircleMarker,
  Tooltip,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { divIcon, latLngBounds } from "leaflet";
import { distanceMeters } from "@/lib/commute-catalog";
import type { RoadMapProps } from "./road-map";
import "leaflet/dist/leaflet.css";
function MapBehavior({
  path,
  pickup,
  radius,
  focusPickup,
  stops,
  onPick,
  onInvalidPick,
}: RoadMapProps) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (focusPickup && pickup)
        map.fitBounds(
          latLngBounds(
            [
              pickup.coordinates[1] - (radius ?? 500) / 111320,
              pickup.coordinates[0] - (radius ?? 500) / 105900,
            ],
            [
              pickup.coordinates[1] + (radius ?? 500) / 111320,
              pickup.coordinates[0] + (radius ?? 500) / 105900,
            ],
          ).pad(0.25),
          { animate: false, maxZoom: 15 },
        );
      else
        map.fitBounds(
          path.points.map(([lng, lat]) => [lat, lng] as [number, number]),
          { padding: [24, 24], animate: false, maxZoom: 14 },
        );
    }, 50);
    return () => clearTimeout(timer);
  }, [map, path, focusPickup, pickup, radius]);
  useMapEvents({
    click(e) {
      if (!onPick) return;
      const nearest = [...stops].sort(
        (a, b) =>
          distanceMeters(a.coordinates, [e.latlng.lng, e.latlng.lat]) -
          distanceMeters(b.coordinates, [e.latlng.lng, e.latlng.lat]),
      )[0];
      if (
        nearest &&
        distanceMeters(nearest.coordinates, [e.latlng.lng, e.latlng.lat]) <= 200
      )
        onPick(nearest.id);
      else onInvalidPick?.();
    },
  });
  return pickup ? (
    <Circle
      center={[pickup.coordinates[1], pickup.coordinates[0]]}
      radius={radius ?? 500}
      pathOptions={{
        color: "#166534",
        fillOpacity: 0.09,
        weight: 2,
        dashArray: "5 5",
      }}
    />
  ) : null;
}
export default function RoadMapClient(props: RoadMapProps) {
  const { path, stops, pickup, vehicle, onPick } = props;
  const [tilesFailed, setTilesFailed] = useState(false);
  const marker = useMemo(
    () =>
      divIcon({
        className: "",
        html: '<span class="map-pin" aria-label="Simulated vehicle">V</span>',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
    [],
  );
  return (
    <>
      <MapContainer
        center={[18.1, 120.56]}
        zoom={11}
        scrollWheelZoom={false}
        dragging={true}
        minZoom={7}
        maxZoom={18}
        attributionControl={true}
      >
        <TileLayer
          url={
            process.env.NEXT_PUBLIC_MAP_TILE_URL ||
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          eventHandlers={{ tileerror: () => setTilesFailed(true) }}
        />
        <Polyline
          positions={path.points.map(([lng, lat]) => [lat, lng])}
          pathOptions={{
            color: "#166534",
            weight: 4,
            ...(path.source === "schematic" ? { dashArray: "6 8" } : {}),
          }}
        />
        {stops.map((s) => (
          <CircleMarker
            key={s.id}
            center={[s.coordinates[1], s.coordinates[0]]}
            radius={s.id === pickup?.id ? 8 : 5}
            pathOptions={{
              color: "#166534",
              fillColor: s.id === pickup?.id ? "#166534" : "#ffffff",
              fillOpacity: 1,
              weight: 2,
            }}
            eventHandlers={{ click: () => onPick?.(s.id) }}
          >
            <Tooltip>{s.name} · candidate</Tooltip>
          </CircleMarker>
        ))}
        {vehicle && (
          <Marker position={[vehicle[1], vehicle[0]]} icon={marker}>
            <Tooltip>Simulated vehicle · not live</Tooltip>
          </Marker>
        )}
        <MapBehavior {...props} />
      </MapContainer>
      {tilesFailed && (
        <p
          role="status"
          className="bg-warning px-3 py-2 text-xs text-warning-foreground"
        >
          Map tiles could not load. The route overlay and stop list remain
          available.
        </p>
      )}
    </>
  );
}
