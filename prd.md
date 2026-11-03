# MMSU CommuteHub — Product Requirements Document

Version: 1.1 · 3 November 2026 · Status: future product specification; current milestone is UI-only

## Current milestone: UI assignments only

This separate Next.js project is currently a **barebones UI scaffold**. The 11 member assignments cover presentation and local preview interactions only. Backend integration, authentication, actual persistence, GPS, simulation jobs, push notifications, and PWA infrastructure are deferred and unassigned. The project name describes its future delivery target, not an installed or offline-capable app today.

The functional requirements and acceptance criteria below are preserved as **future phases** and must not be interpreted as current member tasks. Use [team assignments](docs/team-assignments.md), [individual TODOs](docs/todos/), [design guide](docs/design-guide.md), and [future integration backlog](docs/future-integrations.md) for the current scope. The fixture catalog does not establish real boarding points or official fares.

## 1. Product decision

Build a mobile-only, installable Progressive Web App (PWA) that helps MMSU student commuters choose a corridor and vehicle, understand the student fare, select a pickup point, receive an approaching-vehicle alert, and plan departure around class time. Use **Next.js + TypeScript + shadcn/ui + Convex**, with **Clerk Google sign-in integrated with Convex**.

This document specifies the replacement for the cloned prototype; it does not claim these features are already implemented. The first release must have real authentication, a real shared database, persistent user activity, realtime subscriptions, and working Web Push. Vehicle locations, speeds, service schedules, ETAs derived from simulation, and simulated occupancy are deliberately synthetic. Mark them clearly wherever displayed. Terminal and fare research has its own verification status; synthetic operations must never imply an operator partnership.

The primary journey is **route → available vehicle and fare → pickup point and geofence → waiting/arrival alert → boarding → trip completion**. A generic dashboard must not interrupt this journey.

## 2. Problem and evidence

Source: `../MMSU_Public_Transportation_Survey_Analysis (1).pdf`, September 2026, pages 1–3. There were 104 submissions on 22–24 September; four failed screening, leaving 100 eligible student commuters. This is a descriptive sample, not proof of prevalence among every MMSU student or the wider public. Multi-select percentages can exceed 100%.

| Finding | Product response |
| --- | --- |
| 65% selected long waits; 54% reported peak-hour waits of at least 15 minutes | Pickup-specific arrival estimates and advance vehicle alerts |
| 57% selected overcrowding; 61 selected crowd indicators as useful | Occupancy indicators with source, age, and confidence |
| 38% late often/always; 50% had ever missed a class/exam | Class-time departure planner with walking, waiting, ride time, and buffer |
| 57% currently “wait and see” for delay information | Shared route reports surfaced as relevant alerts |
| 93 selected tracking as useful | Moving vehicle map and an accessible vehicle list |
| 42% selected fare issues; 48 selected fare estimates as useful | Explicit regular fare, student discount, and final estimate |
| 39 selected safety alerts | Time-limited, attributed disruption/safety reports |

The survey proposed a wider-public service and future consent-based rider aggregation. This release deliberately targets MMSU students first, per the project brief. Real operator GPS and crowd estimation from individual riders are later research, not claims of this release. Tracking in this release follows simulated vehicles, never other students.

## 3. Scope and success

### Release requirements

- Mobile PWA with onboarding, Google authentication, persistent profile/preferences, and optional installation.
- Route-first commute flow, traditional and modern jeepney distinction, simulated buses, pickup selection, configurable geofence, ETA, notifications, and persisted trip lifecycle.
- Dedicated departure-planner tab; recent trips; community report publishing; reports-derived Alerts; profile and settings.
- Shared Convex data, backend authorization, deterministic server simulation, operational seed data, and deployed HTTPS environment.
- Simulated crowding plus independently attributed community crowd reports. No fabricated “verified” crowd counts.
- Mobile moderation and terminal/fare maintenance tools for authorized administrators.

### Outside this release

Native Android/iOS builds, desktop/tablet layouts, driver apps, operator dispatch, seat booking, payments/ticketing, guaranteed boarding, real GPS integrations, background rider tracking, AI crowd inference, turn-by-turn navigation, and unsupported nationwide/campus routes. An availability card is information, not a reservation.

### Evaluation

Track onboarding completion, route-to-waiting conversion, planner use, report publication-to-alert latency, geofence event-to-send latency, failed notification attempts, stale telemetry, and task completion in usability sessions. Use consented, minimal analytics without precise pickup coordinates. Targets for release: at least 90% of pilot testers complete the main journey without assistance; backend geofence event recorded within 15 seconds of a qualifying simulation tick; community reports appear to another online user within 5 seconds under the test network. Measure push receipt separately because OS/network delivery cannot be guaranteed.

Do not claim the simulated pilot reduces real waiting or lateness. A later operator-connected trial must establish its own baseline and measure real outcomes.

## 4. Navigation and mobile interface

Use five persistent bottom navigation destinations: **Commute, Planner, Trips, Community, Profile**. Alerts is a first-class screen opened by a labeled bell with unread badge in the shared header and a relevant-alert entry in Commute. This keeps Planner directly accessible and avoids seven cramped tab items. Community is the report/feed surface; Alerts is the route-filtered information inbox. They share the same report records.

- `/` opens Commute after sign-in/onboarding; unfinished trips appear as a resumable strip.
- `/commute` and nested steps retain route, vehicle, and pickup draft when navigating back.
- `/planner`, `/trips`, `/trips/[id]`, `/community`, `/alerts`, `/profile`, `/onboarding`, and auth routes have refresh-safe states and valid deep links.
- Ship one phone layout, tested at 320, 360, 390, and 430 CSS px, portrait and landscape. On larger viewports show the same centered phone-width layout (maximum 480 px); no sidebar or desktop dashboard.
- Respect notch and bottom safe areas. Bottom navigation must not cover content or the primary action. Keyboard-open forms and bottom sheets remain usable.
- Use shadcn/ui as the component foundation: Button, Card composition, Field/FieldGroup, Input, Select/Combobox, ToggleGroup, Slider, Switch, Badge, Alert, Skeleton, Empty, Drawer/Sheet, Dialog/AlertDialog, Avatar, and toast feedback. Add through the shadcn CLI; check component documentation and existing registry components first. Commit `components.json` and generated component source. Use semantic theme tokens and existing variants.
- Drawers/sheets have accessible titles, focus management, and close actions. Every field has a label and inline validation. Icons need accessible names; colors never carry status alone. Minimum touch targets 44×44 px; text contrast meets WCAG AA; reduced-motion setting disables nonessential motion. Maps always have a list/form alternative.
- Reserve prominent space for “Simulated vehicle data”, last update age, selected direction, and active-trip status. Product copy must use “estimated”, not promise a pickup or seat.

## 5. Onboarding, Google sign-in, and profile

1. Welcome: explain choosing a ride, student fare estimates, departure planning, and simulated tracking in three short screens with Skip.
2. Continue with Google using Clerk. Handle cancellation, provider failure, loading, expired sessions, and retry. Google sign-in does not prove enrollment or fare eligibility. Accept personal Google accounts; no undocumented MMSU domain restriction.
3. Create/upsert the Convex user using the authenticated identity. Collect display name, destination campus from the supported catalog, preferred mode (Any/traditional jeepney/modern jeepney/bus), and optional student-fare preference. Explain bringing valid student identification for the discount; do not collect ID photos.
4. Explain location permission. Request only when the user taps Use my location, not on initial load. Manual pickup works after denial, timeout, or unavailable GPS.
5. Explain notifications and optionally enable them on an explicit tap. If installation is needed on the device, show installation instructions first. Denial never blocks planning or trips.
6. Save onboarding version/completion and preferences in Convex; open route selection. Allow all optional settings to be changed later.

Returning users resume their trip or the Commute screen. Profile shows Google account, editable display name, campus, fare preference, saved routes, notification settings/device status, geofence default, privacy explanation, replay onboarding, sign out, and delete account. Email is provider-managed. Sign-out clears private device caches and disables this device's trip push subscriptions; another account must never inherit them. Account deletion cancels active work, removes private user records/subscriptions, and deletes or anonymizes community attribution according to the published retention policy; delete the Clerk identity with a retryable backend workflow.

## 6. Route catalog and terminal research

Research date: 3 November 2026. Web evidence establishes candidate service corridors, not the exact current boarding bay, active timetable, or legal roadside pickup permission. Preserve provenance in the database. Do not invent precise coordinates from place names.

### Required simulated services, in both directions

| Service | Coverage |
| --- | --- |
| Traditional jeepney | Laoag → San Nicolas → Batac → Paoay and reverse |
| Modern jeepney | Same Laoag–Batac–Paoay corridor and reverse, a distinct mode and fleet |
| Bus | Laoag–Vigan and reverse, using a verified/plausible road alignment through the southern corridor |
| Bus | Laoag–Badoc and reverse |

Allow intermediate corridor trips only when origin/pickup and destination are served in order by that specific run. Bus boarding/alighting uses explicit approved-stop flags; do not assume every bus stops at MMSU or every jeepney stop. Vigan services must distinguish a Vigan-city terminal from a Bantay highway stop. Do not fabricate direct service to every campus. Initially support MMSU Batac Main Campus access via a checked corridor stop plus a walking leg. Other campus destinations appear only after their connection is mapped; unsupported destinations return “No supported journey” rather than synthetic straight-line routes.

### Candidate terminal/stop register

| Place | Mode and evidence | Seed treatment |
| --- | --- | --- |
| Laoag, Hernando Street near AIA/Philam Life | Traditional jeepney terminal reported by local commuters [S4] | Candidate terminal; street/bay and coordinates require local confirmation |
| Laoag, Panganiban Street | Modern-jeepney manager described the terminal as temporary in May 2024 [S3] | Historical candidate, not verified current terminal; relocation must be checked |
| Batac Public Market / city-center corridor | Appears on the jeepney corridor listing [S2] | Candidate intermediate stop, not proof of a dedicated terminal |
| Batac crossing / GV Florida area | Appears in corridor and commuter references [S2, S4] | Candidate transfer area; crossing side and safe boarding point require inspection |
| Paoay Public Market / Paoay Church vicinity | Listed corridor landmarks and local terminal reports [S2, S4] | Candidate endpoint area; traditional/modern bays need separate confirmation |
| PARTAS Laoag, Barangay 1; PARTAS Vigan, New Market, Gen. Luna Street | Terminal directory [S5] | Candidate bus terminals; directory/operator identity and route stopping arrangements need direct confirmation |
| Laoag–Badoc service | Aggregator lists Pagala Express [S6] | Corridor supported as a research lead; Laoag bay and Badoc endpoint remain unverified |

The government news agency documents INTC modern jeepneys on the Laoag–Batac–Paoay corridor in 2020 [S1]; it does not establish today's terminal. Do not label every vehicle INTC or PARTAS. Use fictional simulated fleet names unless an operator explicitly approves representation.

For each terminal/stop store name, type (terminal/stop/landmark), mode applicability, direction/road side, coordinates, source URL, source publication date, last checked time, verification status (`candidate`, `historical`, `field_verified`), and verifier. Fixture coordinates may be manually mapped for simulation but must carry `simulation_only`; exclude them from real boarding guidance. Release for real-world navigation is gated on checking safe boarding locations with operators/LGU/local fieldwork, especially Laoag modern-jeepney and Badoc endpoints. The functional simulated release can proceed with visibly labeled candidate locations.

## 7. Commute: step-by-step flow

### Step 1 — Select route

Show origin area, destination area/campus, and direction; offer Laoag, Batac, Paoay, Badoc, and Vigan where supported. A selected corridor shows ordered stops and available modes. Provide swap direction, saved routes, search, and unsupported-route states. No automatic straight-line “connector” generation.

### Step 2 — Select an available vehicle

Show a realtime list, with optional map, of eligible runs in the chosen direction. Each card shows fictional fleet ID, traditional/modern jeepney or bus, next relevant stop, estimated pickup arrival, simulated speed in km/h, occupancy status, and regular/student estimated fare to the selected destination. Before pickup is selected, label the ETA's reference stop; recompute after Step 3.

Filter out out-of-service runs and vehicles that have passed the pickup for this run. Sort by feasible pickup arrival; optionally filter by mode and available seats. Include “Full”, “Unknown occupancy”, “No vehicles available”, “Telemetry stale”, and reconnect states. Full vehicles remain visible with a warning and no promise of boarding. Vehicle details show stop sequence, direction, source/age, and fare breakdown. Selection advances to pickup, never silently starts a trip.

### Step 3 — Set pickup and geofence

Choose a served stop, search a landmark, tap a map pin, or use current location. Keep the actual selected road-side boarding point visible. Snap to a permitted pickup within 100 m, ask for confirmation, and show the walking leg; reject a pin farther away and suggest served stops. Do not snap across an unsafe crossing silently. Manual selection works without GPS.

Choose radius 100/250/500/1,000 m (default 500 m), preview the circle centered on the saved pickup, and explain “Notify me when this vehicle enters this area.” Recompute eligibility, ETA, and fare server-side for the pickup/destination pair. Show route, vehicle, student/regular fare, pickup, radius, and notification status before **Watch this vehicle** creates the persisted waiting trip. Repeated taps must create one trip, not duplicates.

### Step 4 — Waiting and approaching

Show “Vehicle arrives in about X min”, ETA range, moving marker, direction, occupancy, speed, last update, pickup circle, walking estimate, and relevant reports. Keep a compact active-trip strip across tabs. Users can change radius/pickup, choose another eligible vehicle, or cancel. Revalidate changes; increment the watch version and cancel old watches.

Notify on a qualifying geofence entry: “Your selected modern jeepney is near your pickup. Get ready.” Provide vehicle, pickup, estimate, and deep link. Never say it is at the pickup merely because it entered a 1 km circle. Inside the foreground app show a persistent status/in-app alert even without push permission.

### Step 5 — Board and complete

When the vehicle reaches/passes the pickup, ask “Did you board?” The user explicitly confirms **I've boarded**; a geofence event does not prove boarding. Start the riding state, show destination progress and an optional approaching-destination alert. Ask for completion near the destination; the user confirms **End trip**. Allow manual completion/cancellation if position data fails. Save actual user-confirmed timestamps and estimated fare separately from simulation predictions. Missed vehicle: offer next run; do not silently reassign. A user can have at most one active trip across devices.

Trip state machine: `waiting → approaching → riding → completed`; `waiting/approaching → missed/cancelled/expired`; `riding → cancelled` with an interrupted reason. `approaching` means proximity notification triggered, not boarding. Enforce transitions atomically on the backend. Waiting expires after 2 hours; riding prompts recovery after 6 hours and expires by 12 hours if untouched. Terminal states stop watches and reminders immediately.

## 8. Fares and crowding

Use segment/stop-pair fare rules by mode/service/direction with effective dates, regular fare in integer centavos, discount rate, rounding policy, source, and verification status. Show regular fare, student discount amount, final estimated student fare, and applicability note. Student discount is 20% of the domestic regular fare under RA 11314, subject to eligibility and required identification [S7]. A Google account or preference toggle is not eligibility verification.

Do not hard-code aggregator fares as current official tariffs. For functional simulation, seed explicitly marked sample fare tables for every supported stop pair. Example arithmetic only: ₱50.00 regular − ₱10.00 (20%) = ₱40.00 student. Compute on the server and snapshot the rule/version on trip creation; later fare changes must not rewrite history. Use verified fare-matrix rounding for real tariffs; simulation uses nearest centavo. If no rule exists show “Fare unavailable”; never manufacture a quote.

Crowding is a core release feature: display `Seats available`, `Standing/limited space`, `Full`, or `Unknown`, with source and observation age. Simulated counts are within vehicle capacity and never count logged-in students. Community fullness reports display separately as unverified reports with timestamps and confidence (“one recent report”, “multiple recent reports”), not an authoritative exact count. Expire crowd reports after 15 minutes. Future real rider aggregation needs separate consent, anonymity thresholds, evaluation, and a new specification.

## 9. Departure planner

Dedicated **Planner** tab. Inputs: starting point (search/manual/GPS), supported destination campus and entrance, preferred mode or Any, class date, start time, optional recurring weekdays, arrival buffer (default 10 min), and fare preference. Display all time in Asia/Manila; store UTC timestamps. Require a date to avoid midnight and past-time ambiguity.

Compute a feasible itinerary backward from `arrival deadline = class start − buffer`. Include origin-to-pickup walk, wait for a specific scheduled/predicted departure, ride, explicit transfers if supported, and alighting-to-campus walk. Search available runs backward to find the latest origin departure meeting the deadline. The baseline check is `origin departure + walk to pickup + wait + ride + walk to campus <= deadline`; count each duration once. Use simulated schedule/headway data for future dates and fresh simulated telemetry for near-term vehicles, labeled accordingly. Do not reuse the current vehicle's wait as a forecast for tomorrow.

Results: **Leave by**, expected campus arrival/range, wait, walking, ride time, arrival buffer, total duration, fare, route/mode/direction, crowding when known, and estimate freshness. Offer an earlier/less crowded option where available. If no service can meet the deadline, show earliest feasible arrival and lateness; do not promise punctual arrival. Show no-service/outside-coverage and invalid/past-date states.

Save plans in Convex; optional departure reminder uses a server-scheduled job and Web Push. Editing/cancelling a plan invalidates prior reminder jobs. A plan is not a trip: **Use this route** opens the matching route flow with origin/destination prefilled and requires a currently eligible vehicle. Recalculate if stale. Example acceptance calculation: 08:00 class, 10-min buffer, 5-min origin walk + 8-min wait + 30-min ride + 7-min campus walk → leave 07:00, campus arrival 07:50, assuming an available run matches that wait.

## 10. Trips, Community, Alerts, and Profile

### Trips

Show the active trip first, then reverse-chronological completed, cancelled, missed, and expired trips. Detail includes route/direction, mode/vehicle, pickup/destination, start/end, predicted versus user-confirmed duration, fare snapshot, and simulation label. Paginate; handle empty/loading/error states. **Ride again** prefills a new search and checks today's service; it does not restart the historical vehicle/run. Private history persists across devices. Users can delete historical records; recent-trip summaries must not imply measured fares or real tracking.

### Community

Authenticated users publish commute reports to other students: traffic/delay, terminal queue, crowding, service interruption, route change, safety concern, or normal conditions. Require corridor/direction, category, approximate stop/area, observation time, and description (10–500 characters); optionally attach a vehicle. Preview before publish; no location permission required. No photos, comments, or chat required in v1.

Persist real posts, paginate a newest-first feed, filter by corridor/category, and show pseudonymous display name, time, location area, and “Community report — unverified”. Do not expose email, precise user location, or private pickup. Limit creation to 3 reports/10 minutes/user and deduplicate retries. Authors may edit/retract; other users may confirm “Still happening” or flag abuse once per report. Confirmations are not official verification.

### Alerts

Alerts is a read model of the same published community reports, filtered by followed corridor/direction, active trip, saved plan, or user-selected area. Publishing a report must make it visible here to other eligible users, not only the author's device. Do not create a disconnected static alerts array or duplicate editable report objects.

Default expiry: crowding 15 min; queues/traffic 60 min; service/route/safety reports 2 hours unless moderated. Show source, observed time, expiration/resolution, severity, and verification status. A student's report cannot claim official severity or verification; moderators can annotate status. Expired reports leave the current feed and remain dated in history. Report edits/retractions/moderation propagate to Alerts. Users have persisted read state. Optional community push is opt-in, route-scoped, and rate-limited to one notification/route/15 minutes; geofence and departure notifications use separate preferences. User-specific proximity/reminder notifications have their own inbox records and links, distinct from community reports.

### Moderation

Authorized administrators get a mobile moderation view to hide/reinstate reports, resolve incidents, manage flags, and edit candidate/verified stop and fare records with provenance. Server-assigned roles cannot be edited by students. Audit every moderation/catalog change. Safety reports are commuter observations, not an emergency response service.

## 11. Server simulation, ETA, and geofencing

### Simulation engine

- Seed versioned, road-following GeoJSON polylines for each direction, ordered stops with distance along route, simulated service windows/headways, fleet capacities, per-segment speeds, and terminal dwell. Do not reuse the prototype's arbitrary campus coordinates or straight-line connectors.
- Use fictional fleets with at least two vehicles per direction per required mode/service: 16 active vehicle runs minimum across the two jeepney modes and two bus corridors. Stagger departures. A run has its own ID, vehicle ID, direction, route-version, departure, and status; a turnback creates a new run.
- A single Convex-scheduled loop computes updates every 10 seconds using server elapsed time, not browser timers or fixed per-frame increments. Derive deterministic position/distance/speed from a seeded scenario; handle dwell at zero speed. Persist current telemetry and bounded samples. A guarded lease/generation prevents duplicate scheduler chains; restart recovery reconciles elapsed time.
- Simulate realistic configurable segment speeds, stops, peak congestion, full vehicles, service end, and terminal turnaround. These parameters are test fixtures, not measured local conditions. Normal demo playback is 1× time; accelerated scenarios are developer-only and visibly labeled.
- Two clients observing the same run see the same state. The simulation, geofence evaluation, reminders, and push jobs continue after all browsers close. A pause/failure marks telemetry stale; never keep displaying fictional fresh countdowns.

### ETA calculation

Determine pickup/destination distance along the selected directional route. Remaining arrival time is the sum of remaining segment travel plus intervening stop dwell and traffic modifiers; during dwell use modeled onward time rather than dividing by zero speed. Exclude wrong-direction/passed-pickup runs. Show `Arriving` below 1 minute; avoid negative time. A scheduled future run uses departure time and modeled travel, not a marker already on the road. Recompute on each tick; UI interpolation may smooth the marker but must not change authoritative progress.

Telemetry older than 30 seconds is stale: show last update, pause confident ETA/geofence promises, and restore only after fresh data. Show ETA range and “simulated estimate”; measured real-world ETA accuracy is outside this release.

### Geofence engine

A geofence is **a server-side proximity watch around a fixed, user-confirmed pickup**, not continuous background phone GPS. The backend compares the selected run's coordinates to the pickup radius, while checking forward route progress and valid pickup direction.

Create one watch per active waiting trip with owner, run, pickup, radius, watch version, and last state. Trigger on outside-to-inside entry while approaching; if already inside when armed, send one immediate proximity event with “already nearby”. Evaluate the movement segment between ticks to catch a vehicle crossing a small circle between samples; also verify the pickup has not already been passed. Invalidate the watch on boarding, cancellation, expiry, missed run, or selection changes. A unique `(tripId, runId, watchVersion, eventType)` event key prevents duplicate inbox events/jobs during retries or concurrent tabs. Do not re-alert on boundary jitter; a deliberate edit/rearm creates a new version and explains that another alert can occur.

The durable notification event is authoritative. A Convex Node action sends standards-based Web Push with VAPID; scheduling the action follows the event's committed transaction. Track attempts, retry transient failures with bounded exponential backoff, drop expired notifications, and remove 404/410 push subscriptions. External push delivery is not exactly-once: reuse event IDs and notification tags to reduce duplicate display. Record queued/sent/failed states without claiming a sent push was viewed. Include TTL (proximity alert 2 minutes) and only a safe deep link; validate session/ownership on opening.

## 12. PWA requirements and limitations

- HTTPS deployment, valid manifest with stable ID, name, start URL, scope, standalone display, theme/background colors, 192/512 and maskable icons, Apple touch icon, and working service worker.
- Chrome/Android install affordance where supported; iPhone Add to Home Screen guidance. Browsing/planning works without installation. iOS Home Screen Web Push support requires a compatible OS (introduced in iOS 16.4) and explicit user-triggered permission [S8]. Detect capabilities instead of assuming permission equals a valid subscription.
- Service worker handles push and notification clicks. Registration/subscription state is reconciled after sign-in, reinstall, permission changes, and account switching. Multiple devices may subscribe per user; allow disabling one device.
- Cache app shell/static assets and a versioned public route catalog. Provide an offline screen and last-synced public data with age. Do not cache private authenticated responses indiscriminately. Do not queue critical trip actions or report submissions offline in v1: preserve a clearly marked local draft and require explicit online submission.
- No offline live ETA, new login, real-time report publication, or guaranteed offline push. Foreground reconnect resynchronizes trips and reports, with retry actions for failures. Never show success before backend acknowledgement.
- Browser JavaScript/service workers must not be treated as permanently running background trackers. Server simulation plus fixed-pickup monitoring makes the requested proximity feature feasible while the phone is locked. Push arrival still depends on permission, connectivity, browser support, and OS policy; show in-app alternatives without guarantees.
- Service-worker updates prompt a safe reload and preserve active-trip recovery. Test upgrades from an earlier cached build. Reduce map bandwidth; load maps on demand and fetch only active corridor telemetry. Use a tile provider whose production usage policy permits the expected traffic, show attribution, and avoid bulk-caching public OpenStreetMap tiles.

## 13. Backend, data, and security

### Architecture

Retain Next.js App Router/TypeScript and use shadcn/ui + Tailwind for the phone UI. Use MapLibre/react-map-gl if compatible after dependency verification. Convex is the source of truth for application data and realtime queries; Clerk owns Google identity/session handling [S9]. Authorize every public Convex function from `ctx.auth` identity; client-side route protection alone is insufficient. Use Convex scheduled functions for simulation, expiry, reminders, and delivery jobs [S10]. Network side effects execute in actions; validate/persist state in transactional mutations.

### Required collections and indexes

| Collection | Essential fields and access |
| --- | --- |
| `users` | Unique auth subject, display name, role, onboarding version, preferences, deletion status; owner/admin only |
| `campuses` | Checked campus entrance and supported connection; public catalog |
| `stops` | Coordinates, direction/boarding rules, modes, provenance and verification status; public safe fields |
| `routes`, `routeStops` | Corridor/mode/direction, versioned polyline, ordered distance/stops, service window; public |
| `fareRules` | Stop pair, service/mode, centavos, discount/rounding/effective version, source; public |
| `vehicles`, `vehicleRuns`, `vehiclePositions` | Fictional vehicle, capacity, route/direction, progress, speed, timestamp/source, occupancy; public safe telemetry, internal writes only |
| `trips`, `tripEvents` | Owner, active status, run, private pickup, destination, fare snapshot, timestamps/version; owner only |
| `geofenceWatches` | Owner/trip/run/version, center, radius, lifecycle/dedup state; owner read/internal write |
| `plans`, `savedRoutes` | Owner, inputs/result/version, reminder job, timestamps; owner only |
| `reports`, `reportConfirmations`, `reportFlags` | Author, route/direction, category, approximate area, text, observed/expiry time, moderation; published projection for feed; flags private to submitter/moderator |
| `alertReads` | User/report and read time; owner only |
| `notifications`, `pushSubscriptions`, `deliveryAttempts` | Owner/event, type, safe payload, TTL/status, device endpoint/keys; owner-safe reads, secrets/internal writes |
| `simulationState`, `auditEvents` | Lease/scenario version and admin/internal audit; no student writes |

Index users by auth subject; route stops by route/order; runs by route/direction/status; positions by run/time; trips by owner/status and owner/time; reports by route/direction/status/time; plans by owner/deadline; subscriptions by owner/device; events by dedup key. Enforce uniqueness transactionally where needed; database indexes alone must not be assumed to impose uniqueness. Paginate feeds/history and bound all telemetry subscriptions. Query functions expose projections rather than entire user/private documents.

### Security and retention

Validate IDs, coordinates, radius bounds, fare inputs, route ordering, timestamps, report length, and lifecycle transitions server-side. Never trust a submitted owner ID, role, fare, or notification target. Prevent cross-user reads/writes, direct telemetry changes, and moderator privilege escalation. Plain-text report rendering prevents injected markup. Authenticate administrative/internal endpoints, verify any Clerk webhook signature, and avoid logging tokens or exact private locations. Protect push senders from arbitrary endpoints/SSRF by validating supported HTTPS push endpoints and using a vetted Web Push library.

Initial retention: precise pickup/geofence centers removed within 24 hours after a terminal trip state; trip history retains named stops/route and fare snapshot until user deletion. Raw telemetry samples expire after 24 hours (keep current run state); notification attempts after 30 days; expired reports after 90 days unless retained for a documented moderation investigation. Account deletion removes personal application data within 30 days, and immediately revokes active watches/subscriptions. Document backup/provider retention separately. Scheduled jobs and late retries must check deletion/watch version before acting.

## 14. Delivery sequence and gates

Each phase delivers a working vertical slice. Do not defer persistence, authorization, or error states until visual completion.

1. **Catalog and foundation:** audit the prototype and locked dependencies; follow repository `AGENTS.md` and bundled Next.js version docs before code edits. Establish shadcn configuration/theme, phone shell, route types, explicit simulation labels, and source/verification register. Build road-aligned simulation fixtures and candidate stop mappings. Gate: no arbitrary campus connector geometry; route direction and stop order validated.
2. **Real identity and persistence:** configure Convex dev/prod projects and Clerk Google OAuth; implement authenticated identity mapping, backend guards, onboarding, profile, sign-out, and account deletion flow. Gate: real Google sign-in and cross-device profile persistence; user B cannot access user A's private data.
3. **Route-to-pickup slice:** seed all required directional services and sample fare rules; ship route selection, available-vehicle list, fare breakdown, manual/GPS pickup, and geofence settings. Gate: route eligibility and fare computed server-side; denied GPS still allows the full flow.
4. **Simulation and trips:** add the scheduled 10-second simulation, realtime positions/ETAs/crowding, durable active trips, transitions, recent history, and cross-device recovery. Gate: closing all browsers does not stop movement; reopening restores the same trip; missed/wrong-direction vehicles are handled.
5. **PWA and proximity delivery:** manifest, service worker, installation guidance, device subscription management, backend geofencing, durable event/outbox, retries, and foreground fallback. Gate: physical Android and installed iPhone receive a selected-vehicle proximity push with the app backgrounded; no duplicated event on retries.
6. **Planner:** implement class date/time, supported campus walks, backward schedule search, alternate results, persistence, and server reminders. Gate: feasible/infeasible and previous-day calculations pass; edits suppress obsolete reminders.
7. **Community and Alerts:** publish/read/edit/retract reports across accounts, route-scoped Alerts, expiry, read state, flags/moderation, and optional push. Gate: another student sees the same report in Community and Alerts; hiding/retracting removes it from both current feeds.
8. **Release hardening:** complete physical-phone QA, offline/update recovery, authorization/concurrency tests, rate limits, retention jobs, production OAuth/domain configuration, job monitoring, and runbook. Field-check terminal/fare records before enabling any real-world guidance. Gate: every release acceptance criterion below has evidence or a specifically documented external blocker; never replace an unavailable real service with hidden mock auth/database behavior.

## 15. Acceptance checklist

- [ ] Google OAuth succeeds on the deployed origin and mobile standalone launch; cancelled/failed login offers retry; protected functions reject missing/invalid identity.
- [ ] Onboarding/preferences/history persist after refresh and on a second device; another account cannot read private records, endpoints, or pickup coordinates.
- [ ] All four service/mode combinations run both directions; markers follow mapped roads, stop/dwell, turn back with new run IDs, and show simulation labels.
- [ ] Route → vehicle/fare → pickup/radius → watch flow works without GPS. Same-coordinate/destination, unsupported stops, wrong direction, full service, and passed pickup have explicit outcomes.
- [ ] Fare calculation applies the 20% student estimate with defined rounding, fallback, source/status, and an immutable trip snapshot.
- [ ] Speed, occupancy, ETA, and age update from Convex. Simulation downtime produces a stale state rather than an advancing client-only countdown.
- [ ] Entry, initially-inside, between-ticks crossing, boundary jitter, wrong direction, passed pickup, changing radius/run, and replayed job cases produce the correct single durable event per watch version.
- [ ] Physical-device push works with browser backgrounded/phone locked under supported conditions; denied/unsupported/expired permission shows fallback; expired push endpoints are removed; event send failures are observable.
- [ ] Trip boarding/completion require user confirmation; duplicate tabs cannot start two active trips; completion/cancellation stops all associated watches.
- [ ] Planner arithmetic, service windows, future-date forecast, unsupported campus, missed deadline, midnight/previous-day, plan edits, and reminder cancellation are verified.
- [ ] Account A's report appears to account B in both Community and applicable Alerts; edit/retraction/expiry/moderation propagate; rate limits and one-confirmation-per-user hold.
- [ ] Recent trips reload correctly, display historical snapshots, and Ride again chooses a fresh run.
- [ ] Every screen uses the phone layout and shadcn foundation, has loading/empty/error/retry states, supports screen-reader/keyboard navigation, and fits 320 px without horizontal scrolling.
- [ ] Install, offline shell, stale-public-data labels, network recovery, sign-out cache clearing, and service-worker upgrade during an active trip work on real phones.
- [ ] Account deletion and retention jobs remove sensitive data and prevent delayed notifications; no secret keys or private coordinates appear in public responses/client bundles/logs.
- [ ] Lint, TypeScript, production build, backend function tests, and mobile end-to-end checks pass. Test deterministic simulation/ETA/geofence/fare/state logic with a controlled clock; use two identities for authorization/report tests. Real Google and push smoke tests supplement automated provider fixtures.

## 16. Provisioning and operational definition of done

Implementation must include `.env.example` with variable names only, Convex schema/functions/seeds, fixture/source register, test scripts, and a README with reproducible local/production instructions. Do not commit credentials. Required external setup: Convex deployments; Clerk application with Google provider and verified production redirect/origin settings; Google production OAuth configuration where required; HTTPS frontend hosting; VAPID keys and sender contact stored server-side; permitted map tile/routing provider configuration. Match Clerk issuer/audience to each Convex environment. Use generated Convex API bindings and separate development data from production [S9–S11].

The application must fail clearly when configuration is absent; “demo login” and localStorage-only substitutions do not satisfy completion. LocalStorage/IndexedDB is limited to non-authoritative preferences, safe offline public catalog, and unsent drafts. Run frontend and Convex development backend together. A public HTTPS test environment is required for phone geolocation/push and production-like OAuth testing; a laptop's HTTP LAN URL is insufficient for full PWA validation.

Document seed/reset commands, scheduler health/last tick, failed push inspection/retry, moderation ownership, report expiry, stale-data recovery, account deletion reconciliation, service-worker rollback, and provider costs/quotas. Simulation writes and fan-out must be bounded and monitored. Deployment is complete only when the real Google account, shared Convex persistence, scheduler, report propagation, and physical-device notification journey have been tested end to end. Missing provider access/configuration is an explicit blocker, never evidence that the functionality works.

## 17. Prototype changes required

Replace `src/lib/store.tsx` localStorage authority with authenticated Convex queries/mutations; do not migrate the seeded demo identity/reports as real student data. Optional import of valid old personal preferences/history must be user-confirmed and marked legacy demo history. Replace `src/lib/data.ts` fixed waits/fares, arbitrary coordinates, generated direct campus routes, and static alerts with versioned catalog, simulation, and report data. Replace manual four-stage trip advancement with the explicit server-enforced lifecycle and user boarding/completion confirmations. Replace desktop sidebar/More navigation with the specified phone shell. Rework the current same-day subtraction planner into a dated, service-aware search. Add auth, shadcn foundation, backend jobs, push, manifest/service worker, and operational configuration; existing pages alone do not satisfy these requirements.

## 18. Sources and unresolved verification

- **Survey:** supplied PDF, pages 1–3; evidence and scope limits summarized in Section 2.
- **S1:** [Philippine News Agency: Ilocos Norte joins modern jeepneys bandwagon](https://www.pna.gov.ph/articles/1122038), 17 Nov 2020. Historical government reporting of the INTC corridor, not proof of present fleet/terminal.
- **S2:** [CommuteTour: Laoag–Batac–Paoay route](https://ph.commutetour.com/ph/routes/laoag-batac-paoay/). Secondary corridor/landmark reference; fare/schedule details require operator checks.
- **S3:** [Bombo Radyo Laoag: Panganiban Street modern-jeep terminal](https://laoag.bomboradyo.com/terminal-dagiti-modern-jeep-iti-panganiban-st-ditoy-siudad-ti-laoag-gagem-a-maikkat-gapu-ta-makaitunda-ti-nairut-a-trapiko/), 29 May 2024. Reports temporary status and possible removal.
- **S4:** Local commuter leads: [Hernando Street traditional-jeep terminal](https://www.reddit.com/r/Ilocos/comments/1uj4smn/laoag_to_batac/), [Paoay terminal near church](https://www.reddit.com/r/Ilocos/comments/1s0aeyc/paoay_to_laoag/). Unverified community evidence, not official terminal records.
- **S5:** [PARTAS terminal directory](https://partasbusticket.ph/terminal). Secondary directory treated as a candidate lead; verify operator affiliation and boarding arrangements directly.
- **S6:** [CommuteTour: Laoag services](https://ph.commutetour.com/ph/terminal/laoag-city/). Secondary Laoag–Badoc service lead, not current timetable authority.
- **S7:** [Supreme Court E-Library: Republic Act 11314](https://elibrary.judiciary.gov.ph/thebookshelf/showdocs/2/88836). Student discount basis; confirm current applicable fare matrices before real-fare release.
- **S8:** [WebKit: Web Push for Web Apps on iOS and iPadOS](https://webkit.org/blog/13878/) and [Apple: Sending web push notifications](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers). Platform requirements and server push model.
- **S9:** [Convex & Clerk](https://docs.convex.dev/auth/clerk). Google identity integration via Clerk and authenticated backend access.
- **S10:** [Convex scheduled functions](https://docs.convex.dev/scheduling/scheduled-functions). Durable scheduling foundation.
- **S11:** [Convex environment variables](https://docs.convex.dev/production/environment-variables). Environment-specific deployment configuration.

Open fieldwork items: current separate Laoag traditional/modern bays; Paoay turnaround bays; safe directional Batac/MMSU access points; Badoc terminal; checked campus gates/walking legs; current official fare matrices and service windows. These are release checks for real transport guidance, not permission to fabricate confirmed terminal locations. Until resolved, publish the application as a functional simulation with candidate-place labels.
