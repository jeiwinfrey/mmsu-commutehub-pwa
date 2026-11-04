"use client";
import { useSessionState } from "@/lib/use-session-state";
import { useConvexAuth, useQuery } from "convex/react";
import { useOnlineMutation as useMutation } from "@/lib/use-online-mutation";
import { api, errorMessage } from "@/lib/backend";
import { toast } from "sonner";
import { createContext, useContext, useState } from "react";
import type { TransportMode, PickupSelection } from "@/types/commute";
export type Preferences = {
  name: string;
  campus: string;
  mode: TransportMode | "any";
  student: boolean;
  nearbyAlerts: boolean;
  defaultRadius?: number;
  departureAlerts?: boolean;
};
type Search = { from: string; to: string; mode?: TransportMode };
export type Watch = {
  vehicleId: string;
  routeId: string;
  pickup: PickupSelection;
  version: number;
};
type DemoContextValue = {
  preferences: Preferences;
  setPreferences: (value: Preferences) => void;
  search: Search;
  setSearch: (value: Search) => void;
  routeId: string | null;
  vehicleId: string | null;
  chooseRoute: (id: string) => void;
  chooseVehicle: (id: string, runId?: string) => void;
  runId: string | null;
  pickup: PickupSelection | null;
  setPickup: (value: PickupSelection) => void;
  watch: Watch | null;
  startWatch: () => void;
  cancelWatch: () => void;
};
const DemoContext = createContext<DemoContextValue | null>(null);
export function DemoProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.accounts.me, isAuthenticated ? {} : "skip");
  const save = useMutation(api.accounts.save);
  const [localPreferences, setLocalPreferences] = useState<Preferences>({
    name: "",
    campus: "MMSU Batac Main Campus",
    mode: "any",
    student: true,
    nearbyAlerts: true,
  });
  const preferences: Preferences = profile
    ? {
        name: profile.name,
        campus: profile.campus,
        mode: profile.mode as Preferences["mode"],
        student: profile.student,
        nearbyAlerts: profile.nearbyAlerts,
        defaultRadius: profile.defaultRadius ?? 500,
        departureAlerts: profile.departureAlerts ?? true,
      }
    : localPreferences;
  const setPreferences = (value: Preferences) => {
    setLocalPreferences(value);
    if (isAuthenticated)
      void save({
        ...value,
        communityAlerts: profile?.communityAlerts ?? true,
        defaultRadius: value.defaultRadius ?? profile?.defaultRadius ?? 500,
        departureAlerts:
          value.departureAlerts ?? profile?.departureAlerts ?? true,
        onboarded: true,
      }).catch((e) => toast.error(errorMessage(e)));
  };
  const [draft, setDraft] = useSessionState<{
    search: Search;
    routeId: string | null;
    vehicleId: string | null;
    runId: string | null;
    pickup: PickupSelection | null;
  }>("commutehub-selection", {
    search: { from: "laoag", to: "mmsu" },
    routeId: null,
    vehicleId: null,
    runId: null,
    pickup: null,
  });
  const { search, routeId, vehicleId, pickup, runId } = draft;
  const [watch, setWatch] = useState<Watch | null>(null);
  const setSearch = (search: Search) =>
    setDraft({
      search,
      routeId: null,
      vehicleId: null,
      runId: null,
      pickup: null,
    });
  const chooseRoute = (routeId: string) =>
    setDraft((current) => ({
      ...current,
      routeId,
      vehicleId: null,
      runId: null,
      pickup: null,
    }));
  const chooseVehicle = (vehicleId: string, runId?: string) =>
    setDraft((current) => ({ ...current, vehicleId, runId: runId ?? null }));
  const setPickup = (pickup: PickupSelection) =>
    setDraft((current) => ({ ...current, pickup }));
  const startWatch = () => {
    if (routeId && vehicleId && pickup)
      setWatch({ routeId, vehicleId, pickup, version: 1 });
  };
  return (
    <DemoContext.Provider
      value={{
        preferences,
        setPreferences,
        search,
        setSearch,
        routeId,
        vehicleId,
        runId: runId ?? null,
        chooseRoute,
        chooseVehicle,
        pickup,
        setPickup,
        watch,
        startWatch,
        cancelWatch: () => setWatch(null),
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}
export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("DemoProvider is required");
  return ctx;
}
