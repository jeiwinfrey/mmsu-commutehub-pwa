# Architecture

## Current boundary

This is a runnable UI scaffold, not the functional release in the PRD. Next.js handles routes/rendering; local React state supports UI previews. No global store, external API, backend-shaped service layer, database, auth guard, PWA registration, or persistence is configured.

## Structure

- `src/app`: thin pages and route-group layouts. `(main)` uses the phone shell with navigation; `(entry)` uses the standalone phone shell. Route-group names are not URL segments.
- `src/features/<feature>`: member-owned screen, local components, and README. Place feature-only state/components here. Empty components folders are tracked with `.gitkeep`.
- `src/components/ui`: shadcn source, shared by all members.
- `src/components/layout`: shared shell, bottom navigation, and scaffold placeholder. The generic placeholder is temporary scaffolding; replace it inside your feature screen rather than redesigning it for everyone.
- `src/types/commute.ts`: minimal presentation contracts. They are not Convex schemas or transport API responses.
- `src/lib/demo-fixtures.ts`: read-only sample routes in both directions, one vehicle/trip/plan/profile, and linked community report/alert. Add edge-case fixtures by agreement. Bus endpoint lists are UI samples, not researched full stopping patterns. Coordinates are deliberately omitted.
- `public`: reserved for future approved assets; starter artwork is removed.

## Routes and ownership

| URL | Owner | Layout |
| --- | --- | --- |
| `/` | Shared redirect to `/commute` | Main |
| `/sign-in` | Russel: auth | Entry |
| `/onboarding` | Aira: onboarding | Entry |
| `/commute` | Ashley: routes | Main |
| `/commute/vehicles` | Jeiwinfrey: vehicles | Main |
| `/commute/pickup` | Kathrina: pickup | Main |
| `/commute/tracking` | France: tracking | Main |
| `/trips` | Rocky: trips | Main |
| `/planner` | Michaella: planner | Main |
| `/community` | Kacey: community | Main |
| `/alerts` | Princess: alerts | Main |
| `/profile` | Chadrick: profile | Main |

## Contracts and data flow

Presentation types include RouteOption/Stop, Vehicle/FareEstimate, PickupSelection, Trip, PlannerResult, CommuteReport/AlertItem, and Profile. Fare samples use integer centavos. Directions are explicit; radius choices are 100/250/500/1,000 m. AlertItem references a report ID to keep Community and Alerts consistent. Every fixture carries a sample source; terminal records are candidates.

Initial pages only link to one another and do not transfer selections. During UI development use typed props and local state; coordinate a later shared flow separately instead of inventing persistence or routing contracts independently. Keep feature component imports inside their own feature plus shared folders; avoid importing another member's screen. Promote reusable pieces by agreement. No runtime fixture-to-backend adapter is needed now.

The future backend/auth/PWA backlog is unassigned in `future-integrations.md`. Existing full PRD requirements do not expand this UI milestone.
