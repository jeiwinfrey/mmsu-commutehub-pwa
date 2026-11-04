# Departure planner — Michaella

Feature owner: **Michaella**. Route: `/planner`.

Class-time form, transport preferences, and departure recommendations.

Start with [your TODO](../../../docs/todos/michaella-planner.md) and [design guide](../../../docs/design-guide.md).

Edit `screen.tsx` and add feature-only components under `components/`. Keep the route page thin. Add `"use client"` only to components needing local interactions.

## Current implementation

The connected planner searches simulated 5 AM–9 PM schedules backward from the class deadline using stored OSRM road distance. Saved plans support editing, cancellation, fare estimates, route handoff, and revision-checked durable reminders. See `convex/lib/planning.ts` and `convex/planner.ts`.

The functional-app request supersedes the original UI-only restrictions. The member TODO preserves the initial UI assignment. Read `docs/implementation-status.md` and `docs/completion-audit.md` for current verification and remaining release work. Use free services only.
