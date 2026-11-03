# Alerts — Princess

UI owner: **Princess**. Route: `/alerts`.

Alerts feed, unread states, alert details, and notification previews.

Start with [your TODO](../../../docs/todos/princess-alerts.md) and [design guide](../../../docs/design-guide.md).

Edit `screen.tsx` and add feature-only components under `components/`. Keep the route page thin. Add `"use client"` only to components needing local interactions.

Use the same fixture reports as Community. No push subscription, geofence detector, or sending jobs.

UI-only milestone: use fixtures and local state; no external services, permissions, persistent storage, or PWA setup. Shared changes require coordination.
