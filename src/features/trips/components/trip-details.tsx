"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useOnlineMutation as useMutation } from "@/lib/use-online-mutation";
import { api, errorMessage, localDate } from "@/lib/backend";
import { AccountRequired } from "@/components/commute/account-required";
import { useDemo } from "@/components/commute/demo-provider";
import { Intro, Notice } from "@/components/commute/ui";
import { place, money, commuteRoutes, modeLabel } from "@/lib/commute-catalog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
export function TripDetailsScreen({ id }: { id: string }) {
  return (
    <AccountRequired>
      <Details id={id} />
    </AccountRequired>
  );
}
function Details({ id }: { id: string }) {
  const trip = useQuery(api.trips.byId, { id }),
    active = useQuery(api.trips.active),
    remove = useMutation(api.trips.remove),
    demo = useDemo(),
    router = useRouter();
  if (trip === undefined) return <Skeleton className="h-64" />;
  if (!trip)
    return (
      <div className="feature-stack">
        <Intro
          title="Trip not available"
          description="This trip does not exist, was deleted, or belongs to another account."
          back="/trips"
        />
      </div>
    );
  const route = commuteRoutes.find((r) => r.id === trip.routeId),
    isActive = trip.status === "waiting" || trip.status === "riding";
  return (
    <div className="feature-stack">
      <Intro
        title={`${place(trip.pickupId)?.shortName} → ${place(trip.to)?.shortName}`}
        description={`${trip.status} · simulated vehicle journey`}
        back="/trips"
      />
      {trip.endReason && (
        <Notice
          title={trip.status === "missed" ? "Pickup missed" : "Trip closed"}
        >
          {trip.endReason}
        </Notice>
      )}
      <dl className="grid gap-4">
        <div>
          <dt className="text-sm text-muted-foreground">Service</dt>
          <dd>
            {route ? modeLabel(route.mode) : "Unknown mode"} ·{" "}
            {route?.direction}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Started</dt>
          <dd>{localDate(trip.createdAt)}</dd>
        </div>
        {trip.boardedAt && (
          <div>
            <dt className="text-sm text-muted-foreground">Boarding recorded</dt>
            <dd>{localDate(trip.boardedAt)}</dd>
          </div>
        )}
        <div>
          <dt className="text-sm text-muted-foreground">Ended</dt>
          <dd>{trip.endedAt ? localDate(trip.endedAt) : "Still active"}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Fare snapshot</dt>
          <dd>
            {money(trip.fareCentavos)} · {trip.student ? "student" : "regular"}{" "}
            illustrative tariff
          </dd>
        </div>
        {trip.destinationArrivesAt && (
          <div>
            <dt className="text-sm text-muted-foreground">
              Simulated destination arrival
            </dt>
            <dd>
              {localDate(trip.destinationArrivesAt)} · not your confirmed
              arrival
            </dd>
          </div>
        )}
        {trip.boardedAt && trip.endedAt && (
          <div>
            <dt className="text-sm text-muted-foreground">
              User-recorded ride duration
            </dt>
            <dd>
              {Math.max(1, Math.round((trip.endedAt - trip.boardedAt) / 60000))}{" "}
              minutes · not GPS measured
            </dd>
          </div>
        )}
      </dl>
      {isActive ? (
        <Button asChild>
          <Link href="/commute/tracking">Resume active trip</Link>
        </Button>
      ) : (
        <>
          <Button
            disabled={!!active}
            onClick={() => {
              demo.setSearch({ from: trip.pickupId, to: trip.to });
              demo.chooseRoute(trip.routeId);
              router.push("/commute/vehicles");
            }}
          >
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
                  This permanently removes the historical trip from your
                  account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep trip</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    try {
                      await remove({ id: trip._id });
                      router.replace("/trips");
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
        </>
      )}
      <Button asChild variant="outline">
        <Link href="/trips">All trips</Link>
      </Button>
    </div>
  );
}
