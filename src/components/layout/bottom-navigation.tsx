"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Route,
  Clock3,
  Ticket,
  MessagesSquare,
  UserRound,
} from "@/components/commute/icons";
import { cn } from "@/lib/utils";
const destinations = [
  { href: "/commute", label: "Commute", icon: Route },
  { href: "/planner", label: "Planner", icon: Clock3 },
  { href: "/trips", label: "Trips", icon: Ticket },
  { href: "/community", label: "Community", icon: MessagesSquare },
  { href: "/profile", label: "Profile", icon: UserRound },
];
export function BottomNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main navigation" className="bottom-navigation">
      {destinations.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "nav-destination",
              active && "nav-destination-active",
            )}
          >
            <Icon aria-hidden="true" className="size-5" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
