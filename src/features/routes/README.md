# Commute — Ashley

UI owner: **Ashley**. Route: `/commute`.

Origin/destination selection, direction switching, corridor cards, and stop lists.

Start with [your TODO](../../../docs/todos/ashley-routes.md) and [design guide](../../../docs/design-guide.md).

Edit `screen.tsx` and add feature-only components under `components/`. Keep the route page thin. Add `"use client"` only to components needing local interactions.

Hand route selection to Vehicles; agree on route IDs and direction labels.

UI-only milestone: use fixtures and local state; no external services, permissions, persistent storage, or PWA setup. Shared changes require coordination.
