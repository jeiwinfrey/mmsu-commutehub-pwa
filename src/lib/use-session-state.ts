"use client";
import {
  useMemo,
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
} from "react";
const subscribe = (callback: () => void) => {
  window.addEventListener("commutehub-draft", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("commutehub-draft", callback);
    window.removeEventListener("storage", callback);
  };
};
export function useSessionState<T>(
  key: string,
  initial: T,
): [T, Dispatch<SetStateAction<T>>] {
  const fallback = JSON.stringify(initial);
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return sessionStorage.getItem(key) ?? fallback;
      } catch {
        return fallback;
      }
    },
    () => fallback,
  );
  const value = useMemo(() => {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
  }, [raw, initial]);
  return [
    value,
    (next) => {
      try {
        const current = JSON.parse(
          sessionStorage.getItem(key) ?? fallback,
        ) as T;
        const resolved =
          typeof next === "function"
            ? (next as (value: T) => T)(current)
            : next;
        sessionStorage.setItem(key, JSON.stringify(resolved));
        window.dispatchEvent(new Event("commutehub-draft"));
      } catch {
        throw new Error(
          "Session storage is unavailable. Enable browser storage to keep your selection.",
        );
      }
    },
  ];
}
