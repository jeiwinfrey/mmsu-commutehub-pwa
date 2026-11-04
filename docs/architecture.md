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
| `/community`, `/moderation` | Kacey |
| `/alerts` | Princess |
| `/profile` | Chadrick |

## Simulation and maps

`src/lib/fleet-simulation.ts` computes deterministic round trips from a fixed epoch and staggered vehicle slots. Outbound and inbound road geometries meet at the terminal; vehicles dwell there for 60 seconds and at intermediate stops for 20 seconds. Each directional leg has a distinct run ID, ordinal, geometry revision, and start/end time. Queries project the same server clock; the ten-second cron evaluates eligible waiting trips without rewriting all vehicle records on every tick. Vehicle-list queries refresh on a ten-second bucket and keep future-run availability separate from the current run. Stored OSRM geometry is fetched once and reused; routine simulation does not call OSRM. These fictional operations do not imply an operator feed.

Leaflet displays OpenStreetMap tiles and attribution. Map tiles are not cached by the service worker. A selectable stop list remains available when map tiles fail. Proximity checks the travelled road segments against the fixed pickup coordinate, including crossings between ticks; an account alert is created once per waiting trip. No geofencing of the student's phone is required.

## Notifications and PWA

Convex internal jobs create account alerts and send Web Push using VAPID. Device permission is opt-in. Expired push endpoints are pruned. Sign-out unregisters the current device endpoint. Community alerts apply to saved routes; planner reminders apply to saved departure times.

`manifest.ts` and icons support installation. `public/sw.js` caches only public shell assets and an offline information page. It never caches private pages, auth/API responses, or map tiles. Critical UI mutations check both browser online state and the current Convex connection before starting. A disconnected submission is rejected with an explicit draft/retry message instead of being queued for automatic submission. In-flight operations still require server acknowledgement before success.

`DELETE /api/account` checks origin and authenticated identity, removes that user's application data, then deletes the Clerk account. It is triggered only through a typed confirmation in Profile. Service credentials are server-only and ignored by Git.

## Planner and record lifecycle

The planner uses stored OSRM geometry, explicit simulated terminal service windows (05:00–21:00 Philippine time), and mode headways. It selects the latest feasible scheduled pickup departure and counts origin walk, planned wait, ride, and campus walk once. Saved results carry selected route/mode, tariff estimates, a simulation version, and a revision. A durable `runAt` reminder checks the current revision before creating an alert; edits and deletion invalidate older jobs. Delivery rechecks the plan before sending.

Trips and community feeds paginate independently of active-trip state. Historical trip deletion is owner-scoped and requires a confirmation. Ride again and Use this route create a new draft search, never a restart of a historical vehicle.

Community report cards and alerts read the same report ID. Alerts resolve current content, resolution, and expiry rather than displaying an editable stale copy. Report links query by ID, independent of feed pagination. Eligibility includes saved routes, active trips, and future saved plans. Fanout is idempotent per recipient/report; community device push is limited to one per route per 15 minutes. Queues/traffic expire after 60 minutes, crowding after 15, and service/safety after 120. Report creation is limited to three in ten minutes.

## Run-scoped trips and delivery

Trip creation revalidates the exact selected run and stop order, snapshots run times/geometry/tariff version, and schedules waiting expiry. A missed pickup closes that watch; a later circuit cannot revive it. Boarding invalidates waiting expiry and schedules a twelve-hour abandoned-trip limit. A simulated destination event prompts user confirmation and never completes a trip automatically. Deep links use `/trips/[id]` and authorize the owner on the server.

Push delivery uses `deliveryAttempts` keyed by event and device registration. A transactional claim prevents duplicate successful sends and stale retry completions. Transient failures retry at bounded backoff within proximity TTL (two minutes) or general TTL (five minutes), at most four attempts; 404/410 registrations are pruned. `sent` records transport acceptance only, never viewing. Event IDs become service-worker notification tags.

The daily bounded retention job removes delivery attempts after 30 days, inbox items after 90 days, and unflagged reports 90 days after expiry. Reports with flags are retained for review. Exact student GPS is never persisted; trip history retains named candidate stops. Provider backups follow provider policies separately.

## Community moderation

`/moderation` is linked from Profile only for authorized moderators. `convex/lib/moderator.ts` derives permission from the authenticated Clerk subject and the server deployment's comma-separated `MODERATOR_SUBJECTS`. Missing configuration denies everyone; email, display name, profile fields, and client arguments never grant a role. The existing project owner is the initial moderator in the development deployment. No student or QA account has this role.

Flag queues paginate open/reviewed records. Decisions hide/reinstate reports, resolve incidents, or dismiss a selected flag. Each requires a 10–500 character explanation and appends a server-only audit entry with actor, timestamp and before/after state. There is no public audit mutation. Public projections omit reporter/flagger authentication subjects. Hidden reports are unavailable through feed/detail queries, cannot be edited or confirmed by students, redact linked inbox content, and stop queued push delivery. Previously delivered OS notifications cannot be recalled. Reinstatement preserves the original expiry and never fans out a second notification.

Flagged report evidence is retained for investigation. Deleting the report author's account removes its flags and report audit records. Deleting a moderator's account anonymizes that actor identifier on other reports' audit records. Stop/fare catalog maintenance and investigation-hold release controls are still separate work; this view only reviews community reports.

## Planner comparisons and missed targets

`planner.suggestions` calculates read-only choices from the same server helper used by `planner.save`. The latest feasible departure remains the default. A distinct earlier feasible run is offered when available; future crowding remains unknown. If the target cannot be met, the earliest run still reachable from the current server time is returned with arrival-after-class minutes and arrival-buffer shortfall reported separately. Missing road geometry is distinguished from an unsupported direct connection.

Saving an explicit suggestion requires its route and exact pickup-departure timestamp to match a freshly recalculated choice. Client fares and times are never trusted. Updating an unchanged saved plan preserves its selected earlier departure rather than silently replacing it with the recommendation. A journey missing the arrival target additionally requires explicit acceptance; the ordinary default save cannot silently choose it. Persisted shortfall/lateness is shown after refresh, and its reminder warns that the target is missed. A ten-second query cache key refreshes comparisons without making the client clock authoritative. Form changes hide outdated comparison results. Offline comparison attempts keep the form draft and require reconnection.
