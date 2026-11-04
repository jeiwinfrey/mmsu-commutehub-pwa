---
name: commutehub-ui
description: Build, refine, or review MMSU CommuteHub mobile screens using shadcn/ui, Solar icons, flat shared tokens, Motion, and the project's feature ownership.
---

# CommuteHub UI

Read the repository's `AGENTS.md`, [design guide](../../../docs/design-guide.md), [architecture](../../../docs/architecture.md), and the relevant feature README/member TODO. User instructions override earlier milestone restrictions. The current assignment is a functional mobile PWA, with simulated vehicle operations and real account persistence. Use free tiers only; no subscriptions, trials, paid plans, or purchases. Do not edit Figma unless separately requested.

## Visual direction

Use a centered phone shell, maximum 480px, at every viewport. Five bottom links: Commute, Planner, Trips, Community, Profile. The header bell opens Alerts. Entry screens omit bottom navigation. Start with route selection, not an extra dashboard.

White surfaces, deep green primary panels, pale green supporting surfaces, rounded controls, generous spacing, clear type. No shadows or gradients. Use semantic tokens in `src/app/globals.css`, 16px body text, 16px gutters, 24px section gaps, minimum 44px touch targets, and safe-area padding. Respect 320px layouts, landscape, text zoom, and reduced motion. Use Motion for short opacity/transform transitions; do not animate every changing vehicle reading.

Use Solar icons through `src/components/commute/icons.tsx` or direct per-icon Solar imports. Decorative icons are hidden from assistive technology; icon-only controls need labels. Do not add Lucide to product screens. The shared shadcn icons are also adapted to Solar.

## shadcn composition

The full official shadcn component set is installed; consult [inventory](../../../docs/ui-components.md). Inspect `components.json` and installed source, then read CLI docs before composing new components:

```sh
npx shadcn@latest info
npx shadcn@latest docs field input sheet
```

Use the explicit `@shadcn` registry for additions. Do not overwrite customized source. The preset is Radix Nova: Button links use `asChild`. Combobox uses Base UI `render`; follow its actual source. Prefer shared Card, Badge, Field, Input, Sheet/Drawer, AlertDialog, Skeleton, Empty, and Sonner rather than custom controls. Preserve minimum touch-target customizations.

Forms need labels, validation, inline errors, submit loading/disabled states, and honest success after server acknowledgement. Overlays need titles, Escape, focus containment, and focus return. Navigation uses links with `aria-current`, not ARIA tabs. Never rely on color alone.

## Integration boundaries

Keep route pages thin and screens/components in `src/features/<feature>`. Use shared types/catalog and generated Convex contracts. Account changes go through owner-scoped Convex functions; no invented user IDs, hidden authentication bypasses, or claims of remote saves from local state. Unsaved draft selection lives in session storage; active trips and history live in the database. Never commit keys or authentication state.

Clearly label simulated locations, speed, occupancy, ETA inputs, illustrative tariffs, and unverified terminal candidates. Community reports are real user observations, marked unverified and time-limited. A created in-app alert is not proof that Web Push was delivered. Request GPS/notification permission only after a user's relevant tap. Offer a manual stop list when maps/GPS fail. Do not cache map tiles or private data offline.

## Verification and handoff

Run lint, typecheck, backend tests, production build, and relevant browser tests. Test phone widths 320/360/390/430 and a wide viewport retaining the phone shell. Exercise real loading, empty, failure/retry, unavailable, stale, and offline behavior. Test production builds without hot reload when verifying OAuth and persistent journeys.

Record verified outcomes and remaining release work in [implementation status](../../../docs/implementation-status.md). Do not claim production readiness from successful rendering or a development login. Update ownership TODOs only for verified work.
