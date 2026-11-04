"use client";
import { useNow } from "@/lib/use-now";
import {
  fleetNetwork,
  projectFleetVehicle,
  runAtOrdinal,
  runMetersAt,
} from "@/lib/fleet-simulation";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useConvexConnectionState } from "convex/react";
import { useOnlineMutation as useMutation } from "@/lib/use-online-mutation";
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
import { useRoadPath } from "@/components/maps/road-path";
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
import type { FunctionReturnType } from "convex/server";
import type { Doc } from "@/lib/backend";
export function TrackingScreen() {
  return (
    <AccountRequired>
      <Tracking />
    </AccountRequired>
  );
}
function Tracking() {
  const tracking = useQuery(api.trips.tracking);
  if (tracking === undefined)
    return (
      <div role="status">
        <Skeleton className="h-64" />
        <p>Loading your journey…</p>
      </div>
    );
  const trip = tracking?.trip,
    vehicle = tracking?.vehicle,
    route = commuteRoutes.find((r) => r.id === trip?.routeId);
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
  return (
    <Journey
      trip={trip}
      route={route}
      vehicle={vehicle}
      heartbeatAt={tracking!.heartbeatAt}
    />
  );
}
function Journey({
  trip,
  route,
  vehicle,
  heartbeatAt,
}: {
  trip: Doc<"trips">;
  route: DemoRoute;
  vehicle: NonNullable<
    NonNullable<FunctionReturnType<typeof api.trips.tracking>>["vehicle"]
  >;
  heartbeatAt: number;
}) {
  const [saving, setSaving] = useState(false);
  const now = useNow();
  const connection = useConvexConnectionState();
  const { path, loading, retry, retrying } = useRoadPath(route),
    update = useMutation(api.trips.update);
  const roads = useQuery(api.vehicles.paths);
  const pickup = place(trip.pickupId)!;
  if (loading || !path || !roads)
    return (
      <div role="status">
        <Skeleton className="h-64" />
        <p>Loading road map…</p>
      </div>
    );
  const currentTime = now || vehicle.updatedAt,
    network = fleetNetwork(roads),
    live = projectFleetVehicle(vehicle, network, currentTime);
  const run = runAtOrdinal(
      vehicle,
      network,
      trip.runOrdinal ?? live.runOrdinal,
    ),
    frame = runMetersAt(run, currentTime);
  const onSelectedRun = live.runId === trip.runId,
    position = onSelectedRun
      ? live.position
      : currentTime < run.startAt
        ? run.leg.points[0]
        : run.leg.points.at(-1)!;
  const seconds = Math.max(
      0,
      ((trip.pickupArrivesAt ?? currentTime) - currentTime) / 1000,
    ),
    eta = Math.max(0, Math.ceil(seconds / 60)),
    riding = trip.status === "riding",
    scheduled = currentTime < (trip.runStartAt ?? 0),
    stale =
      !connection.isWebSocketConnected ||
      (!riding && !scheduled && currentTime - heartbeatAt > 30000);
  return (
    <div className="feature-stack">
      <Intro
        title={
          riding
            ? "You’re on your way."
            : stale
              ? "Waiting for an update."
              : seconds < 60
                ? "Your ride is arriving."
                : `About ${eta} min\nto your pickup.`
        }
        description={`${pickup.shortName} → ${place(trip.to)?.shortName}`}
        step={
          riding
            ? "ON BOARD"
            : trip.notified
              ? seconds < 60
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
      {scheduled && (
        <Notice title="Upcoming simulated run">
          This run has not departed its starting terminal. Its arrival estimate
          includes the remaining terminal wait.
        </Notice>
      )}
      {trip.arrivalDetectedAt && riding && (
        <Notice title="The simulated ride reached your destination">
          Confirm your own arrival below. We won’t mark the trip completed
          automatically.
        </Notice>
      )}
      {!scheduled && frame.state === "dwelling" && (
        <p role="status" className="text-sm text-muted-foreground">
          Simulated stop dwell · 0 km/h
        </p>
      )}
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
            value: stale ? "—" : `${onSelectedRun ? live.speedKmh : 0} km/h`,
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
