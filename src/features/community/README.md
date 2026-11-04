# Community — Kacey

Feature owner: **Kacey**. Route: `/community`.

Report feed, filters, report composer, and confirmation previews.

Start with [your TODO](../../../docs/todos/kacey-community.md) and [design guide](../../../docs/design-guide.md).

Edit `screen.tsx` and add feature-only components under `components/`. Keep the route page thin. Add `"use client"` only to components needing local interactions.

Share report IDs/categories with Alerts. Do not imply a preview report was published to others.

## Current implementation

The public feed is paginated and filterable by category and corridor. Report links load their exact record even outside the newest page. Authenticated publishing/editing/confirmation/flagging uses owner-checked Convex mutations; corridor changes require a new report. Expiry and posting limits are enforced on the server.

The functional-app request supersedes the original UI-only restrictions. The member TODO preserves the initial UI assignment. Read `docs/implementation-status.md` and `docs/completion-audit.md` for current verification and remaining release work. Use free services only.
