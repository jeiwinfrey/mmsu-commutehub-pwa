"use client";
import Link from "next/link";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/lib/backend";
import { Bell } from "@/components/commute/icons";
import { Button } from "@/components/ui/button";
export function AlertsBell() {
  const { isAuthenticated } = useConvexAuth();
  const count =
    useQuery(api.notifications.unreadCount, isAuthenticated ? {} : "skip") ?? 0;
  return (
    <Button asChild variant="ghost" size="icon" className="relative size-11">
      <Link
        href="/alerts"
        aria-label={
          count
            ? `Open alerts, ${count >= 100 ? "99 or more" : count} unread`
            : "Open alerts"
        }
      >
        <Bell aria-hidden />
        {count > 0 && (
          <span
            aria-hidden
            className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 text-[10px] leading-5 text-primary-foreground"
          >
            {count >= 100 ? "99+" : count}
          </span>
        )}
      </Link>
    </Button>
  );
}
