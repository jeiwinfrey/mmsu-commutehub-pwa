"use client";
import { useNow } from "@/lib/use-now";
import { useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api, errorMessage, localDate, type Id } from "@/lib/backend";
import { commuteRoutes, routeLabel } from "@/lib/commute-catalog";
import { Intro, SelectField, Notice } from "@/components/commute/ui";
import { AccountRequired } from "@/components/commute/account-required";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
const categories = ["traffic", "queue", "crowding", "service", "safety"];
export function CommunityScreen() {
  return <CommunityFeed />;
}
function CommunityFeed() {
  const now = useNow();
  const { isAuthenticated } = useConvexAuth();
  const reports = useQuery(api.community.list);
  const publish = useMutation(api.community.publish),
    resolve = useMutation(api.community.resolve),
    confirm = useMutation(api.community.confirm),
    flag = useMutation(api.community.flag);
  const [filter, setFilter] = useState("all"),
    [open, setOpen] = useState(false),
    [editing, setEditing] = useState<Id<"reports"> | undefined>(),
    [routeId, setRoute] = useState(commuteRoutes[0].id),
    [category, setCategory] = useState("traffic"),
    [area, setArea] = useState(""),
    [description, setDescription] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await publish({ id: editing, routeId, category, area, description });
      setOpen(false);
      toast.success(
        editing ? "Report updated" : "Report shared with the community",
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const action = async (p: Promise<unknown>, success: string) => {
    try {
      await p;
      toast.success(success);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  return (
    <div className="feature-stack">
      <Intro
        title="Travel together."
        description="Student observations from along your corridor. Reports are unverified and expire after two hours."
      />
      <Button
        onClick={() => {
          setEditing(undefined);
          setArea("");
          setDescription("");
          setError("");
          setOpen(true);
        }}
      >
        Share a commute report
      </Button>
      <SelectField
        id="report-filter"
        label="Filter reports"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "All categories" },
          ...categories.map((c) => ({
            value: c,
            label: c[0].toUpperCase() + c.slice(1),
          })),
        ]}
      />
      {!reports ? (
        <Skeleton className="h-48" />
      ) : !reports.filter((r) => filter === "all" || r.category === filter)
          .length ? (
        <div className="empty-panel">
          <h2 className="font-semibold">No reports yet</h2>
          <p className="text-sm text-muted-foreground">
            Be the first to share a useful observation.
          </p>
        </div>
      ) : (
        reports
          .filter((r) => filter === "all" || r.category === filter)
          .map((r) => {
            const active = !r.resolved && r.expiresAt > now;
            return (
              <Card id={`report-${r._id}`} key={r._id}>
                <CardHeader>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{r.category}</Badge>
                    <Badge variant="outline">
                      {r.resolved
                        ? "Resolved"
                        : active
                          ? "Unverified observation"
                          : "Expired"}
                    </Badge>
                  </div>
                  <CardTitle>{r.area}</CardTitle>
                  <CardDescription>
                    {r.author} · {localDate(r.createdAt)}
                    <br />
                    {commuteRoutes.find((x) => x.id === r.routeId)?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{r.description}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {r.count} student confirmation{r.count === 1 ? "" : "s"} ·
                    not official verification
                  </p>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                  {r.mine && active ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditing(r._id);
                          setRoute(r.routeId);
                          setCategory(r.category);
                          setArea(r.area);
                          setDescription(r.description);
                          setError("");
                          setOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          action(
                            resolve({ id: r._id }),
                            "Report marked resolved",
                          )
                        }
                      >
                        Mark resolved
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        disabled={!active || !isAuthenticated}
                        onClick={() =>
                          action(
                            confirm({ id: r._id }),
                            r.confirmed
                              ? "Confirmation removed"
                              : "Observation confirmed",
                          )
                        }
                      >
                        {r.confirmed ? "Undo confirmation" : "I saw this too"}
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={!isAuthenticated}
                        onClick={() =>
                          action(
                            flag({
                              id: r._id,
                              reason: "Inaccurate or inappropriate content",
                            }),
                            "Report flagged for review",
                          )
                        }
                      >
                        Flag
                      </Button>
                    </>
                  )}
                </CardFooter>
              </Card>
            );
          })
      )}
      <Notice title="Keep it useful">
        Share traffic and service conditions. Do not post names, phone numbers,
        precise personal locations, or accusations about individuals. For
        emergencies, contact local emergency services.
      </Notice>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[92dvh] max-w-[480px] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>
              {editing ? "Edit your report" : "Share a report"}
            </SheetTitle>
            <SheetDescription>
              Describe what you observed. Never share another person’s private
              information.
            </SheetDescription>
          </SheetHeader>
          <div className="px-5 pb-8">
            <AccountRequired>
              <form onSubmit={submit} className="feature-stack">
                <SelectField
                  id="report-route"
                  label="Corridor and direction"
                  value={routeId}
                  onChange={setRoute}
                  options={commuteRoutes.map((r) => ({
                    value: r.id,
                    label: `${routeLabel(r)} · ${r.mode}`,
                  }))}
                />
                <SelectField
                  id="report-category"
                  label="Category"
                  value={category}
                  onChange={setCategory}
                  options={categories.map((c) => ({ value: c, label: c }))}
                />
                <div className="grid gap-2">
                  <Label htmlFor="report-area">Area or stop</Label>
                  <Input
                    id="report-area"
                    required
                    minLength={2}
                    maxLength={80}
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="report-description">
                    What did you observe?
                  </Label>
                  <Textarea
                    id="report-description"
                    required
                    minLength={10}
                    maxLength={600}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {description.length}/600 characters
                  </p>
                </div>
                {error && (
                  <p role="alert" className="text-destructive">
                    {error}
                  </p>
                )}
                <Button disabled={busy} type="submit">
                  {busy
                    ? "Sharing…"
                    : editing
                      ? "Save changes"
                      : "Publish report"}
                </Button>
              </form>
            </AccountRequired>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
