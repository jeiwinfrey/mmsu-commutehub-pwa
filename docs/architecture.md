# Architecture

Next.js App Router renders a single phone layout, max 480px, at every viewport. `src/app` contains thin pages; `src/features` holds the 11 owned features. Shared Radix shadcn components live in `src/components/ui`; layout, maps, account guards, providers, and notification/install controls are shared components.

## Data and identity

`AppProvider` mounts Clerk and `ConvexProviderWithClerk`. The Clerk `convex` JWT template has audience `convex`; its issuer must match `convex/auth.config.ts`. Every private query/mutation derives the owner from `ctx.auth.getUserIdentity().subject`. Client-supplied owner IDs are never accepted. Public reports omit the private authentication subject.

`convex/schema.ts` defines profiles, saved routes, vehicles, road paths, trips, plans, reports, confirmations, flags, notifications, and push registrations. Server mutations validate fares, journey direction, pickup radius, ownership, and trip-state transitions. Public route definitions are in `src/lib/commute-catalog.ts`; fare cents are integers.

Unsaved route/vehicle/pickup selections use browser session storage to survive OAuth redirects and refresh. This is a draft, not a booking. Saved active trips are loaded from Convex, independent of that draft. Exact optional device coordinates are neither persisted nor sent to Convex.

## Routes

| Route | Feature owner |
| --- | --- |
| `/sign-in`, `/sign-up` | Russel |
| `/onboarding` | Aira |
| `/commute` | Ashley |
| `/commute/vehicles` | Jeiwinfrey |
| `/commute/pickup` | Kathrina |
| `/commute/tracking` | France |
| `/trips` | Rocky |
| `/planner` | Michaella |
| `/community` | Kacey |
| `/alerts` | Princess |
| `/profile` | Chadrick |

## Simulation and maps

Convex checks every 15 seconds and advances the shared simulated fleet while trips are waiting or reminders are due. When idle, it avoids geometry reads/fleet writes; list queries project the shared clock forward. A vehicle's phase advances by speed along stored geometry. `vehicles.seedPaths` fetches OSRM road paths sequentially, spaced at least 1.2 seconds apart, and saves the result; regular ticks do not call OSRM. Both directions are distinct simulated services. No real operator feeds are implied. Failed route seeding falls back to a labeled schematic.

Leaflet displays OpenStreetMap tiles and attribution. Map tiles are not cached by the service worker. A selectable stop list remains available when map tiles fail. Proximity checks the travelled road segments against the fixed pickup coordinate, including crossings between ticks; an account alert is created once per waiting trip. No geofencing of the student's phone is required.

## Notifications and PWA

Convex internal jobs create account alerts and send Web Push using VAPID. Device permission is opt-in. Expired push endpoints are pruned. Sign-out unregisters the current device endpoint. Community alerts apply to saved routes; planner reminders apply to saved departure times.

`manifest.ts` and icons support installation. `public/sw.js` caches only public shell assets and an offline information page. It never caches private pages, auth/API responses, or map tiles. Disconnected writes remain pending until the connection recovers; they are never marked saved before the server acknowledges them.

`DELETE /api/account` checks origin and authenticated identity, removes that user's application data, then deletes the Clerk account. It is triggered only through a typed confirmation in Profile. Service credentials are server-only and ignored by Git.

## Planner and record lifecycle

The planner uses stored OSRM geometry, explicit simulated terminal service windows (05:00–21:00 Philippine time), and mode headways. It selects the latest feasible scheduled pickup departure and counts origin walk, planned wait, ride, and campus walk once. Saved results carry selected route/mode, tariff estimates, a simulation version, and a revision. A durable `runAt` reminder checks the current revision before creating an alert; edits and deletion invalidate older jobs. Delivery rechecks the plan before sending.

Trips and community feeds paginate independently of active-trip state. Historical trip deletion is owner-scoped and requires a confirmation. Ride again and Use this route create a new draft search, never a restart of a historical vehicle.

Community report cards and alerts read the same report ID. Alerts resolve current content, resolution, and expiry rather than displaying an editable stale copy. Report links query by ID, independent of feed pagination. Eligibility includes saved routes, active trips, and future saved plans. Fanout is idempotent per recipient/report; community device push is limited to one per route per 15 minutes. Queues/traffic expire after 60 minutes, crowding after 15, and service/safety after 120. Report creation is limited to three in ten minutes.
