import { PageMotion } from "./page-motion";
import Link from "next/link";
import { Bell, BusFront } from "@/components/commute/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "./bottom-navigation";
export function PhoneShell({
  children,
  standalone = false,
}: {
  children: React.ReactNode;
  standalone?: boolean;
}) {
  return (
    <div className="phone-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="app-header">
        <Link
          href="/commute"
          className="brand-link"
          aria-label="CommuteHub commute page"
        >
          <BusFront aria-hidden="true" className="size-6 text-primary" />
          <span>CommuteHub</span>
        </Link>
        {standalone ? (
          <Badge variant="secondary">Commute made simple</Badge>
        ) : (
          <Button asChild variant="ghost" size="icon" className="size-11">
            <Link href="/alerts" aria-label="Open alerts">
              <Bell aria-hidden="true" />
            </Link>
          </Button>
        )}
      </header>
      <main id="main-content" tabIndex={-1} className="app-content">
        <PageMotion>{children}</PageMotion>
      </main>
      {!standalone && <BottomNavigation />}
    </div>
  );
}
