"use client";
import Link from "next/link";
import { useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useOnlineMutation as useMutation } from "@/lib/use-online-mutation";
import { api, errorMessage } from "@/lib/backend";
import { AccountRequired } from "@/components/commute/account-required";
import { InstallApp } from "@/components/commute/pwa";
import { NotificationSetup } from "@/components/commute/notifications";
import { Intro, SelectField, Notice } from "@/components/commute/ui";
import { commuteRoutes, routeLabel, modeLabel } from "@/lib/commute-catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
export function ProfileScreen() {
  return (
    <AccountRequired>
      <Profile />
    </AccountRequired>
  );
}
function Profile() {
  const profile = useQuery(api.accounts.me),
    saved = useQuery(api.accounts.saved),
    save = useMutation(api.accounts.save),
    toggle = useMutation(api.accounts.toggleRoute);
  const { user } = useUser(),
    { signOut, openUserProfile } = useClerk();
  const unsubscribe = useMutation(api.notifications.unsubscribe);
  const leave = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        if (subscription) {
          try {
            await unsubscribe({ endpoint: subscription.endpoint });
          } finally {
            await subscription.unsubscribe();
          }
        }
      }
    } catch {
      toast.info("Device notification access was disabled where supported.");
    }
    await signOut({ redirectUrl: "/sign-in" });
  };
  const [busy, setBusy] = useState(false),
    [deleteText, setDeleteText] = useState(""),
    [deleting, setDeleting] = useState(false);
  if (profile === undefined || !saved) return <Skeleton className="h-64" />;
  return (
    <div className="feature-stack">
      <Intro
        title="Your commute,\nyour way."
        description={
          user?.primaryEmailAddress?.emailAddress ?? "Your account settings"
        }
      />
      <ProfileForm
        key={profile?._id ?? "new"}
        initial={
          profile ?? {
            name: user?.firstName ?? "Commuter",
            campus: "MMSU Batac Main Campus",
            mode: "any",
            student: true,
            nearbyAlerts: true,
            communityAlerts: true,
            onboarded: true,
          }
        }
        save={async (data) => {
          setBusy(true);
          try {
            await save(data);
            toast.success("Preferences saved");
          } catch (e) {
            toast.error(errorMessage(e));
          } finally {
            setBusy(false);
          }
        }}
        busy={busy}
      />
      <Card>
        <CardHeader>
          <CardTitle>Saved routes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            Follow community reports for these corridors.
          </p>
          {commuteRoutes.map((r) => {
            const isSaved = saved.some((s) => s.routeId === r.id);
            return (
              <Button
                className="h-auto justify-between p-3 text-left"
                key={r.id}
                variant={isSaved ? "secondary" : "outline"}
                aria-pressed={isSaved}
                aria-label={`${routeLabel(r)}, ${modeLabel(r.mode)}. ${isSaved ? "Saved" : "Save route"}`}
                onClick={async () => {
                  try {
                    await toggle({ routeId: r.id });
                  } catch (e) {
                    toast.error(errorMessage(e));
                  }
                }}
              >
                <span className="min-w-0">
                  {routeLabel(r)}
                  <span className="block text-xs font-normal">
                    {modeLabel(r.mode)}
                  </span>
                </span>
                <span>{isSaved ? "Saved" : "Save"}</span>
              </Button>
            );
          })}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Device notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationSetup />
        </CardContent>
      </Card>
      <InstallApp />
      <Button asChild variant="outline">
        <Link href="/onboarding">Review onboarding and permissions</Link>
      </Button>
      <Notice title="Your location stays yours">
        Manual pickup selection is always available. If you use Find me, your
        coordinates stay in the browser and are not stored in your profile.
      </Notice>
      <Button
        variant="outline"
        onClick={() =>
          openUserProfile({
            appearance: { elements: { profileSection__danger: "hidden" } },
          })
        }
      >
        Manage account and security
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost">Sign out</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of CommuteHub?</AlertDialogTitle>
            <AlertDialogDescription>
              Your saved plans and trip history remain in your account. Device
              notifications on this browser will be disabled when you sign out.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay signed in</AlertDialogCancel>
            <AlertDialogAction onClick={leave}>Sign out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" className="text-destructive">
            Delete my account
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Permanently delete your account?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your profile, saved routes, trips, plans, reports, and device
              notification registrations will be removed. This cannot be undone.
              Type DELETE to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Label htmlFor="delete-confirmation">Type DELETE</Label>
          <Input
            id="delete-confirmation"
            value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)}
            autoComplete="off"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              Keep account
            </AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleteText !== "DELETE" || deleting}
              onClick={async () => {
                setDeleting(true);
                try {
                  const response = await fetch("/api/account", {
                    method: "DELETE",
                  });
                  if (!response.ok)
                    throw new Error((await response.json()).error);
                  await signOut({ redirectUrl: "/sign-in" });
                } catch (e) {
                  toast.error(
                    e instanceof Error
                      ? e.message
                      : "Deletion failed. Try again.",
                  );
                  setDeleting(false);
                }
              }}
            >
              {deleting ? "Deleting…" : "Delete permanently"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <p className="text-xs text-muted-foreground">
        {" "}
        Vehicle operations, tariffs, and terminal candidates are illustrative,
        not verified operator data.
      </p>
    </div>
  );
}
type ProfileData = {
  name: string;
  campus: string;
  mode: string;
  student: boolean;
  nearbyAlerts: boolean;
  departureAlerts?: boolean;
  defaultRadius?: number;
  communityAlerts: boolean;
  onboarded: boolean;
};
function ProfileForm({
  initial,
  save,
  busy,
}: {
  initial: ProfileData;
  save: (p: ProfileData) => Promise<void>;
  busy: boolean;
}) {
  const [p, setP] = useState<ProfileData>({
    name: initial.name,
    campus: initial.campus,
    mode: initial.mode,
    student: initial.student,
    nearbyAlerts: initial.nearbyAlerts,
    departureAlerts: initial.departureAlerts ?? true,
    defaultRadius: initial.defaultRadius ?? 500,
    communityAlerts: initial.communityAlerts,
    onboarded: initial.onboarded,
  });
  return (
    <form
      className="feature-stack"
      onSubmit={(e) => {
        e.preventDefault();
        void save({ ...p, name: p.name.trim() });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="profile-name">Display name</Label>
        <Input
          id="profile-name"
          required
          minLength={1}
          maxLength={50}
          value={p.name}
          onChange={(e) => setP({ ...p, name: e.target.value })}
        />
      </div>
      <SelectField
        id="profile-campus"
        label="Destination campus"
        value={p.campus}
        onChange={(campus) => setP({ ...p, campus })}
        options={[
          { value: "MMSU Batac Main Campus", label: "MMSU Batac Main Campus" },
        ]}
        description="Additional campuses need verified transport connections."
      />
      <SelectField
        id="profile-radius"
        label="Default pickup alert radius"
        value={String(p.defaultRadius ?? 500)}
        onChange={(radius) => setP({ ...p, defaultRadius: Number(radius) })}
        options={[100, 250, 500, 1000].map((radius) => ({
          value: String(radius),
          label: radius === 1000 ? "1 km" : `${radius} m`,
        }))}
      />
      <SelectField
        id="profile-mode"
        label="Preferred transportation"
        value={p.mode}
        onChange={(mode) => setP({ ...p, mode })}
        options={[
          { value: "any", label: "Any mode" },
          { value: "traditional-jeepney", label: "Traditional jeepney" },
          { value: "modern-jeepney", label: "Modern jeepney" },
          { value: "bus", label: "Bus" },
        ]}
      />
      {(
        [
          { key: "student", label: "Student fare estimate" },
          { key: "nearbyAlerts", label: "Vehicle proximity alerts" },
          { key: "departureAlerts", label: "Departure reminder alerts" },
          {
            key: "communityAlerts",
            label: "Community alerts for saved routes",
          },
        ] as const
      ).map((x) => (
        <div key={x.key} className="flex items-center justify-between gap-4">
          <Label htmlFor={x.key}>{x.label}</Label>
          <Switch
            className="min-h-11 min-w-11"
            id={x.key}
            checked={p[x.key]}
            onCheckedChange={(v) => setP({ ...p, [x.key]: v })}
          />
        </div>
      ))}
      <Button disabled={busy}>{busy ? "Saving…" : "Save preferences"}</Button>
    </form>
  );
}
