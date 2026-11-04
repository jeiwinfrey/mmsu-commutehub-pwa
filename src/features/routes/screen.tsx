"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  ArrowRight,
  MapPin,
  Route,
  GraduationCap,
} from "@/components/commute/icons";
import { useDemo } from "@/components/commute/demo-provider";
import {
  Intro,
  Notice,
  PreviewTools,
  SelectField,
} from "@/components/commute/ui";
import { places, matchingRoutes, modeLabel } from "@/lib/commute-catalog";
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
import { FieldGroup } from "@/components/ui/field";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

export function RoutesScreen() {
  const { search, setSearch, chooseRoute, preferences, watch } = useDemo();
  const [preview, setPreview] = useState("normal");
  const router = useRouter();
  const matches = matchingRoutes(search.from, search.to);
  const corridors = [...new Set(matches.map((r) => r.corridor))];
  const options = [
    ...places.map((p) => ({ value: p.id, label: p.shortName })),
    { value: "dingras", label: "MMSU Dingras · outside demo coverage" },
  ];
  const go = (id: string) => {
    chooseRoute(id);
    router.push("/commute/vehicles");
  };
  return (
    <div className="feature-stack">
      <Intro
        title="Where are you\nheading?"
        description={`${preferences.name ? `Hi ${preferences.name}. ` : ""}Choose a corridor to start your commute.`}
      />
      {watch && (
        <Button asChild variant="outline">
          <Link href="/commute/tracking">
            Resume your simulated ride
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Link>
        </Button>
      )}
      <div className="hero-panel">
        <p className="eyebrow">YOUR ROUTE TO CLASS</p>
        <p className="text-2xl font-semibold">
          A little less waiting.
          <br />A better commute.
        </p>
        <p className="text-sm">Laoag · Batac · Paoay · Badoc · Vigan</p>
      </div>
      <FieldGroup>
        <SelectField
          id="route-from"
          label="From"
          value={search.from}
          onChange={(from) => setSearch({ ...search, from })}
          options={options}
        />
        <SelectField
          id="route-to"
          label="To"
          value={search.to}
          onChange={(to) => setSearch({ ...search, to })}
          options={options}
        />
      </FieldGroup>
      <Button
        variant="ghost"
        className="w-fit"
        onClick={() => setSearch({ from: search.to, to: search.from })}
      >
        <ArrowLeftRight data-icon="inline-start" aria-hidden="true" />
        Swap direction
      </Button>
      {search.from === search.to && (
        <p role="alert" className="text-sm text-destructive">
          Choose different starting and destination locations.
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Supported corridors</h2>
        <Badge variant="outline">Both directions</Badge>
      </div>
      {preview === "loading" ? (
        <div role="status" aria-label="Loading routes">
          <Skeleton className="h-32 w-full" />
          <p className="mt-3 text-sm">Finding route options · preview</p>
        </div>
      ) : preview === "error" ? (
        <Notice title="Routes could not be loaded · preview" warning>
          Your choices are still here.{" "}
          <Button variant="outline" onClick={() => setPreview("normal")}>
            Retry routes
          </Button>
        </Notice>
      ) : preview === "empty" || !matches.length ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No supported journey</EmptyTitle>
            <EmptyDescription>
              {search.from === search.to
                ? "Your start and destination must be different."
                : "This demo covers the Laoag–Batac–Paoay jeepney corridor and Laoag–Badoc/Vigan buses. It does not invent direct campus connections."}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              onClick={() => {
                setSearch({ from: "laoag", to: "mmsu" });
                setPreview("normal");
              }}
            >
              Try Laoag to MMSU Batac
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        corridors.map((corridor) => {
          const routes = matches.filter((r) => r.corridor === corridor);
          const r =
            routes.find((r) => r.mode === "modern-jeepney") ?? routes[0];
          const a = r.stops.findIndex((s) => s.id === search.from),
            b = r.stops.findIndex((s) => s.id === search.to);
          return (
            <Card key={corridor}>
              <CardHeader>
                <CardTitle className="flex items-start gap-2">
                  <Route
                    aria-hidden="true"
                    className="size-5 shrink-0 text-primary"
                  />
                  {r.name}
                </CardTitle>
                <CardDescription>
                  {r.stops[a].shortName} → {r.stops[b].shortName} ·{" "}
                  {r.direction === "outbound"
                    ? "south/westbound"
                    : "return direction"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p>{routes.map((r) => modeLabel(r.mode)).join(" & ")}</p>
                <p className="text-xs text-muted-foreground">
                  {b - a} segment{b - a === 1 ? "" : "s"} · candidate stops ·
                  sample service
                </p>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline">
                      <MapPin data-icon="inline-start" aria-hidden="true" />
                      View ordered stops
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="bottom"
                    className="mx-auto max-h-[85dvh] max-w-[480px] overflow-y-auto"
                  >
                    <SheetHeader>
                      <SheetTitle>{r.name}</SheetTitle>
                      <SheetDescription>
                        Ordered for this direction. Boarding locations are
                        unverified candidates.
                      </SheetDescription>
                    </SheetHeader>
                    <ol className="flex flex-col gap-4 px-6 pb-8">
                      {r.stops.map((s, i) => (
                        <li key={s.id} className="flex items-start gap-3">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-medium">
                              {s.name}
                              {s.id === "mmsu" && (
                                <GraduationCap
                                  aria-hidden="true"
                                  className="ml-2 inline size-4"
                                />
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {s.hint}
                            </p>
                            {s.id === search.from && (
                              <Badge variant="secondary">Your origin</Badge>
                            )}
                            {s.id === search.to && (
                              <Badge variant="secondary">
                                Your destination
                              </Badge>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </SheetContent>
                </Sheet>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => go(r.id)}>
                  See available vehicles
                  <ArrowRight data-icon="inline-end" aria-hidden="true" />
                </Button>
              </CardFooter>
            </Card>
          );
        })
      )}
      <Notice title="Before you travel">
        Fares and service are samples. Exact terminal bays, boarding permission,
        and campus access need local confirmation.
      </Notice>
      <Button asChild variant="outline">
        <Link href="/onboarding">Set up your commute preferences</Link>
      </Button>
      <PreviewTools value={preview} onChange={setPreview} />
    </div>
  );
}
