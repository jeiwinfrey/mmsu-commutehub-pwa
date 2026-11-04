"use client";
import type { FunctionReturnType } from "convex/server";
import { api, localDate } from "@/lib/backend";
import { modeLabel, money } from "@/lib/commute-catalog";
import { Notice, Metrics } from "@/components/commute/ui";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
export type Suggestions = FunctionReturnType<typeof api.planner.suggestions>;
export type DepartureOption = NonNullable<Suggestions["recommended"]>;
export function DepartureOptions({
  result,
  classAt,
  student,
  busy,
  onSave,
}: {
  result: Suggestions;
  classAt: number;
  student: boolean;
  busy: boolean;
  onSave: (option: DepartureOption) => void;
}) {
  return (
    <section
      className="feature-stack"
      aria-label="Departure comparison"
      aria-live="polite"
    >
      <h2 className="text-lg font-semibold">Compare departures</h2>
      <p className="text-xs text-muted-foreground">
        Calculated {localDate(result.calculatedAt)} · simulated schedules and
        illustrative fares. Future crowding is unknown; an earlier run is not a
        promise of more space.
      </p>
      {result.coverage === "partial" && (
        <Notice title="Some routes are unavailable" warning>
          These results use the road routes currently available. Other modes may
          have missing geometry.
        </Notice>
      )}
      {!result.recommended && (
        <Notice
          title={
            result.earliest
              ? "Arrival target cannot be met"
              : "No journey available"
          }
          warning
        >
          {result.unavailable ??
            (result.earliest
              ? "The earliest journey you can still reach is shown below. Check the class arrival and buffer shortfall before saving."
              : "No supported simulated departure is available. Try another starting point or mode.")}
        </Notice>
      )}
      {(
        [
          { label: "Recommended", plan: result.recommended },
          { label: "Earlier departure", plan: result.earlier },
          { label: "Earliest reachable arrival", plan: result.earliest },
        ] as const
      ).map(
        ({ label, plan }) =>
          plan && (
            <Card key={`${plan.routeId}:${plan.departureAt}`}>
              <CardHeader>
                <Badge
                  className="w-fit"
                  variant={
                    plan.bufferShortfallMinutes ? "destructive" : "secondary"
                  }
                >
                  {label}
                </Badge>
                <CardTitle>{modeLabel(plan.selectedMode)}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3">
                <p>
                  Leave by <strong>{localDate(plan.leaveAt)}</strong>
                </p>
                <p>
                  Pickup departure{" "}
                  <strong>{localDate(plan.departureAt)}</strong>
                </p>
                <p>
                  Campus arrival <strong>{localDate(plan.arriveAt)}</strong>
                </p>
                {plan.bufferShortfallMinutes > 0 && (
                  <p className="font-semibold text-destructive">
                    {plan.lateMinutes > 0
                      ? `${plan.lateMinutes} min after class starts.`
                      : "Before class, but without the requested arrival buffer."}{" "}
                    Arrival target missed by {plan.bufferShortfallMinutes} min.
                  </p>
                )}
                <Metrics
                  items={[
                    { label: "Walking", value: `${plan.walkMinutes} min` },
                    { label: "Waiting", value: `${plan.waitMinutes} min` },
                    {
                      label: "Ride estimate",
                      value: `${plan.rideMinutes} min`,
                    },
                  ]}
                />
                <p className="text-sm">
                  Total journey{" "}
                  {plan.walkMinutes + plan.waitMinutes + plan.rideMinutes} min ·{" "}
                  {plan.arriveAt <= classAt
                    ? `${Math.floor((classAt - plan.arriveAt) / 60000)} min before class`
                    : `${plan.lateMinutes} min after class`}
                  .
                </p>
                <p className="text-sm">
                  {plan.originWalkMinutes} min to pickup +{" "}
                  {plan.campusWalkMinutes} min campus walk ·{" "}
                  {money(
                    student
                      ? plan.studentFareCentavos
                      : plan.regularFareCentavos,
                  )}{" "}
                  {student ? "student" : "regular"} estimate.
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  className="h-auto min-w-0 whitespace-normal text-center"
                  disabled={busy}
                  variant={plan.bufferShortfallMinutes ? "outline" : "default"}
                  onClick={() => onSave(plan)}
                >
                  {busy
                    ? "Saving…"
                    : plan.bufferShortfallMinutes
                      ? "Save despite missed arrival target"
                      : label === "Earlier departure"
                        ? "Save earlier departure"
                        : "Save this departure"}
                </Button>
              </CardFooter>
            </Card>
          ),
      )}
    </section>
  );
}
