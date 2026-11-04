"use client";
import { useNow } from "@/lib/use-now";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
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
  const plans = useQuery(api.planner.list),
    save = useMutation(api.planner.save),
    remove = useMutation(api.planner.remove);
  const [from, setFrom] = useState("laoag"),
    [to, setTo] = useState("mmsu"),
    [mode, setMode] = useState("any"),
    [classTime, setTime] = useState(""),
    [buffer, setBuffer] = useState("15"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const classAt = Date.parse(classTime + ":00+08:00");
      await save({ from, to, mode, classAt, bufferMinutes: Number(buffer) });
      toast.success("Departure plan saved");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="feature-stack">
      <Intro
        title="Make time\nfor your morning."
        description="Work back from your class time. Your plan is saved to your account."
      />
      <form onSubmit={submit} className="feature-stack">
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
          {busy ? "Planning…" : "Suggest and save departure"}
        </Button>
      </form>
      <Notice title="Allow some breathing room">
        Wait and ride times use simulated service and approximate route
        distances. Weather, traffic, and actual boarding availability may change
        your journey.
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
              <p>
                Expected arrival <strong>{localDate(p.arriveAt)}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                Class {localDate(p.classAt)} · {p.bufferMinutes} min buffer
              </p>
              <Metrics
                items={[
                  { label: "Walking", value: `${p.walkMinutes} min` },
                  { label: "Waiting", value: `${p.waitMinutes} min` },
                  { label: "Ride estimate", value: `${p.rideMinutes} min` },
                ]}
              />
              {p.leaveAt < now && (
                <p className="text-sm text-warning-foreground">
                  This departure time has passed.
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await remove({ id: p._id });
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
