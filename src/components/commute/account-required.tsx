"use client";
import Link from "next/link";
import { useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCircleIcon } from "@solar-icons/react/linear/user-circle";
export function AccountRequired({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  if (isLoading)
    return (
      <div className="feature-stack" role="status">
        <Skeleton className="h-48" />
        <p>Connecting your account…</p>
      </div>
    );
  if (!isAuthenticated)
    return (
      <div className="feature-stack py-12">
        <UserCircleIcon size={56} className="text-primary" aria-hidden />
        <h1>Your commute, connected.</h1>
        <p className="text-muted-foreground">
          Sign in to save trips and plans, share reports, and receive personal
          alerts.
        </p>
        <Button asChild>
          <Link href="/sign-in">Sign in or create an account</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/commute">Browse routes</Link>
        </Button>
      </div>
    );
  return children;
}
