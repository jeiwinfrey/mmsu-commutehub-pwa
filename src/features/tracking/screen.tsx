"use client";
import { useNow } from "@/lib/use-now";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useConvexConnectionState } from "convex/react";
import { api, errorMessage } from "@/lib/backend";
import { AccountRequired } from "@/components/commute/account-required";
import { Intro, Metrics, Notice } from "@/components/commute/ui";
import {
  commuteRoutes,
  place,
  money,
  modeLabel,
  type DemoRoute,
} from "@/lib/commute-catalog";
import {
  useRoadPath,
  cumulativeDistances,
  pointOnPath,
  distanceOnPath,
} from "@/components/maps/road-path";
import { RoadMap } from "@/components/maps/road-map";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { Doc } from "@/lib/backend";
export function TrackingScreen() {
  return (
    <AccountRequired>
      <Tracking />
    </AccountRequired>
  );
}
function Tracking() {
  const trips = useQuery(api.trips.list),
    vehicles = useQuery(api.vehicles.list);
  if (!trips || !vehicles)
    return (
      <div role="status">
        <Skeleton className="h-64" />
        <p>Loading your journey…</p>
      </div>
    );
  const trip = trips.find(
      (t) => t.status === "waiting" || t.status === "riding",
    ),
    route = commuteRoutes.find((r) => r.id === trip?.routeId),
    vehicle = vehicles.find((v) => v.key === trip?.vehicleId);
  if (!trip || !route || !vehicle)
    return (
      <div className="feature-stack">
        <Intro
          title="Find your next ride."
          description="You have no active trip. Choose a vehicle and pickup to start tracking."
        />
        <Button asChild>
          <Link href="/commute">Find a ride</Link>
        </Button>
      </div>
    );
  return <Journey trip={trip} route={route} vehicle={vehicle} />;
}
function Journey({
  trip,
  route,
  vehicle,
}: {
  trip: Doc<"trips">;
  route: DemoRoute;
  vehicle: Doc<"vehicles">;
}) {
  const [saving, setSaving] = useState(false);
  const now = useNow();
  const connection = useConvexConnectionState();
  const { path, loading, retry, retrying } = useRoadPath(route),
    update = useMutation(api.trips.update);
  const pickup = place(trip.pickupId)!;
  if (loading || !path)
    return (
      <div role="status">
        <Skeleton className="h-64" />
        <p>Loading road map…</p>
      </div>
    );
  const ds = cumulativeDistances(path.points),
    total = ds.at(-1) ?? 1,
    phase =
      (vehicle.phase +
        ((Math.max(0, (now || vehicle.updatedAt) - vehicle.updatedAt) / 1000) *
          vehicle.speedKmh) /
          3.6 /
          total) %
      1,
    position = pointOnPath(path.points, ds, phase * total),
    pickupDistance = distanceOnPath(path.points, ds, pickup.coordinates),
    remaining = (pickupDistance - phase * total + total) % total,
    eta = Math.max(1, Math.ceil(remaining / (vehicle.speedKmh / 3.6) / 60)),
    riding = trip.status === "riding",
    stale = !connection.isWebSocketConnected;
  return (
    <div className="feature-stack">
      <Intro
        title={
          riding
            ? "You’re on your way."
            : stale
              ? "Waiting for an update."
              : `About ${eta} min\nto your pickup.`
        }
        description={`${pickup.shortName} → ${place(trip.to)?.shortName}`}
        step={
          riding
            ? "ON BOARD"
            : trip.notified
              ? remaining / (vehicle.speedKmh / 3.6) < 30
                ? "ARRIVING"
                : "APPROACHING"
              : "WAITING FOR PICKUP"
        }
      />
      <div className="hero-panel">
        <p className="eyebrow">SIMULATED VEHICLE · NOT A BOOKING</p>
        <h2 className="text-2xl font-semibold">{vehicle.label}</h2>
        <p>
          {modeLabel(route.mode)} · {vehicle.occupancy.replaceAll("-", " ")}
        </p>
      </div>
      {trip.notified && !riding && (
        <Notice title="Your vehicle entered the pickup area">
          Get ready. This proximity event is saved to your account. A vehicle’s
          arrival does not confirm boarding.
        </Notice>
      )}
      {stale && (
        <Notice title="Updates are stale" warning>
          The live connection is interrupted. Arrival estimates are unavailable
          until the connection recovers.
        </Notice>
      )}
      <RoadMap
        path={path}
        stops={route.stops}
        pickup={pickup}
        radius={trip.radius}
        vehicle={position}
        focusPickup
      />
      {path.source === "schematic" && (
        <>
          <Notice title="Road routing unavailable" warning>
            The dashed line is schematic. Select stops manually and retry road
            routing.
          </Notice>
          <Button variant="outline" onClick={retry} disabled={retrying}>
            {retrying ? "Retrying…" : "Retry road routing"}
          </Button>
        </>
      )}
      <Metrics
        items={[
          {
            label: "Simulated speed",
            value: stale ? "—" : `${vehicle.speedKmh} km/h`,
          },
          { label: "Alert radius", value: `${trip.radius} m` },
          { label: "Pickup ETA", value: stale || riding ? "—" : `${eta} min` },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>Your trip</CardTitle>
          <CardDescription>
            Saved to your account. Updates continue when you return to the app.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <p>{pickup.name}</p>
          <p className="font-semibold">
            {money(trip.fareCentavos)} {trip.student ? "student" : "regular"}{" "}
            estimate
          </p>
          <p className="text-xs text-muted-foreground">
            Tariffs and terminal candidates are unverified. Pay the operator
            directly.
          </p>
        </CardContent>
      </Card>
      <Button
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          try {
            await update({
              id: trip._id,
              status: riding ? "completed" : "riding",
            });
            toast.success(riding ? "Trip completed" : "Boarding recorded");
          } catch (e) {
            toast.error(errorMessage(e));
          } finally {
            setSaving(false);
          }
        }}
      >
        {saving
          ? "Saving trip…"
          : riding
            ? "I’ve arrived · complete trip"
            : "I have boarded"}
      </Button>
      <Button asChild variant="outline">
        <Link href="/trips">View my trips</Link>
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost">Cancel trip</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this trip?</AlertDialogTitle>
            <AlertDialogDescription>
              This stops proximity alerts for the trip and records it as
              cancelled in your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep trip</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await update({ id: trip._id, status: "cancelled" });
                } catch (e) {
                  toast.error(errorMessage(e));
                }
              }}
            >
              Cancel trip
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
