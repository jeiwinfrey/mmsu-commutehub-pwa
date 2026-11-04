"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api, errorMessage } from "@/lib/backend";
import { Button } from "@/components/ui/button";
export function NotificationSetup() {
  const subscribe = useMutation(api.notifications.subscribe),
    unsubscribe = useMutation(api.notifications.unsubscribe);
  const [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  const enable = async () => {
    setBusy(true);
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus(
          "Push is not supported here. On iPhone, add CommuteHub to your Home Screen and open it there. In-app alerts still work.",
        );
        return;
      }
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) {
        setStatus(
          "Device notifications are not configured on this deployment. In-app alerts still work.",
        );
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(
          "Notifications were not enabled. You can change this in your browser settings; in-app alerts remain available.",
        );
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const raw = atob(key.replace(/-/g, "+").replace(/_/g, "/"));
        const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: bytes,
        });
      }
      const data = subscription.toJSON();
      if (!data.endpoint || !data.keys) throw new Error("Invalid subscription");
      await subscribe({
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
      });
      setStatus(
        "Device notifications enabled for this account on this device.",
      );
    } catch (e) {
      setStatus(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const disable = async () => {
    setBusy(true);
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration(),
          s = await registration?.pushManager.getSubscription();
        if (s) {
          await unsubscribe({ endpoint: s.endpoint });
          await s.unsubscribe();
        }
      }
      setStatus("Device notifications disabled on this device.");
    } catch (e) {
      setStatus(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid gap-3">
      <Button variant="outline" disabled={busy} onClick={enable}>
        {busy ? "Updating…" : "Enable device notifications"}
      </Button>
      <Button variant="ghost" disabled={busy} onClick={disable}>
        Disable on this device
      </Button>
      {status && (
        <p role="status" className="text-sm text-muted-foreground">
          {status}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        This enables free browser push messages, not a paid subscription. Only
        enable it on a device you use personally.
      </p>
    </div>
  );
}
