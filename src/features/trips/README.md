# Your trips — Rocky

Feature owner: **Rocky**. Route: `/trips`.

Active-trip summary, boarding/completion prompts, recent trips, and trip details.

Start with [your TODO](../../../docs/todos/rocky-trips.md) and [design guide](../../../docs/design-guide.md).

Edit `screen.tsx` and add feature-only components under `components/`. Keep the route page thin. Add `"use client"` only to components needing local interactions.

## Current implementation

Active trips come from `convex/trips.ts`; completed/cancelled/missed/expired history is paginated. `/trips/[id]` provides refresh-safe, owner-authorized details. Ride again opens a fresh vehicle search without restarting the historical vehicle. History deletion is owner-scoped and requires a confirmation; active trips must first be finished or cancelled.

The functional-app request supersedes the original UI-only restrictions. The member TODO preserves the initial UI assignment. Read `docs/implementation-status.md` and `docs/completion-audit.md` for current verification and remaining release work. Use free services only.
