"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api, errorMessage, localDate } from "@/lib/backend";
import { AccountRequired } from "@/components/commute/account-required";
import { Intro, SelectField } from "@/components/commute/ui";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
export function AlertsScreen() {
  return (
    <AccountRequired>
      <Alerts />
    </AccountRequired>
  );
}
function Alerts() {
  const alerts = useQuery(api.notifications.list),
    read = useMutation(api.notifications.read);
  const [filter, setFilter] = useState("all");
  return (
    <div className="feature-stack">
      <Intro
        title="Your heads-up."
        description="Vehicle proximity, departure reminders, and community reports for your saved routes."
      />
      <div className="flex justify-between gap-2">
        <Badge variant="secondary">
          {alerts?.filter((a) => !a.read).length ?? 0} unread
        </Badge>
        <Button
          variant="ghost"
          disabled={!alerts?.some((a) => !a.read)}
          onClick={async () => {
            try {
              await read({});
            } catch (e) {
              toast.error(errorMessage(e));
            }
          }}
        >
          Mark all read
        </Button>
      </div>
      <SelectField
        id="alert-filter"
        label="Show alerts"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "All alerts" },
          { value: "unread", label: "Unread" },
          { value: "community", label: "Community" },
          { value: "proximity", label: "Vehicle nearby" },
          { value: "planner", label: "Departure planner" },
        ]}
      />
      {!alerts ? (
        <Skeleton className="h-48" />
      ) : !alerts.filter(
          (a) =>
            filter === "all" ||
            (filter === "unread" && !a.read) ||
            a.kind === filter,
        ).length ? (
        <div className="empty-panel">
          <h2 className="font-semibold">You’re all caught up</h2>
          <p className="text-muted-foreground text-sm">
            Save a route in Profile to follow its community reports.
          </p>
        </div>
      ) : (
        alerts
          .filter(
            (a) =>
              filter === "all" ||
              (filter === "unread" && !a.read) ||
              a.kind === filter,
          )
          .map((a) => (
            <Card key={a._id}>
              <CardHeader>
                <div className="flex gap-2">
                  <Badge variant="secondary">{a.kind}</Badge>
                  {!a.read && <Badge>Unread</Badge>}
                </div>
                <CardTitle>{a.title}</CardTitle>
                <CardDescription>{localDate(a.createdAt)}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>{a.body}</p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline">
                  <Link
                    href={a.href}
                    onClick={() => {
                      void read({ id: a._id }).catch(() =>
                        toast.error("Could not mark this alert read."),
                      );
                    }}
                  >
                    View{" "}
                    {a.kind === "community"
                      ? "report"
                      : a.kind === "planner"
                        ? "plan"
                        : "vehicle"}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))
      )}
      <Button asChild variant="outline">
        <Link href="/profile">Notification settings</Link>
      </Button>
    </div>
  );
}
