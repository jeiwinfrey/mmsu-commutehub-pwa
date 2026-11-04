# Design guide

## Product and layout

Mobile-only commuter interface. Prefer route selection over a dashboard. Five bottom destinations: Commute, Planner, Trips, Community, Profile. Alerts is reached through the labeled header bell. Sign-in and onboarding omit bottom navigation. On wider screens retain the same centered 480 px maximum shell; do not introduce a sidebar.

Test 320, 360, 390, and 430 CSS px, landscape, and text zoom. Use `min-width: 0`, wrapping text, and full-width forms. Never hide overflow to conceal broken layouts. Content uses 16 px side padding, 24 px section gaps, and bottom space for navigation plus safe-area insets. Keyboard-open sheets/forms must keep controls reachable.

## Tokens and typography

Source of truth: `src/app/globals.css`. Light theme only for this milestone.

| Role | Token | Value |
| --- | --- | --- |
| Primary / focus | `primary`, `ring` | Deep green #163d2c |
| Background | `background` | #ffffff |
| Text | `foreground` | #1c1917 |
| Surface | `card`, `popover` | White |
| Muted surface | `muted`, `secondary` | #f0f2ef |
| Secondary text | `muted-foreground` | #57534e |
| Selected surface | `accent` | #e8f3eb |
| Warning background/text | `warning`, `warning-foreground` | #fef3c7 / #78350f |
| Destructive | `destructive` | #b91c1c |
| Border / input | `border`, `input` | #d6d3d1 |

Use semantic classes such as `bg-primary`, `text-muted-foreground`, and `bg-warning`; do not scatter raw colors or per-feature themes. White-on-green primary actions and dark warning text are the defaults. Check contrast for new combinations; never use color as the only status signal.

System sans font, 16 px body, 1.5 line height. H1: 24 px/semibold; section title: 18 px/semibold; supporting labels: 14 px. Only compact bottom navigation uses 11 px. Use tabular numerals for changing times/fares. Spacing scale: 4, 8, 12, 16, 24, 32 px. Standard control radius: 16 px; panels: 22–24 px. Use restrained borders. No shadows or gradients. Motion uses short opacity/transform transitions and respects reduced motion.

## shadcn/ui rules

The full official shadcn component set is installed. Use these shared components first; see [component inventory](ui-components.md). Inspect documentation before composing them:

```sh
npx shadcn@latest info
npx shadcn@latest docs field input sheet

```

Coordinate package/shared-file edits. Do not overwrite customized components. The project preset is **Radix**: use `asChild` for links rendered as buttons. The generated Combobox uses Base UI internally; follow its `render` API where applicable. Compose CardHeader/Title/Description/Content/Footer. Use Field/FieldGroup with labeled controls; errors use `aria-invalid` and `aria-describedby`. Small option sets use ToggleGroup. Use Sheet/Drawer for mobile detail panels and AlertDialog for destructive confirmations. Every overlay needs a title, focus management, Escape support, and focus return. Use the installed Skeleton for loading and Empty for empty content. Use semantic token overrides in the shared stylesheet rather than changing component colors per screen.

## Interaction and accessibility

44×44 px minimum touch targets, visible focus, meaningful link text, decorative icons hidden from assistive technology, and names for icon-only controls. Use native elements. A navigation bar uses links with `aria-current="page"`, not ARIA tabs. Respect reduced motion; no map animation is required. Maps need a stop-list/manual-selection alternative.

Use local state for unsaved forms, filters, and overlays. Persist account-owned records through authenticated Convex functions. Ask for GPS and notification permission only after a user taps the related action. Manual pickup is always available. PWA infrastructure, backend jobs, Clerk, and Convex are now explicitly authorized; free services only.

## Honest sample states

Label simulated vehicle operations and illustrative fare/ETA inputs. Community reports and account actions are real; show success only after the server confirms the mutation. Never claim push delivery succeeded merely because an alert was queued. Candidate terminals show “Unverified candidate”; sample occupancy and ETA are not measured live values. Use fixed fixture timestamps and Asia/Manila for displayed dates; do not relabel old fixtures as “just now”. Provide relevant empty, loading, error/retry, unavailable, stale, and success-preview states without claiming remote outcomes.
