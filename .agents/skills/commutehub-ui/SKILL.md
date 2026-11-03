---
name: commutehub-ui
description: Build, refine, or review MMSU CommuteHub mobile screens using the project's shadcn/ui system, shared visual tokens, and feature ownership. Use for this project's UI assignments and visual polish, not unrelated apps or infrastructure setup.
---

# CommuteHub UI

Create a coherent phone interface across the team's independently owned features. Work within the requested feature; the existing placeholder is a starting point, not a final design to preserve.

## Ground the work

Find the `mmsu-commutehub-pwa` repository from the current workspace. Read its `AGENTS.md`, the relevant `src/features/<feature>/README.md`, and named checklist under `docs/todos/`. Consult these maintained project sources rather than duplicating their contents:

- [Design guide](../../../docs/design-guide.md): read before visual work; owns exact colors, spacing, typography, accessibility, and mock-state copy.
- [Architecture](../../../docs/architecture.md): read when adding screens, interactions, or shared presentation contracts.
- [Team assignments](../../../docs/team-assignments.md): identify ownership and handoffs when scope spans features.
- [Future integrations](../../../docs/future-integrations.md): distinguish deferred infrastructure from current UI work.

These links resolve from the project-owned skill directory. When accessed through a local installation symlink, resolve the real directory first. If the project sources are unavailable, report the missing context rather than applying this system to an unrelated workspace.

The current milestone is **UI only**. Use typed fixtures and local React state for selection, filters, validation, overlays, and preview states. Do not interpret future PRD requirements as authorization to implement auth, persistence, GPS, simulation timers, notifications, or PWA infrastructure. An explicit later user request may change that scope.

## Visual direction

- Use a calm, practical commuter interface: clear route/direction, readable ETA and fare, concise supporting text, and one obvious next action per step. Prefer route selection over a new dashboard.
- Keep the shared centered phone shell, maximum 480 px, with the same layout on large viewports. Five bottom destinations remain Commute, Planner, Trips, Community, Profile; Alerts opens from the header bell. Entry screens omit bottom navigation.
- Preserve the light green/neutral theme through semantic tokens in `src/app/globals.css`. Use system fonts, 16 px body, restrained borders/shadows, and the documented spacing scale. Avoid introducing gradients, decorative panels, extra navigation, fonts, or per-feature palettes unless requested.
- Use 16 px content gutters and 24 px section separation. Make primary actions reachable; account for bottom navigation, safe areas, and an open keyboard. Wrap long stop names and avoid horizontal scrolling. Do not hide overflow as a substitute for fixing layout.
- Distinguish regular/student fare, traditional/modern jeepney, bus, route direction, candidate stops, and stale information in text. Use tabular numerals for time, speed, and fare. Place “Sample data” where the sample values appear; preview actions must not claim a report was published or a notification sent.

## shadcn implementation

Inspect `components.json`, `src/components/ui`, and package scripts first. This project currently uses npm, Tailwind v4, Lucide, and **Radix Nova**; confirm installed configuration before relying on it.

```sh
npx shadcn@latest info
npx shadcn@latest docs <needed-components>
npx shadcn@latest add @shadcn/<missing-component>
```

The full official component set is installed; consult `docs/ui-components.md`. Read the component documentation returned by the CLI. Reuse installed components before adding new ones. Use the explicit `@shadcn` registry; do not overwrite customized shared components. Inspect generated files and dependency changes. Preserve the project's 44 px button touch-target customization.

- Compose Button with `asChild` for Next.js links when using Radix; use built-in variants and semantic tokens. Use `cn()` for conditional classes.
- The generated Combobox uses Base UI `render` despite the Radix preset; follow the installed implementation. TooltipProvider and the light Sonner Toaster already exist at the root.
- Use Card subcomponents for grouped content, Badge for status, and Alert for callouts. Static guidance should not be announced as an urgent alert. Use Skeleton and Empty for their respective states from the installed library.
- Use FieldGroup/Field with associated labels and errors for forms. Use ToggleGroup for small option sets. Show the actual unavailable/error state, not just a transient toast.
- Use Sheet/Drawer for phone detail panels and AlertDialog for confirmations. Provide titles, focus management, Escape dismissal, and focus return. Avoid custom overlay stacking systems.
- Use Lucide icons consistently; hide decorative icons, name icon-only actions, and use `data-icon` on icons inside buttons. Do not turn clickable divs into controls.

## Feature boundaries

Keep App Router pages thin and place feature UI in `src/features/<feature>/screen.tsx` and its `components/` folder. Add `"use client"` only where local interaction requires it. Import shared presentation types from `src/types/commute.ts` and samples from `src/lib/demo-fixtures.ts`. Alerts reference Community report IDs; avoid divergent copies of report content.

Do not redesign the generic placeholder to implement one person's feature. Replace it in that feature's screen. Shared shell, tokens, navigation, types, fixtures, and dependencies affect teammates: make only changes needed by the current request and explain those shared changes. Do not automatically implement every member's TODO.

## Verify and hand off

Check changed screens at 320, 360, 390, and 430 px, landscape, and text zoom. Verify 44×44 px targets, visible keyboard focus, labels/errors, overlay behavior, and content clearance above navigation. Provide a manual selection/list alternative to a map. Respect reduced motion and never rely on color alone for state.

Exercise relevant local interactions and loading/empty/error/unavailable/stale preview states. Confirm sample timestamps stay honest and dates use Asia/Manila. For code changes, run the project's lint, typecheck, and production build; inspect the resulting screen visually when browser access is available. Document any unverified checks rather than claiming they passed.

Report the feature changed, local interactions supported, checks run, and any material remaining UI work. Mark named TODO items complete only when their behavior has been verified.
