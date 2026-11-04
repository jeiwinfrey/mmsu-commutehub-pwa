# Alerts — Princess

Feature owner: **Princess**. Route: `/alerts`.

Alerts feed, unread states, alert details, and notification previews.

Start with [your TODO](../../../docs/todos/princess-alerts.md) and [design guide](../../../docs/design-guide.md).

Edit `screen.tsx` and add feature-only components under `components/`. Keep the route page thin. Add `"use client"` only to components needing local interactions.

Use the same fixture reports as Community. No push subscription, geofence detector, or sending jobs.

## Current implementation

The inbox is persisted per account and reads current community-report content and resolution/expiry status. Saved routes, active trips, and future plans determine report eligibility. The header shows persisted unread count. Device delivery is opt-in and checked again before sending.

The functional-app request supersedes the original UI-only restrictions. The member TODO preserves the initial UI assignment. Read `docs/implementation-status.md` and `docs/completion-audit.md` for current verification and remaining release work. Use free services only.
