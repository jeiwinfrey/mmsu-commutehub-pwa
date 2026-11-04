"use client";
import { useState } from "react";
import { useQuery, usePaginatedQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api, errorMessage, localDate } from "@/lib/backend";
import { useOnlineMutation } from "@/lib/use-online-mutation";
import { AccountRequired } from "@/components/commute/account-required";
import { Intro, Notice, SelectField } from "@/components/commute/ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
export function ModerationScreen() {
  return (
    <AccountRequired>
      <Access />
    </AccountRequired>
  );
}
function Access() {
  const allowed = useQuery(api.moderation.access);
  if (allowed === undefined) return <Skeleton className="h-48" />;
  if (!allowed)
    return (
      <Notice title="Moderator access required">
        This review area is available only to server-authorized moderators.
        Contact the project owner if you need access.
      </Notice>
    );
  return <ReviewQueue />;
}
function ReviewQueue() {
  const [filter, setFilter] = useState("open");
  const { results, status, loadMore } = usePaginatedQuery(
    api.moderation.queue,
    { reviewed: filter === "reviewed" },
    { initialNumItems: 10 },
  );
  return (
    <div className="feature-stack">
      <Intro
        title="Community review"
        description="Review student flags, explain decisions, and keep a dated audit trail."
        back="/profile"
      />
      <Notice title="Commuter observations">
        Reports remain unverified. Reviewing or restoring a report does not
        verify its accuracy or extend its expiry. This is not an emergency
        response service.
      </Notice>
      <SelectField
        id="review-filter"
        label="Review queue"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "open", label: "Open flags" },
          { value: "reviewed", label: "Reviewed flags" },
        ]}
      />
      {status === "LoadingFirstPage" ? (
        <Skeleton className="h-48" />
      ) : results.length === 0 ? (
        <div className="empty-panel">
          <h2 className="font-semibold">No {filter} flags</h2>
          <p className="text-sm text-muted-foreground">
            Student flags will appear here for review.
          </p>
        </div>
      ) : (
        results.map((flag) => <ReviewCard key={flag.id} flag={flag} />)
      )}
      {(status === "CanLoadMore" || status === "LoadingMore") && (
        <Button
          variant="outline"
          disabled={status === "LoadingMore"}
          onClick={() => loadMore(10)}
        >
          {status === "LoadingMore" ? "Loading…" : "Load more flags"}
        </Button>
      )}
    </div>
  );
}
type Flag = FunctionReturnType<typeof api.moderation.queue>["page"][number];
type Decision = "hide" | "reinstate" | "resolve" | "dismiss";
function ReviewCard({ flag }: { flag: Flag }) {
  const report = flag.report;
  const [action, setAction] = useState<Decision>(
    report?.hidden ? "reinstate" : "hide",
  );
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const review = useOnlineMutation(api.moderation.review);
  const events = useQuery(
    api.moderation.history,
    showHistory && report ? { reportId: report.id } : "skip",
  );
  const options = [
    ...(!report?.hidden
      ? [{ value: "hide", label: "Hide report" }]
      : [{ value: "reinstate", label: "Reinstate report" }]),
    ...(!report?.resolved
      ? [{ value: "resolve", label: "Resolve incident" }]
      : []),
    ...(!flag.reviewedAt
      ? [{ value: "dismiss", label: "Dismiss this flag" }]
      : []),
  ];
  const currentAction = options.some((option) => option.value === action)
    ? action
    : (options[0].value as Decision);
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {flag.reviewedAt ? "Reviewed" : "Open flag"}
          </Badge>
          {report?.hidden && <Badge variant="destructive">Hidden</Badge>}
          {report?.resolved && <Badge variant="outline">Resolved</Badge>}
        </div>
        <CardTitle>
          {report
            ? `${report.category} · ${report.area}`
            : "Report unavailable"}
        </CardTitle>
        <CardDescription>Flagged {localDate(flag.createdAt)}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
          <h3 className="text-sm font-semibold">Flag reason</h3>
          <p className="break-words">{flag.reason}</p>
        </div>
        {report && (
          <>
            <div>
              <h3 className="text-sm font-semibold">Report text</h3>
              <p className="break-words whitespace-pre-wrap">
                {report.description}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {report.author} · observed {localDate(report.createdAt)} ·
                expires {localDate(report.expiresAt)}
              </p>
            </div>
            <form
              className="grid gap-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  await review({
                    flagId: flag.id,
                    action: currentAction,
                    reason,
                  });
                  setReason("");
                  toast.success("Review decision saved");
                } catch (error) {
                  toast.error(errorMessage(error));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <SelectField
                id={`decision-${flag.id}`}
                label="Decision"
                value={currentAction}
                onChange={(value) => setAction(value as Decision)}
                options={options}
                disabled={busy}
              />
              <div className="grid gap-2">
                <Label htmlFor={`reason-${flag.id}`}>Review reason</Label>
                <Textarea
                  id={`reason-${flag.id}`}
                  required
                  minLength={10}
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  aria-describedby={`hint-${flag.id}`}
                  disabled={busy}
                />
                <p
                  id={`hint-${flag.id}`}
                  className="text-xs text-muted-foreground"
                >
                  10–500 characters. This explanation is retained in the private
                  moderator audit.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {currentAction === "hide"
                  ? "Hiding removes the report from Community and redacts linked inbox content. New push delivery is suppressed."
                  : currentAction === "reinstate"
                    ? "Restoring makes the report visible again with its original expiry. Alerts will not be resent."
                    : currentAction === "resolve"
                      ? "The report will show as resolved and stop generating notifications."
                      : "Only this flag is closed. The report remains unchanged."}
              </p>
              <Button disabled={busy}>
                {busy ? "Saving decision…" : "Save review decision"}
              </Button>
            </form>
            <Button
              variant="outline"
              aria-expanded={showHistory}
              onClick={() => setShowHistory((value) => !value)}
            >
              {showHistory ? "Hide decision history" : "View decision history"}
            </Button>
            {showHistory && (
              <div className="grid gap-3" aria-live="polite">
                {events === undefined ? (
                  <Skeleton className="h-20" />
                ) : events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No decisions yet.
                  </p>
                ) : (
                  events.map((event) => (
                    <div key={event._id} className="border-t pt-3">
                      <p className="text-sm font-semibold capitalize">
                        {event.action} · {localDate(event.createdAt)}
                      </p>
                      <p className="break-words text-sm">{event.reason}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
