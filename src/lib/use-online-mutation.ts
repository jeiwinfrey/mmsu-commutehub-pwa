"use client";
import { useCallback } from "react";
import { useConvex, useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import type { FunctionReference } from "convex/server";
/** Do not enqueue a new critical action while the device/backend is disconnected. */
export function useOnlineMutation<
  Mutation extends FunctionReference<"mutation">,
>(reference: Mutation) {
  const convex = useConvex(),
    mutation = useMutation(reference);
  return useCallback(
    (...args: Parameters<typeof mutation>) => {
      if (
        (typeof navigator !== "undefined" && !navigator.onLine) ||
        !convex.connectionState().isWebSocketConnected
      )
        return Promise.reject(
          new ConvexError(
            "You’re offline or reconnecting. Your draft is still here; reconnect and submit it yourself.",
          ),
        );
      return mutation(...args);
    },
    [convex, mutation],
  );
}
