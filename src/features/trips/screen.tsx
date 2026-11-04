"use client";
import { useRouter } from "next/navigation";
import { useDemo } from "@/components/commute/demo-provider";
import Link from "next/link";
import { useState } from "react";
import { useQuery, usePaginatedQuery } from "convex/react";
import { useOnlineMutation as useMutation } from "@/lib/use-online-mutation";
import { api, errorMessage, localDate, type Doc } from "@/lib/backend";
import { AccountRequired } from "@/components/commute/account-required";
import { Intro } from "@/components/commute/ui";
import { commuteRoutes, place, money } from "@/lib/commute-catalog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
export function TripsScreen() {
  return (
    <AccountRequired>
      <Trips />
    </AccountRequired>
  );
}
function Trips() {
  const active = useQuery(api.trips.active);
  const {
    results: history,
    status,
    loadMore,
  } = usePaginatedQuery(api.trips.history, {}, { initialNumItems: 10 });
  const update = useMutation(api.trips.update);
  const demo = useDemo(),
    router = useRouter();
  const [busy, setBusy] = useState(false);
  const again = (trip: Doc<"trips">) => {
    demo.setSearch({ from: trip.pickupId, to: trip.to });
    demo.chooseRoute(trip.routeId);
    router.push("/commute/vehicles");
  };
  const change = async (
    t: Doc<"trips">,
    status: "riding" | "completed" | "cancelled",
  ) => {
    setBusy(true);
    try {
      await update({ id: t._id, status });
      toast.success(
        status === "riding"
          ? "Boarding recorded"
          : status === "completed"
            ? "Trip completed"
            : "Trip cancelled",
      );
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="feature-stack">
      <Intro
        title="Every ride,\nin one place."
        description="Your active journey and recent trip history."
      />
      {active === undefined || status === "LoadingFirstPage" ? (
        <Skeleton className="h-48" />
      ) : (
        <>
          {active && (
            <Card>
              <CardHeader>
                <Badge className="w-fit">
                  {active.status === "riding"
                    ? "On the way"
                    : "Waiting for pickup"}
                </Badge>
                <CardTitle>
                  {place(active.pickupId)?.shortName} →{" "}
                  {place(active.to)?.shortName}
                </CardTitle>
                <CardDescription>
                  Simulated vehicle ·{" "}
                  {commuteRoutes.find((r) => r.id === active.routeId)?.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  {money(active.fareCentavos)}{" "}
                  {active.student ? "student" : "regular"} estimate
                </p>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button
                  disabled={busy}
                  onClick={() =>
                    change(
                      active,
                      active.status === "waiting" ? "riding" : "completed",
                    )
                  }
                >
                  {active.status === "waiting"
                    ? "I have boarded"
                    : "Complete trip"}
                </Button>
                {active.status === "waiting" && (
                  <Button asChild variant="outline">
                    <Link href="/commute/tracking">Track vehicle</Link>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => change(active, "cancelled")}
                >
                  Cancel trip
                </Button>
              </CardFooter>
            </Card>
          )}
          <h2 className="text-lg font-semibold">Recent trips</h2>
          {!history.length ? (
            <div className="empty-panel">
              Completed and cancelled journeys will appear here.
            </div>
          ) : (
            history.map((t) => (
              <Card key={t._id}>
                <CardHeader>
                  <Badge variant="secondary" className="w-fit">
                    {t.status}
                  </Badge>
                  <CardTitle>
                    {place(t.pickupId)?.shortName} → {place(t.to)?.shortName}
                  </CardTitle>
                  <CardDescription>
                    {localDate(t.createdAt)}
                    {t.endReason && (
                      <span className="mt-2 block">{t.endReason}</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="flex flex-wrap gap-2">
                  <Button disabled={!!active} onClick={() => again(t)}>
                    Ride again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/trips/${t._id}`)}
                  >
                    Trip details
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
          {status === "CanLoadMore" && (
            <Button variant="outline" onClick={() => loadMore(10)}>
              Load older trips
            </Button>
          )}
          {status === "LoadingMore" && (
            <p role="status">Loading older trips…</p>
          )}
        </>
      )}
      <Button asChild variant="outline">
        <Link href="/commute">Find another ride</Link>
      </Button>
    </div>
  );
}
