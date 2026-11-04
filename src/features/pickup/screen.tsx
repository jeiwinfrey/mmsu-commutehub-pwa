"use client";
import { useNow } from "@/lib/use-now";
import Link from "next/link";
import { useState } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { useOnlineMutation as useMutation } from "@/lib/use-online-mutation";
import { api, errorMessage } from "@/lib/backend";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Check,
  Map,
  List,
  Bell,
} from "@/components/commute/icons";
import { useDemo } from "@/components/commute/demo-provider";
import { Intro, Notice, PreviewTools } from "@/components/commute/ui";
import {
  commuteRoutes,
  distanceMeters,
  estimateFare,
  modeLabel,
  money,
  routeLabel,
} from "@/lib/commute-catalog";
import type { DemoRoute } from "@/lib/commute-catalog";
import type { PickupSelection, Vehicle } from "@/types/commute";
import { useRoadPath } from "@/components/maps/road-path";
import { RoadMap } from "@/components/maps/road-map";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PickupScreen() {
  const now = useNow();
  const demo = useDemo();
  const route = commuteRoutes.find((r) => r.id === demo.routeId);
  const offers = useQuery(api.vehicles.offers, {
    from: demo.search.from,
    to: demo.search.to,
    refreshBucket: Math.floor(now / 10000),
    routeId: demo.routeId ?? undefined,
  });
  const vehicle = offers?.find(
    (v) => v.id === demo.vehicleId && (!demo.runId || v.runId === demo.runId),
  );
  if (offers === undefined)
    return (
      <div role="status">
        <Skeleton className="h-48" />
        <p>Checking the selected vehicle run…</p>
      </div>
    );
  if (!route || !vehicle)
    return (
      <div className="feature-stack">
        <Intro
          title="Choose your ride first"
          description="Select an available directional run before setting your pickup. If it has passed, choose a different run."
        />
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No vehicle selected</EmptyTitle>
            <EmptyDescription>
              Choose your route again to start a new journey.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/commute/vehicles">Choose a vehicle</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  return <PickupJourney key={vehicle.id} route={route} vehicle={vehicle} />;
}
function PickupJourney({
  route,
  vehicle,
}: {
  route: DemoRoute;
  vehicle: Vehicle;
}) {
  const demo = useDemo();
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const startTrip = useMutation(api.trips.start);
  const [saving, setSaving] = useState(false);
  const { path, loading, retry, retrying } = useRoadPath(route);
  const a = route.stops.findIndex((s) => s.id === demo.search.from),
    b = route.stops.findIndex((s) => s.id === demo.search.to);
  const candidates = route.stops.slice(a, b);
  const [stopId, setStopId] = useState(
    demo.pickup && candidates.some((s) => s.id === demo.pickup!.stopId)
      ? demo.pickup.stopId
      : (candidates[0]?.id ?? ""),
  );
  const [radius, setRadius] = useState<PickupSelection["radiusMeters"]>(
    demo.pickup?.radiusMeters ??
      ((demo.preferences.defaultRadius ??
        500) as PickupSelection["radiusMeters"]),
  );
  const [locationStatus, setLocationStatus] = useState("");
  const locate = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Location is unavailable. Choose a stop manually.");
      return;
    }
    setLocationStatus("Finding your nearest candidate stop…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here: [number, number] = [
          pos.coords.longitude,
          pos.coords.latitude,
        ];
        const nearest = [...candidates].sort(
          (a, b) =>
            distanceMeters(a.coordinates, here) -
            distanceMeters(b.coordinates, here),
        )[0];
        if (!nearest || distanceMeters(nearest.coordinates, here) > 5000) {
          setLocationStatus(
            "You are outside this corridor’s pickup area. Choose a listed stop manually.",
          );
          return;
        }
        setStopId(nearest.id);
        setLocationStatus(
          `Nearest candidate: ${nearest.shortName}. Confirm a safe boarding place yourself.`,
        );
      },
      () =>
        setLocationStatus(
          "Location could not be used. Check browser permission, or choose a stop manually.",
        ),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };
  const [stage, setStage] = useState(0);
  const [query, setQuery] = useState("");
  const [mapOpen, setMapOpen] = useState(true);
  const [mapError, setMapError] = useState("");
  const [preview, setPreview] = useState("normal");
  const pickup = candidates.find((s) => s.id === stopId);
  const shown =
    preview === "empty"
      ? []
      : candidates.filter((s) =>
          (s.name + " " + s.hint).toLowerCase().includes(query.toLowerCase()),
        );
  const fare = estimateFare(route, stopId, demo.search.to);
  const pick = (id: string) => {
    setStopId(id);
    setMapError("");
  };
  const next = () => {
    if (!pickup) return;
    demo.setPickup({ stopId, radiusMeters: radius });
    setStage((n) => n + 1);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const watch = async () => {
    if (!pickup || !fare) return;
    if (!isAuthenticated) {
      router.push("/sign-in?redirect_url=/commute/pickup");
      return;
    }
    setSaving(true);
    try {
      await startTrip({
        routeId: route.id,
        vehicleId: vehicle.id,
        runId: demo.runId ?? undefined,
        from: demo.search.from,
        to: demo.search.to,
        pickupId: stopId,
        radius,
        student: demo.preferences.student,
      });
      router.push("/commute/tracking");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="feature-stack">
      <Intro
        title={
          stage === 0
            ? "Where will you\nmeet your ride?"
            : stage === 1
              ? "How early should\nwe alert you?"
              : "Ready to watch\nyour ride?"
        }
        description={
          stage === 0
            ? "Choose a candidate stop served before your destination."
            : stage === 1
              ? "The circle stays centered on your selected pickup."
              : "Review your selections before starting your trip."
        }
        step={`STEP 3 · ${["PICKUP", "ALERT RADIUS", "REVIEW"][stage]}`}
        back="/commute/vehicles"
      />
      {stage < 2 && (
        <>
          <Button
            variant="outline"
            onClick={() => setMapOpen(!mapOpen)}
            aria-expanded={mapOpen}
            aria-controls="pickup-map"
          >
            {mapOpen ? (
              <List data-icon="inline-start" aria-hidden="true" />
            ) : (
              <Map data-icon="inline-start" aria-hidden="true" />
            )}
            {mapOpen ? "Use stop list instead" : "Show street map"}
          </Button>
          {mapOpen && (
            <div id="pickup-map" className="flex flex-col gap-3">
              {loading || !path ? (
                <div role="status">
                  <Skeleton className="h-[260px] w-full" />
                  <p className="mt-2 text-xs">Loading road route…</p>
                </div>
              ) : (
                <>
                  <RoadMap
                    path={path}
                    stops={candidates}
                    pickup={pickup}
                    radius={stage === 1 ? radius : undefined}
                    focusPickup={stage === 1}
                    onPick={pick}
                    onInvalidPick={() =>
                      setMapError(
                        "Choose within 200 m of a listed candidate stop. We won’t select an arbitrary roadside pickup.",
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {path.source === "osrm"
                      ? "OSRM road geometry · approximate sample service, not a verified operator route."
                      : path.error}
                  </p>
                  {path.source === "schematic" && (
                    <Button
                      variant="outline"
                      onClick={retry}
                      disabled={retrying}
                    >
                      {retrying ? "Retrying…" : "Retry road routing"}
                    </Button>
                  )}
                </>
              )}
              {mapError && (
                <p role="alert" className="text-sm text-destructive">
                  {mapError}
                </p>
              )}
            </div>
          )}
        </>
      )}
      {stage === 0 && (
        <>
          <Button variant="outline" onClick={locate}>
            Find my nearest stop
          </Button>
          {locationStatus && (
            <p role="status" className="text-sm text-muted-foreground">
              {locationStatus}
            </p>
          )}
          <Field>
            <FieldLabel htmlFor="pickup-search">
              Search candidate stops
            </FieldLabel>
            <Input
              id="pickup-search"
              className="min-h-12"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Stop name or landmark"
            />
            <FieldDescription>
              No GPS permission is required. Map clicks snap only to nearby
              listed candidates.
            </FieldDescription>
          </Field>
          {preview === "loading" ? (
            <div role="status">
              <Skeleton className="h-24 w-full" />
              <p>Loading stops · preview</p>
            </div>
          ) : preview === "error" ? (
            <Notice title="Stop list unavailable · preview" warning>
              <Button variant="outline" onClick={() => setPreview("normal")}>
                Retry stops
              </Button>
            </Notice>
          ) : !shown.length ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No matching pickup stops</EmptyTitle>
                <EmptyDescription>
                  Try a different search. Your destination cannot also be your
                  pickup.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  onClick={() => {
                    setQuery("");
                    setPreview("normal");
                  }}
                >
                  Clear stop search
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <ul className="flex flex-col gap-3">
              {shown.map((s) => (
                <li key={s.id}>
                  <Button
                    variant="outline"
                    className="h-auto w-full justify-start gap-3 px-4 py-4 text-left"
                    aria-pressed={stopId === s.id}
                    onClick={() => pick(s.id)}
                  >
                    <MapPin data-icon="inline-start" aria-hidden="true" />
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span>{s.name}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {s.hint}
                      </span>
                    </span>
                    {stopId === s.id && (
                      <Check data-icon="inline-end" aria-hidden="true" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <Notice title="Unverified candidate" warning>
            These coordinates are approximate UI fixtures. Confirm exact
            terminal bay, road side, and safe boarding permission locally before
            real travel.
          </Notice>
          <Button disabled={!pickup || preview !== "normal"} onClick={next}>
            Use this pickup
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Button>
        </>
      )}
      {stage === 1 && (
        <>
          <div>
            <p className="text-sm text-muted-foreground">Selected pickup</p>
            <p className="font-semibold">{pickup?.name}</p>
          </div>
          <Field>
            <FieldLabel>Nearby alert radius</FieldLabel>
            <ToggleGroup
              type="single"
              value={String(radius)}
              onValueChange={(v) => {
                if (["100", "250", "500", "1000"].includes(v))
                  setRadius(Number(v) as PickupSelection["radiusMeters"]);
              }}
              variant="outline"
              className="grid w-full grid-cols-4 gap-2"
              aria-label="Nearby alert radius"
            >
              {[100, 250, 500, 1000].map((n) => (
                <ToggleGroupItem
                  className="min-h-11 w-full"
                  value={String(n)}
                  key={n}
                >
                  {n === 1000 ? "1 km" : `${n} m`}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <FieldDescription>
              The vehicle, not your phone, enters this fixed area. Enable device
              notifications in Profile to receive alerts in the background.
            </FieldDescription>
          </Field>
          <Notice title="A little time to get ready">
            We’ll create an alert when your simulated vehicle enters the{" "}
            {radius.toLocaleString()} m area. Entry does not mean the vehicle
            has reached your exact stop.
          </Notice>
          <Button onClick={next}>
            Confirm pickup and radius
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Button>
        </>
      )}
      {stage === 2 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{routeLabel(route)}</CardTitle>
              <CardDescription>
                {modeLabel(route.mode)} · {vehicle.label}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Pickup</p>
                <p>{pickup?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Destination</p>
                <p>{route.stops[b]?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nearby alert</p>
                <p>{radius.toLocaleString()} m around pickup</p>
              </div>
              {fare && (
                <div className="flex flex-col gap-1 border-t pt-3">
                  <p className="text-lg font-semibold text-primary">
                    {money(
                      demo.preferences.student
                        ? fare.studentCentavos
                        : fare.regularCentavos,
                    )}{" "}
                    {demo.preferences.student ? "student" : "regular"} estimate
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Regular {money(fare.regularCentavos)}
                    {demo.preferences.student &&
                      ` − 20% (${money(fare.regularCentavos - fare.studentCentavos)})`}
                    . Recomputed for your pickup, sample tariff only.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          <Badge variant="secondary">
            <Bell aria-hidden="true" />
            {demo.preferences.nearbyAlerts
              ? "Proximity alerts enabled"
              : "Nearby alerts off"}
          </Badge>
          <Notice title="Your trip is saved to your account">
            Follow a simulated vehicle. Your pickup and trip history are saved.
            This does not reserve a seat.
          </Notice>
          <Button disabled={!fare || saving} onClick={watch}>
            {saving
              ? "Starting…"
              : isAuthenticated
                ? "Start tracking this vehicle"
                : "Sign in to start tracking"}
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Button>
        </>
      )}
      {stage > 0 && (
        <Button variant="outline" onClick={() => setStage((n) => n - 1)}>
          <ArrowLeft data-icon="inline-start" aria-hidden="true" />
          Back to {stage === 2 ? "radius" : "pickup"}
        </Button>
      )}
      {stage === 0 && <PreviewTools value={preview} onChange={setPreview} />}
    </div>
  );
}
