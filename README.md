# MMSU CommuteHub

A mobile UI starter for our 11-person team, built with **Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, and Lucide icons**.

**Current milestone: build the UI.** The phone shell, navigation, shared components, and feature placeholders are ready. Each member implements their assigned screens using sample data and local interactions. The project is not yet an installable PWA; authentication, database persistence, GPS, live simulation, and push notifications are future work.

## Before you start coding

1. **Check the [Figma app flow](https://www.figma.com/design/5XM95QmsHrTILOz6jNpKxG).** Review the complete journey, then find the screens labeled with your name. Use **Present** to explore the clickable flows. The [Figma handoff](docs/figma-design.md) links directly to all 44 screens. If access is restricted, ask the file owner to grant access.
2. **Find your assignment below and open your TODO.** It lists your screen requirements, working folder, UI states, handoffs, and completion checklist.
3. **Read the [design guide](docs/design-guide.md).** Follow the shared colors, spacing, typography, phone layout, accessibility, and sample-data labels.
4. **Review the [architecture](docs/architecture.md) and [installed UI components](docs/ui-components.md).** Reuse shadcn components and shared types instead of creating separate versions.
5. **Create your feature branch, then work inside your assigned folder.** Follow the [contributing guide](docs/contributing.md) and coordinate shared-file changes with the team.

## Team assignments

All assignments are **UI only**. The speaker numbers map to the names supplied by the team.

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

Install **Node.js 20.9 or newer** and npm. No API keys or external accounts are required to run this UI starter.

```sh
git clone https://github.com/jeiwinfrey/mmsu-commutehub-pwa.git
cd mmsu-commutehub-pwa
npm ci
npm run dev
```

Open [http://localhost:3001](http://localhost:3001). The root redirects to `/commute`. Sign-in and onboarding are independently accessible at `/sign-in` and `/onboarding`.

For another port, run `npx next dev --port 3002`. For a production preview, run `npm run build` followed by `npm start -- --port 3001`.

## Build your feature

```sh
git switch main
git pull --ff-only
git switch -c ui/your-name-feature
```

- Replace `src/features/<your-feature>/screen.tsx` and add local components in its `components/` folder. Keep `src/app` route pages thin.
- Import the installed library from `@/components/ui/<component>`. The complete official shadcn component set is already installed; inspect its [usage notes](docs/ui-components.md) before adding or replacing anything.
- Use `src/types/commute.ts` and the read-only samples in `src/lib/demo-fixtures.ts`. Use local React state for filters, steps, forms, and preview interactions.
- Coordinate changes to the shared shell, navigation, global CSS, types, fixtures, dependencies, and shadcn source before editing them.
- Keep the same phone layout at 320–430 px, with a maximum shell width of 480 px on larger displays. No desktop sidebar.
- Keep sample fares, vehicle positions, occupancy, and reports clearly labeled. Candidate terminals are unverified. Preview actions must not claim data was saved, a report was published, or a notification was sent.

## Check and submit your work

```sh
npm run lint
npm run typecheck
npm run build
```

Check your screens at **320, 360, 390, and 430 px**, plus landscape. Verify direct-page refresh, readable long text, keyboard/focus behavior, relevant loading/empty/error states, and no horizontal overflow or content covered by navigation.

Commit your feature on your branch, push it, and open a pull request to `main`. Include phone screenshots, interaction steps, verification results, and any shared-file changes. Check off only the TODO items you actually completed and verified.

## Documentation

| Read this | What it is for |
| --- | --- |
| [Figma handoff](docs/figma-design.md) | Editable design, prototype starting points, and direct screen links by owner |
| [Team assignments](docs/team-assignments.md) | Feature ownership and cross-feature handoffs |
| [Individual TODOs](docs/todos/) | Each member's implementation checklist |
| [Design guide](docs/design-guide.md) | Shared UI look, layout, tokens, accessibility, and copy rules |
| [Installed UI components](docs/ui-components.md) | shadcn inventory, imports, providers, and compatibility notes |
| [Architecture](docs/architecture.md) | Folder responsibilities, routes, types, and fixture conventions |
| [Contributing guide](docs/contributing.md) | Branches, pull requests, coordination, and checks |
| [Project UI skill](.agents/skills/commutehub-ui/SKILL.md) | Codex guidance for consistent screen implementation; use `$commutehub-ui` when available or ask your agent to read it |
| [PRD](prd.md) | Long-term functional product requirements; the current UI-only milestone is identified at the top |
| [Future integrations](docs/future-integrations.md) | Deferred PWA, Google sign-in, Convex, persistence, GPS, simulation, and notifications |

Figma uses Arimo as an Arial-compatible substitute; the app keeps its existing system font stack. No feature is connected to real transport operations yet.
