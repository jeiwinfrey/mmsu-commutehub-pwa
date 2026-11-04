"use client";
import { useNow } from "@/lib/use-now";
import { useRouter } from "next/navigation";
import { useDemo } from "@/components/commute/demo-provider";
import type { Id, Doc } from "@/lib/backend";
import type { TransportMode } from "@/types/commute";
import { modeLabel, money } from "@/lib/commute-catalog";
import { useState } from "react";
import { useQuery } from "convex/react";
import { useOnlineMutation as useMutation } from "@/lib/use-online-mutation";
import { api, errorMessage, localDate } from "@/lib/backend";
import { places, place } from "@/lib/commute-catalog";
import { AccountRequired } from "@/components/commute/account-required";
import { Intro, SelectField, Metrics, Notice } from "@/components/commute/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
export function PlannerScreen() {
  return (
    <AccountRequired>
      <Planner />
    </AccountRequired>
  );
}
function Planner() {
  const now = useNow();
  const router = useRouter(),
    demo = useDemo();
  const [editing, setEditing] = useState<Id<"plans"> | undefined>();
  const plans = useQuery(api.planner.list),
    save = useMutation(api.planner.save),
    remove = useMutation(api.planner.remove);
  const [from, setFrom] = useState("laoag"),
    [to, setTo] = useState("mmsu"),
    [mode, setMode] = useState("any"),
    [classTime, setTime] = useState(""),
    [buffer, setBuffer] = useState("10"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const classAt = Date.parse(classTime + ":00+08:00");
      await save({
        id: editing,
        from,
        to,
        mode,
        classAt,
        bufferMinutes: Number(buffer),
        student: demo.preferences.student,
      });
      toast.success(
        editing ? "Departure plan updated" : "Departure plan saved",
      );
      setEditing(undefined);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const edit = (p: Doc<"plans">) => {
    setEditing(p._id);
    setFrom(p.from);
    setTo(p.to);
    setMode(p.mode);
    setBuffer(String(p.bufferMinutes));
    setTime(new Date(p.classAt + 8 * 3600000).toISOString().slice(0, 16));
    setError("");
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };
  const startPlannedRoute = (p: Doc<"plans">) => {
    if (!p.routeId) {
      edit(p);
      return;
    }
    demo.setSearch({
      from: p.from,
      to: p.to,
      mode: p.selectedMode as TransportMode | undefined,
    });
    demo.chooseRoute(p.routeId);
    router.push("/commute/vehicles");
  };
  return (
    <div className="feature-stack">
      <Intro
        title="Make time\nfor your morning."
        description="Work back from your class time. Your plan is saved to your account."
      />
      <form onSubmit={submit} className="feature-stack">
        {editing && (
          <p role="status" className="text-sm font-semibold text-primary">
            Editing saved plan. Changes will replace its departure reminder.
          </p>
        )}
        <SelectField
          id="planner-from"
          label="Starting location"
          value={from}
          onChange={setFrom}
          options={places
            .filter((p) => p.id !== "mmsu")
            .map((p) => ({ value: p.id, label: p.shortName }))}
        />
        <SelectField
          id="planner-campus"
          label="Destination campus"
          value={to}
          onChange={setTo}
          options={[{ value: "mmsu", label: "MMSU Batac Main Campus" }]}
          description="Other campuses are not offered until their route connections are verified."
        />
        <SelectField
          id="planner-mode"
          label="Preferred transportation"
          value={mode}
          onChange={setMode}
          options={[
            { value: "any", label: "Any available mode" },
            { value: "modern-jeepney", label: "Modern jeepney" },
            { value: "traditional-jeepney", label: "Traditional jeepney" },
            { value: "bus", label: "Bus" },
          ]}
        />
        <div className="grid gap-2">
          <Label htmlFor="class-time">Class starts · Philippine time</Label>
          <Input
            className="min-w-0 w-full"
            type="datetime-local"
            id="class-time"
            required
            value={classTime}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <SelectField
          id="planner-buffer"
          label="Arrive before class"
          value={buffer}
          onChange={setBuffer}
          options={[5, 10, 15, 20, 30].map((n) => ({
            value: String(n),
            label: `${n} minutes early`,
          }))}
        />
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
        <Button disabled={busy}>
          {busy
            ? "Planning…"
            : editing
              ? "Update departure plan"
              : "Suggest and save departure"}
        </Button>
        {editing && (
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              setEditing(undefined);
              setError("");
            }}
          >
            Cancel editing
          </Button>
        )}
      </form>
      <Notice title="Allow some breathing room">
        Schedules and vehicle speeds are simulated: 5 AM–9 PM terminal
        departures, with 10-minute traditional jeepneys, 12-minute modern
        jeepneys, and 30-minute buses. Plans include a five-minute pickup wait
        and estimated walking. Weather, traffic, and actual boarding
        availability may change your journey.
      </Notice>
      <h2 className="text-lg font-semibold">Saved plans</h2>
      {!plans ? (
        <Skeleton className="h-40" />
      ) : !plans.length ? (
        <div className="empty-panel">
          Your next class plan will appear here.
        </div>
      ) : (
        plans.map((p) => (
          <Card key={p._id}>
            <CardHeader>
              <CardTitle>
                {place(p.from)?.shortName} → {place(p.to)?.shortName}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="hero-panel">
                <p className="eyebrow">SUGGESTED DEPARTURE</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {localDate(p.leaveAt)}
                </p>
              </div>
              {p.selectedMode && (
                <p className="text-sm font-semibold">
                  {modeLabel(p.selectedMode as TransportMode)} · simulated
                  schedule
                </p>
              )}
              {p.departureAt && (
                <p className="text-sm">
                  Pickup departure <strong>{localDate(p.departureAt)}</strong>
                </p>
              )}
              <p>
                Expected arrival <strong>{localDate(p.arriveAt)}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Class {localDate(p.classAt)} · at least {p.bufferMinutes} min
                early
              </p>
              <Metrics
                items={[
                  { label: "Walking", value: `${p.walkMinutes} min` },
                  { label: "Waiting", value: `${p.waitMinutes} min` },
                  { label: "Ride estimate", value: `${p.rideMinutes} min` },
                ]}
              />
              {p.regularFareCentavos !== undefined && (
                <p className="font-semibold text-primary">
                  {money(
                    (p.student ?? true)
                      ? p.studentFareCentavos!
                      : p.regularFareCentavos,
                  )}{" "}
                  {(p.student ?? true) ? "student" : "regular"} fare estimate
                </p>
              )}
              {p.originWalkMinutes !== undefined && (
                <p className="text-xs text-muted-foreground">
                  {p.originWalkMinutes} min to pickup + {p.campusWalkMinutes}{" "}
                  min campus walk. {p.headwayMinutes} min simulated headway.
                  Road-distance estimate; confirm actual conditions.
                </p>
              )}
              {p.leaveAt < now && (
                <p className="text-sm text-warning-foreground">
                  This departure time has passed.
                </p>
              )}
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button onClick={() => startPlannedRoute(p)}>
                {p.routeId ? "Use this route" : "Recalculate plan"}
              </Button>
              <Button variant="outline" onClick={() => edit(p)}>
                Edit plan
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await remove({ id: p._id });
                    if (editing === p._id) setEditing(undefined);
                    toast.success("Plan removed");
                  } catch (e) {
                    toast.error(errorMessage(e));
                  }
                }}
              >
                Remove plan
              </Button>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  );
}
