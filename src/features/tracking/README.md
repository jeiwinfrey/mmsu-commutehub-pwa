# Waiting for your ride — France

Feature owner: **France**. Route: `/commute/tracking`.

Waiting screen, ETA/speed display, progress, and proximity previews.

Start with [your TODO](../../../docs/todos/france-tracking.md) and [design guide](../../../docs/design-guide.md).

Edit `screen.tsx` and add feature-only components under `components/`. Keep the route page thin. Add `"use client"` only to components needing local interactions.

Consume shared fixture vehicle/pickup types; coordinate boarding handoff with Trips. No movement engine or notifications.

## Current implementation

Tracking follows a persisted directional run snapshot, with continuous outbound/return road movement, terminal/intermediate dwell, ETA based on scheduled pickup time, and fixed-stop geofence events. A missed pickup closes the watch instead of resuming on another circuit. Boarding prevents waiting expiry; simulated destination arrival prompts manual completion. Abandoned rides expire after twelve hours. The map projects the shared deterministic clock and withholds confident estimates when server heartbeat or connection is stale.

The functional-app request supersedes the original UI-only restrictions. Read `docs/implementation-status.md` and `docs/completion-audit.md` for current evidence. Use free services only.
