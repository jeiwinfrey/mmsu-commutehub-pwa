# Profile — Chadrick

UI owner: **Chadrick**. Route: `/profile`.

Profile, saved routes, preferences, and account-action confirmation dialogs.

Start with [your TODO](../../../docs/todos/chadrick-profile.md) and [design guide](../../../docs/design-guide.md).

Edit `screen.tsx` and add feature-only components under `components/`. Keep the route page thin. Add `"use client"` only to components needing local interactions.

## Current implementation

Account preferences persist through owner-checked Convex mutations: name, supported campus, mode, student fare, default pickup radius, proximity/community/departure alert preferences. Onboarding replay and device setup remain explicit actions. Saved routes, sign-out notification cleanup and typed account deletion are connected. The functional-app request supersedes the original UI-only restrictions; use free services only.
