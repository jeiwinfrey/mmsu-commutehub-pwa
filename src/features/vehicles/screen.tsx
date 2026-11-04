"use client";
import { useNow } from "@/lib/use-now";
import { useQuery } from "convex/react";
import { api } from "@/lib/backend";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BusFront,
  Users,
  Clock3,
} from "@/components/commute/icons";
import { useDemo } from "@/components/commute/demo-provider";
import { Intro, Notice, PreviewTools } from "@/components/commute/ui";
import {
  commuteRoutes,
  matchingRoutes,
  modeLabel,
  money,
  occupancyLabel,
  place,
  routeLabel,
} from "@/lib/commute-catalog";
import type { Vehicle } from "@/types/commute";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { FareBreakdown } from "./components/fare-breakdown";

export function VehiclesScreen() {
  const { search } = useDemo();
  return (
    <VehicleSelection
      key={`${search.from}/${search.to}/${search.mode ?? ""}`}
    />
  );
}
function VehicleSelection() {
  const now = useNow();
  const demo = useDemo();
  const { search, preferences } = demo;
  const router = useRouter();
  const [mode, setMode] = useState<string>(search.mode ?? preferences.mode);
  const [preview, setPreview] = useState("normal");
  const [details, setDetails] = useState<Vehicle | null>(null);
  const selected = commuteRoutes.find((r) => r.id === demo.routeId);
  const eligible = matchingRoutes(search.from, search.to).filter(
    (r) => !selected || r.corridor === selected.corridor,
  );
  const filtered = eligible.filter((r) => mode === "any" || r.mode === mode);
  const liveVehicles = useQuery(api.vehicles.offers, {
    from: search.from,
    to: search.to,
    refreshBucket: Math.floor(now / 10000),
  });
  const vehicles = (liveVehicles ?? []).filter((v) =>
    filtered.some((r) => r.id === v.routeId),
  );
  const detailsRoute = details
    ? commuteRoutes.find((r) => r.id === details.routeId)
    : null;
  const select = (v: Vehicle) => {
    demo.chooseRoute(v.routeId);
    demo.chooseVehicle(v.id, v.runId);
    router.push("/commute/pickup");
  };
  const modeChoices = [
    { value: "any", label: "Any" },
    { value: "modern-jeepney", label: "Modern" },
    { value: "traditional-jeepney", label: "Traditional" },
    { value: "bus", label: "Bus" },
  ];
  return (
    <div className="feature-stack">
      <Intro
        title="Choose your ride"
        description={`${place(search.from)?.shortName ?? "Choose origin"} → ${place(search.to)?.shortName ?? "Choose destination"} · simulated availability`}
        step="STEP 2 · VEHICLE"
        back="/commute"
      />
      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={(v) => {
          if (v) setMode(v);
        }}
        variant="outline"
        className="grid w-full grid-cols-2 gap-2"
        aria-label="Filter transportation mode"
      >
        {modeChoices.map((m) => (
          <ToggleGroupItem
            className="min-h-11 w-full"
            key={m.value}
            value={m.value}
          >
            {m.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p className="text-sm text-muted-foreground">
        Earliest sample arrival first. Showing{" "}
        {preferences.student ? "student" : "regular"} estimates.
      </p>
      {preview === "loading" || !liveVehicles ? (
        <div
          role="status"
          className="flex flex-col gap-4"
          aria-label="Loading vehicle preview"
        >
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <p>Finding sample vehicles…</p>
        </div>
      ) : preview === "error" ? (
        <Notice warning title="Vehicle list unavailable · preview">
          Your route is still selected.{" "}
          <Button variant="outline" onClick={() => setPreview("normal")}>
            Retry vehicles
          </Button>
        </Notice>
      ) : preview === "empty" || !vehicles.length ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No vehicles available</EmptyTitle>
            <EmptyDescription>
              {!eligible.length
                ? "Choose a supported route before comparing vehicles."
                : "No sample vehicle matches this mode. Try another mode or direction."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              onClick={() => {
                setMode("any");
                setPreview("normal");
              }}
            >
              Show all modes
            </Button>
            <Button asChild variant="outline">
              <Link href="/commute">Change route</Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        vehicles.map((v) => (
          <Card key={v.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="secondary">{modeLabel(v.mode)}</Badge>
                <span className="flex items-center gap-1 text-sm font-semibold tabular-nums">
                  <Clock3 className="size-4" aria-hidden="true" />
                  {v.etaMinutes === 0 ? "Arriving" : `${v.etaMinutes} min`}
                </span>
              </div>
              <CardTitle>{v.label}</CardTitle>
              <CardDescription>
                {routeLabel(commuteRoutes.find((r) => r.id === v.routeId)!)} ·
                simulated run
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="flex items-center gap-2 text-sm">
                <Users
                  className="size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                {occupancyLabel(v.occupancy)} · simulated
              </p>
              <p className="text-lg font-semibold text-primary">
                {money(
                  preferences.student
                    ? v.fare.studentCentavos
                    : v.fare.regularCentavos,
                )}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  {preferences.student ? "student" : "regular"} estimate
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {v.passengers === null
                  ? "Passenger count unknown"
                  : `${v.passengers}/${v.capacity} simulated passengers`}
                {v.scheduled ? " · Upcoming run" : " · On this directional run"}
              </p>
              {v.occupancy === "full" && (
                <p className="text-xs text-muted-foreground">
                  Full sample vehicle. Choose another; boarding is not
                  guaranteed.
                </p>
              )}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setDetails(v)}>
                View details
              </Button>
              <Button
                className="flex-1"
                disabled={v.occupancy === "full"}
                onClick={() => select(v)}
              >
                Choose vehicle
                <ArrowRight data-icon="inline-end" aria-hidden="true" />
              </Button>
            </CardFooter>
          </Card>
        ))
      )}
      <Notice title="Before choosing">
        Arrival estimates refer to your origin. A pickup-specific demo estimate
        follows after you select a stop. These vehicles do not represent live
        operators.
      </Notice>
      <PreviewTools value={preview} onChange={setPreview} />
      <Sheet
        open={!!details}
        onOpenChange={(open) => {
          if (!open) setDetails(null);
        }}
      >
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[90dvh] max-w-[480px] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>{details?.label ?? "Vehicle details"}</SheetTitle>
            <SheetDescription>
              Sample vehicle, fare, and crowding. Nothing is reserved.
            </SheetDescription>
          </SheetHeader>
          {details && detailsRoute && (
            <div className="flex flex-col gap-6 px-6">
              <div className="flex items-center gap-2">
                <BusFront className="size-5 text-primary" aria-hidden="true" />
                <span>{routeLabel(detailsRoute)}</span>
              </div>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Arrival at origin</dt>
                  <dd>{details.etaMinutes} min · sample</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Speed</dt>
                  <dd>{details.speedKmh} km/h · simulated</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Occupancy</dt>
                  <dd>{occupancyLabel(details.occupancy)}</dd>
                </div>
              </dl>
              <FareBreakdown
                fare={details.fare}
                student={preferences.student}
              />
              <div>
                <h3 className="mb-3 font-semibold">Ordered candidate stops</h3>
                <ol className="flex flex-col gap-3">
                  {detailsRoute.stops.map((s, i) => (
                    <li key={s.id} className="text-sm">
                      <span className="mr-2 text-primary">{i + 1}.</span>
                      {s.name}
                    </li>
                  ))}
                </ol>
              </div>
              <Notice title="Crowding is illustrative">
                A vehicle’s sample occupancy is separate from community
                observations. It is not a measured passenger count.
              </Notice>
            </div>
          )}
          <SheetFooter>
            <Button
              disabled={details?.occupancy === "full"}
              onClick={() => {
                if (details) select(details);
              }}
            >
              Set pickup point
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
