"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
export function PwaRuntime() {
  const [offline, setOffline] = useState(false),
    [waiting, setWaiting] = useState<ServiceWorker | null>(null),
    [updating, setUpdating] = useState(false);
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          if (registration.waiting) setWaiting(registration.waiting);
          const observe = () => {
            const installing = registration.installing;
            if (!installing) return;
            const check = () => {
              if (
                installing.state === "installed" &&
                navigator.serviceWorker.controller
              )
                setWaiting(installing);
            };
            installing.addEventListener("statechange", check);
            check();
          };
          observe();
          registration.addEventListener("updatefound", observe);
        })
        .catch(() => console.warn("Offline support is unavailable."));
    const sync = () => setOffline(!navigator.onLine);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    sync();
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  return (
    <>
      {offline && (
        <div
          role="status"
          className="fixed inset-x-0 top-0 z-50 bg-warning p-3 text-center text-sm text-warning-foreground"
        >
          Offline · vehicle updates and account changes are unavailable.
        </div>
      )}
      {waiting && !offline && (
        <div
          role="status"
          className="fixed inset-x-3 bottom-24 z-40 mx-auto flex max-w-[450px] flex-col gap-2 rounded-2xl border bg-card p-4"
        >
          <p className="font-semibold">CommuteHub has an update</p>
          <p className="text-sm text-muted-foreground">
            Finish unsaved forms before reloading. Your active trip is saved to
            your account.
          </p>
          <div className="flex gap-2">
            <Button
              disabled={updating}
              onClick={() => {
                setUpdating(true);
                navigator.serviceWorker.addEventListener(
                  "controllerchange",
                  () => window.location.reload(),
                  { once: true },
                );
                waiting.postMessage({ type: "ACTIVATE_UPDATE" });
              }}
            >
              Update and reload
            </Button>
            <Button variant="ghost" onClick={() => setWaiting(null)}>
              Later
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
export function InstallApp() {
  const [event, setEvent] = useState<InstallEvent | null>(null),
    [message, setMessage] = useState("");
  useEffect(() => {
    const listener = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", listener);
    return () => window.removeEventListener("beforeinstallprompt", listener);
  }, []);
  return (
    <div className="grid gap-3">
      <Button
        variant="outline"
        onClick={async () => {
          if (event) {
            await event.prompt();
            const choice = await event.userChoice;
            setMessage(
              choice.outcome === "accepted"
                ? "CommuteHub is being installed."
                : "You can install it later from your browser menu.",
            );
            setEvent(null);
          } else
            setMessage(
              "On iPhone: Safari → Share → Add to Home Screen. On Android or desktop: open your browser menu and choose Install app or Add to Home Screen. If already installed, open it from your Home Screen.",
            );
        }}
      >
        Add CommuteHub to Home Screen
      </Button>
      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}
