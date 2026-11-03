# Pickup point — Kathrina

UI owner: **Kathrina**. Route: `/commute/pickup`.

Manual pickup selection, static map placeholder, and geofence radius controls.

Start with [your TODO](../../../docs/todos/kathrina-pickup.md) and [design guide](../../../docs/design-guide.md).

Edit `screen.tsx` and add feature-only components under `components/`. Keep the route page thin. Add `"use client"` only to components needing local interactions.

Hand a local PickupSelection to Tracking. Do not use real GPS, a map API, or geofence evaluation.

UI-only milestone: use fixtures and local state; no external services, permissions, persistent storage, or PWA setup. Shared changes require coordination.
