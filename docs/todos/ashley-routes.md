# Ashley: Commute

## Start here

- Workspace: [src/features/routes](../../src/features/routes/)
- Screen: [screen.tsx](../../src/features/routes/screen.tsx)
- Components: [components/](../../src/features/routes/components/)
- Preview route: `/commute`
- Read [design guide](../design-guide.md), [architecture](../architecture.md), and [contributing](../contributing.md).

## UI checklist

- [ ] Origin/destination selection and direction swap
- [ ] Supported corridor cards and ordered stop list
- [ ] Unsupported-route and empty-search previews
- [ ] Use the [installed shadcn components](../ui-components.md), semantic tokens, and the phone layout.
- [ ] Add local state only where needed to preview interactions.
- [ ] Include loading, empty, error/retry, and unavailable/disabled states where applicable; expose them with a clearly labeled development preview control or documented fixture.
- [ ] Label every sample-data view and preview-only action clearly.
- [ ] Validate forms locally and connect errors to their fields, if forms are present.
- [ ] Check long text, keyboard navigation, visible focus, and 44 px touch targets.

## Dependencies and handoff

Hand route selection to Vehicles; agree on route IDs and direction labels.

Use [shared presentation types](../../src/types/commute.ts) and [read-only fixtures](../../src/lib/demo-fixtures.ts). Agree on additions with other affected members; do not duplicate shared contracts.

## Not assigned in this milestone

No real authentication, database, Convex, Clerk, Google SDK, GPS requests, backend functions, vehicle simulation, service worker, install flow, Web Push, or scheduled jobs. Do not add localStorage persistence. Actions may change local UI but must say “preview” rather than claim remote success.

## Completion evidence

- [ ] Screens render at 320, 360, 390, and 430 px, plus landscape, without horizontal overflow.
- [ ] Dialogs/sheets have titles, keyboard handling, and focus return; forms have labels.
- [ ] `npm run lint`, `npm run typecheck`, and `npm run build` pass.
- [ ] PR includes phone screenshots, interaction steps, preview-state instructions, and known UI limitations.
- [ ] Only assigned feature files changed, or shared-file changes were coordinated.
