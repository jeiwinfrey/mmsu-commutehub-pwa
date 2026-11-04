"use client";
import { useRouter } from "next/navigation";
import { useDemo } from "@/components/commute/demo-provider";
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
import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
  const update = useMutation(api.trips.update),
    remove = useMutation(api.trips.remove);
  const demo = useDemo(),
    router = useRouter();
  const [details, setDetails] = useState<Doc<"trips"> | null>(null),
    [busy, setBusy] = useState(false);
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
                  <CardDescription>{localDate(t.createdAt)}</CardDescription>
                </CardHeader>
                <CardFooter className="flex flex-wrap gap-2">
                  <Button disabled={!!active} onClick={() => again(t)}>
                    Ride again
                  </Button>
                  <Button variant="outline" onClick={() => setDetails(t)}>
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
      <Sheet
        open={!!details}
        onOpenChange={(o) => {
          if (!o) setDetails(null);
        }}
      >
        <SheetContent side="bottom" className="mx-auto max-w-[480px]">
          <SheetHeader>
            <SheetTitle>Trip details</SheetTitle>
            <SheetDescription>
              Recorded by you; vehicle operations and fare estimates are
              simulated.
            </SheetDescription>
          </SheetHeader>
          {details && (
            <dl className="grid gap-3 p-6 text-sm">
              <div>
                <dt className="text-muted-foreground">Route</dt>
                <dd>
                  {commuteRoutes.find((r) => r.id === details.routeId)?.name}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Pickup → destination</dt>
                <dd>
                  {place(details.pickupId)?.shortName} →{" "}
                  {place(details.to)?.shortName}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Fare estimate</dt>
                <dd>
                  {money(details.fareCentavos)} ·{" "}
                  {details.student ? "student" : "regular"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Started</dt>
                <dd>{localDate(details.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Finished</dt>
                <dd>{details.endedAt ? localDate(details.endedAt) : "—"}</dd>
              </div>
              {details.boardedAt && details.endedAt && (
                <div>
                  <dt className="text-muted-foreground">
                    Your recorded ride duration
                  </dt>
                  <dd>
                    {Math.max(
                      1,
                      Math.round((details.endedAt - details.boardedAt) / 60000),
                    )}{" "}
                    min · user-confirmed, not measured GPS
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd>{details.status}</dd>
              </div>
            </dl>
          )}
          {details && (
            <div className="grid gap-3 px-6 pb-8">
              <Button disabled={!!active} onClick={() => again(details)}>
                Ride again
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="text-destructive">
                    Delete trip from history
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this trip?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes this completed or cancelled journey from your
                      account history. It cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep trip</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        try {
                          await remove({ id: details._id });
                          setDetails(null);
                          toast.success("Trip removed from history");
                        } catch (e) {
                          toast.error(errorMessage(e));
                        }
                      }}
                    >
                      Delete trip
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
