# Your trips — Rocky

UI owner: **Rocky**. Route: `/trips`.

Active-trip summary, boarding/completion prompts, recent trips, and trip details.

Start with [your TODO](../../../docs/todos/rocky-trips.md) and [design guide](../../../docs/design-guide.md).

Edit `screen.tsx` and add feature-only components under `components/`. Keep the route page thin. Add `"use client"` only to components needing local interactions.

Coordinate with Tracking and Routes. Local previews reset on refresh; no saved trip claims.

UI-only milestone: use fixtures and local state; no external services, permissions, persistent storage, or PWA setup. Shared changes require coordination.
