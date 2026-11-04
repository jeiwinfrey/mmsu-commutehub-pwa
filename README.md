# MMSU CommuteHub

A mobile-first commuter PWA built with **Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Solar icons, Motion, Clerk, and Convex**.

The current implementation connects sign-in, preferences, saved routes, trip history, departure plans, community reports, and alerts to a shared Convex database. Vehicle operations are simulated. Terminal coordinates and fare tariffs are illustrative and require local verification. No seats are reserved or tickets sold.

**Free services only. Do not start subscriptions, trials, paid plans, or purchases.** Authentication currently uses a Clerk development instance; the owner approved claiming it and storing this app’s development credentials in the named Vercel Hobby project. Those steps are waiting for local browser access to be enabled. Production credentials remain a separate setup task. See [implementation status](docs/implementation-status.md) and [completion audit](docs/completion-audit.md) for verified checks and remaining release work.

## Before you start coding

1. **Check the [Figma app flow](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG).** Review the complete journey, then find the screens labeled with your name. Use **Present** to explore the clickable flows. The [Figma handoff](docs/figma-design.md) links directly to all 44 screens. If access is restricted, ask the file owner to grant access.
2. **Find your assignment below and open your TODO.** It lists your screen requirements, working folder, UI states, handoffs, and completion checklist.
3. **Read the [design guide](docs/design-guide.md).** Follow the shared colors, spacing, typography, phone layout, accessibility, and sample-data labels.
4. **Review the [architecture](docs/architecture.md) and [installed UI components](docs/ui-components.md).** Reuse shadcn components and shared types instead of creating separate versions.
5. **Create your feature branch, then work inside your assigned folder.** Follow the [contributing guide](docs/contributing.md) and coordinate shared-file changes with the team.

## Team assignments

The original feature owners remain: The speaker numbers map to the names supplied by the team.

| Member | Feature | Working folder | Your TODO |
| --- | --- | --- | --- |
| Russel | Welcome and sign-in | [auth](src/features/auth/) | [Russel's checklist](docs/todos/russel-auth.md) |
| Aira | Onboarding and permission explanations | [onboarding](src/features/onboarding/) | [Aira's checklist](docs/todos/aira-onboarding.md) |
| Ashley | Route selection and stops | [routes](src/features/routes/) | [Ashley's checklist](docs/todos/ashley-routes.md) |
| Jeiwinfrey | Vehicle selection, fares, and occupancy | [vehicles](src/features/vehicles/) | [Jeiwinfrey's checklist](docs/todos/jeiwinfrey-vehicles.md) |
| Kathrina | Pickup selection and geofence controls | [pickup](src/features/pickup/) | [Kathrina's checklist](docs/todos/kathrina-pickup.md) |
| France | Waiting, ETA, and tracking states | [tracking](src/features/tracking/) | [France's checklist](docs/todos/france-tracking.md) |
| Rocky | Active trips and recent trips | [trips](src/features/trips/) | [Rocky's checklist](docs/todos/rocky-trips.md) |
| Michaella | Departure planner | [planner](src/features/planner/) | [Michaella's checklist](docs/todos/michaella-planner.md) |
| Kacey | Community feed and reports | [community](src/features/community/) | [Kacey's checklist](docs/todos/kacey-community.md) |
| Princess | Alerts and notification previews | [alerts](src/features/alerts/) | [Princess's checklist](docs/todos/princess-alerts.md) |
| Chadrick | Profile, saved routes, and preferences | [profile](src/features/profile/) | [Chadrick's checklist](docs/todos/chadrick-profile.md) |

See [team assignments and handoffs](docs/team-assignments.md) for how features connect. A placeholder or Figma design does not mean the programming assignment is complete.

## Run the project

Use Node.js 20.9+ and npm. A connected Clerk and Convex development environment is required for account features. Credentials belong in ignored `.env.local`, never in Git.

```sh
npm ci
# Copy .env.example to .env.local and configure your own free development services.
npm run dev
```

Open [localhost:3001](http://localhost:3001). For a new deployment, run `npx convex dev` to configure Convex, configure Clerk's `convex` JWT template, and set the matching issuer in `convex/auth.config.ts`. Read [service setup](docs/service-setup.md).

```sh
npm run lint
npm run typecheck
npm run test:backend
npm run build
npm run test:e2e
```

Browser integration tests use a dedicated Clerk **development** test account under `example.com`; no real verification emails are sent. They exercise the connected development database. Do not run them against production accounts. Playwright artifacts and all credentials are ignored.

## App flow

Welcome/sign-in → onboarding → route → vehicle and fare → pickup and radius → tracking → boarding → completion. Five navigation destinations: Commute, Planner, Trips, Community, Profile. The header bell opens Alerts.

- Account data persists in Convex and is scoped to the authenticated Clerk subject.
- Simulated vehicles follow continuous outbound/return runs with stop dwell; the server checks waiting trips every ten seconds. OSRM geometry is seeded once and reused; OpenStreetMap tiles retain attribution.
- Pickup proximity and departure reminders create account alerts. Background delivery requires explicit browser notification permission and configured VAPID keys. Missed runs close automatically; trip details have refresh-safe links. Push uses bounded retries and per-device attempt records.
- PWA installation includes an offline information page. Private account pages, API responses, and map tiles are not cached.
- Manual pickup works without GPS. Find my nearest stop uses coordinates only in the browser.

## Project guides

- [PRD](prd.md) · [Design guide](docs/design-guide.md) · [Architecture](docs/architecture.md)
- [Team handoffs](docs/team-assignments.md) · [Contributing](docs/contributing.md)
- [shadcn inventory](docs/ui-components.md) · [Project UI skill](.agents/skills/commutehub-ui/SKILL.md)
- [Service setup](docs/service-setup.md) · [Implementation status](docs/implementation-status.md)

Original UI assignments are preserved for ownership and review; their earlier UI-only restrictions are superseded by the explicit functional-app assignment. Figma remains the original team flow reference; the latest flat visual direction is implemented in code without editing Figma.

See [third-party notices](NOTICE.md) for Solar icon attribution and map credits.
