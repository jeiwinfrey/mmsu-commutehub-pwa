# Waiting for your ride — France

Feature owner: **France**. Route: `/commute/tracking`.

Waiting screen, ETA/speed display, progress, and proximity previews.

Start with [your TODO](../../../docs/todos/france-tracking.md) and [design guide](../../../docs/design-guide.md).

Edit `screen.tsx` and add feature-only components under `components/`. Keep the route page thin. Add `"use client"` only to components needing local interactions.

Consume shared fixture vehicle/pickup types; coordinate boarding handoff with Trips. No movement engine or notifications.

## Current implementation

Tracking loads the persisted active trip and shared simulated vehicle. Map motion is projected from the server clock, including while riding; estimates are withheld when the Convex connection is interrupted. Proximity checks sweep the travelled road between ticks and create one event per waiting trip.

The functional-app request supersedes the original UI-only restrictions. The member TODO preserves the initial UI assignment. Read `docs/implementation-status.md` and `docs/completion-audit.md` for current verification and remaining release work. Use free services only.
