# Waiting for your ride — France

UI owner: **France**. Route: `/commute/tracking`.

Waiting screen, ETA/speed display, progress, and proximity previews.

Start with [your TODO](../../../docs/todos/france-tracking.md) and [design guide](../../../docs/design-guide.md).

Edit `screen.tsx` and add feature-only components under `components/`. Keep the route page thin. Add `"use client"` only to components needing local interactions.

Consume shared fixture vehicle/pickup types; coordinate boarding handoff with Trips. No movement engine or notifications.

UI-only milestone: use fixtures and local state; no external services, permissions, persistent storage, or PWA setup. Shared changes require coordination.
