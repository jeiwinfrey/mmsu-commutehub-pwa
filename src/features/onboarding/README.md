# Onboarding — Aira

UI owner: **Aira**. Route: `/onboarding`.

Introduction steps, campus/mode preferences, and permission explanations.

Start with [your TODO](../../../docs/todos/aira-onboarding.md) and [design guide](../../../docs/design-guide.md).

Edit `screen.tsx` and add feature-only components under `components/`. Keep the route page thin. Add `"use client"` only to components needing local interactions.

Coordinate preference labels with Profile. Explanations must not request browser permissions.

UI-only milestone: use fixtures and local state; no external services, permissions, persistent storage, or PWA setup. Shared changes require coordination.
