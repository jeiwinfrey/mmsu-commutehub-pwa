"use client";
import Image from "next/image";
import { useConvexAuth } from "convex/react";
import { NotificationSetup } from "@/components/commute/notifications";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  MapPin,
  Route,
  Clock3,
  MessagesSquare,
  ArrowLeft,
  Check,
} from "@/components/commute/icons";
import { useDemo } from "@/components/commute/demo-provider";
import {
  Intro,
  Notice,
  PreviewTools,
  SelectField,
} from "@/components/commute/ui";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { modeOptions } from "./components/options";

export function OnboardingScreen() {
  const { isAuthenticated } = useConvexAuth();
  const { preferences, setPreferences } = useDemo();
  const [draft, setDraft] = useState(preferences);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState("normal");
  const [manual, setManual] = useState(false);
  const title = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const move = (next: number) => {
    setStep(next);
    setError("");
    requestAnimationFrame(() => {
      title.current?.focus();
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  };
  const complete = () => {
    setPreferences({ ...draft, name: draft.name.trim() || "Commuter" });
    router.push("/commute");
  };
  const next = () => {
    if (step === 1 && !draft.name.trim()) {
      setError("Enter a display name, or use Skip for now.");
      return;
    }
    if (step === 1) setPreferences({ ...draft, name: draft.name.trim() });
    move(step + 1);
  };
  return (
    <div className="feature-stack">
      <div ref={title} tabIndex={-1}>
        <Intro
          title={
            step === 0
              ? "A little less waiting.\nA better way to class."
              : step === 1
                ? "Make it your commute"
                : step === 2
                  ? "Find a pickup\nthat works for you"
                  : "We’ll give you\na heads-up"
          }
          description={
            step === 0
              ? "Plan your commute around the moments that matter."
              : step === 1
                ? "A few preferences to get you started. You can revisit this setup anytime."
                : step === 2
                  ? "Location sharing is optional. Choose your pickup from a list or a map."
                  : "Know when your selected vehicle enters your pickup area."
          }
          step={step === 0 ? "WELCOME" : `STEP ${step} OF 3`}
        />
      </div>
      {step > 0 && (
        <Progress
          aria-label={`Onboarding step ${step} of 3`}
          value={(step / 3) * 100}
        />
      )}
      {step === 0 && (
        <>
          <ul className="flex flex-col gap-6">
            {[
              [Route, "Find a ride along your corridor"],
              [Clock3, "Know when to leave for class"],
              [MessagesSquare, "Share what’s happening"],
            ].map(([Icon, label]) => {
              const I = Icon as typeof Route;
              return (
                <li key={String(label)} className="flex items-center gap-3">
                  <I
                    aria-hidden="true"
                    className="size-6 shrink-0 text-primary"
                  />
                  <span>{String(label)}</span>
                </li>
              );
            })}
          </ul>
          <Notice title="A little less uncertainty">
            Vehicle operations and fares are illustrative. Sign in to save your
            preferences, plans, and trips.
          </Notice>
          <Button onClick={() => move(1)}>
            Get started
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Button>
          <Button asChild variant="outline">
            <Link href="/commute">Explore routes first</Link>
          </Button>
        </>
      )}
      {step === 1 && (
        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            next();
          }}
          noValidate
        >
          <FieldGroup>
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor="display-name">Display name</FieldLabel>
              <Input
                id="display-name"
                className="min-h-12"
                autoComplete="nickname"
                maxLength={50}
                value={draft.name}
                onChange={(e) => {
                  setDraft({ ...draft, name: e.target.value });
                  setError("");
                }}
                placeholder="What should we call you?"
                aria-invalid={!!error}
                aria-describedby={error ? "name-error" : "name-hint"}
              />
              <FieldDescription id="name-hint">
                A nickname is fine. Signed-in preferences are saved to your
                account.
              </FieldDescription>
              {error && (
                <FieldError id="name-error" role="alert">
                  {error}
                </FieldError>
              )}
            </Field>
            <SelectField
              id="campus"
              label="Destination campus"
              value="batac"
              onChange={() => {}}
              options={[{ value: "batac", label: "MMSU Batac Main Campus" }]}
              description="Other campuses need verified route connections before they can be offered."
            />
            <SelectField
              id="preferred-mode"
              label="Preferred transportation"
              value={draft.mode}
              onChange={(v) =>
                setDraft({ ...draft, mode: v as typeof draft.mode })
              }
              options={modeOptions}
            />
            <Field orientation="horizontal">
              <div className="flex-1">
                <FieldLabel htmlFor="student-fare">
                  Student fare estimate
                </FieldLabel>
                <FieldDescription>Show a 20% sample discount.</FieldDescription>
              </div>
              <Switch
                id="student-fare"
                className="min-h-11 min-w-11"
                checked={draft.student}
                onCheckedChange={(student) => setDraft({ ...draft, student })}
              />
            </Field>
          </FieldGroup>
          <Notice title="Student discount">
            Bring valid student identification. A Google sign-in or this
            preference does not verify enrollment.
          </Notice>
          <Button type="submit">
            Continue
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Button>
        </form>
      )}
      {step === 2 && (
        <>
          <div className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-xl bg-accent p-6">
            <MapPin aria-hidden="true" className="size-10 text-primary" />
            <p className="text-center font-semibold">
              Your pickup, your choice.
            </p>
          </div>
          <Notice title="Manual pickup always works">
            Choose a stop manually, or use Find me at pickup to locate your
            nearest candidate stop. Your precise location stays in your browser.
          </Notice>
          <Button
            variant={manual ? "default" : "outline"}
            onClick={() => setManual(true)}
          >
            {manual ? (
              <Check data-icon="inline-start" aria-hidden="true" />
            ) : (
              <MapPin data-icon="inline-start" aria-hidden="true" />
            )}
            {manual ? "Manual pickup selected" : "Choose pickup manually"}
          </Button>
          {manual && (
            <p role="status" className="text-sm text-primary">
              You’ll select a candidate boarding stop after choosing a vehicle.
            </p>
          )}
          <Button onClick={next}>
            Continue
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Button>
        </>
      )}
      {step === 3 && (
        <>
          <Image
            src="/illustrations/nearby.svg"
            alt="A phone receiving a nearby vehicle notification"
            width={600}
            height={400}
            priority
            className="w-full rounded-3xl"
          />
          <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
            <Bell aria-hidden="true" className="size-6 shrink-0 text-primary" />
            <div>
              <p className="font-semibold">Your modern jeepney is nearby</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Sample vehicle 01 is entering your 500 m pickup area.
              </p>
              <p className="mt-2 text-xs text-primary">
                Notification preview · not sent
              </p>
            </div>
          </div>
          <Field orientation="horizontal">
            <div className="flex-1">
              <FieldLabel htmlFor="nearby-alerts">
                Nearby vehicle alerts
              </FieldLabel>
              <FieldDescription>
                Receive an alert when the simulated vehicle enters your pickup
                radius.
              </FieldDescription>
            </div>
            <Switch
              id="nearby-alerts"
              className="min-h-11 min-w-11"
              checked={draft.nearbyAlerts}
              onCheckedChange={(nearbyAlerts) =>
                setDraft({ ...draft, nearbyAlerts })
              }
            />
          </Field>
          <Notice title="You choose how we reach you">
            Alerts appear in the app. You can also enable device notifications
            below. On iPhone, first add the app to your Home Screen.
          </Notice>
          {isAuthenticated && <NotificationSetup />}
          <Button onClick={complete}>
            Find my commute
            <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Button>
        </>
      )}
      {step > 0 && (
        <div className="flex gap-3">
          <Button
            className="flex-1"
            variant="outline"
            onClick={() => move(step - 1)}
          >
            <ArrowLeft data-icon="inline-start" aria-hidden="true" />
            Back
          </Button>
          <Button className="flex-1" variant="ghost" onClick={complete}>
            Skip for now
          </Button>
        </div>
      )}
      <PreviewTools
        value={preview}
        onChange={setPreview}
        options={[
          { value: "normal", label: "Normal" },
          { value: "loading", label: "Loading preferences" },
          { value: "error", label: "Preference error" },
        ]}
      />
      {preview === "loading" && (
        <div role="status" aria-label="Loading preference preview">
          <Skeleton className="h-12 w-full" />
          <p className="mt-2 text-sm">Loading preferences · preview</p>
        </div>
      )}
      {preview === "error" && (
        <Notice title="Preference error preview" warning>
          No preferences were lost.{" "}
          <Button variant="outline" onClick={() => setPreview("normal")}>
            Dismiss and retry
          </Button>
        </Notice>
      )}
    </div>
  );
}
