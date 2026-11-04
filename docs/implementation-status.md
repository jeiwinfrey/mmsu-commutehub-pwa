# Implementation status — 4 November 2026

Current scope is the connected mobile PWA, superseding the original UI-only milestone. Free tiers only; no subscriptions, trials, paid plans, or purchases.

## Implemented

- Feature-owned screens for all 11 assignments, Solar icons, flat shared tokens, Motion transitions, and onboarding notification illustration.
- Clerk development authentication with Google enabled and a Convex JWT template.
- Live Convex development deployment, authenticated owner-scoped profiles/preferences/saved routes/trips/plans/alerts, public reports with confirmations/flags/edit/resolve.
- Persisted active trip with explicit boarding, completion, cancellation, and recent history.
- Class-time planner with saved departure/arrival and walk/wait/ride/buffer breakdown.
- OSRM road geometry for all eight directional route variants, shared simulated fleet updated every 15 seconds, fixed-pickup proximity event deduplication, and small-radius crossings between ticks.
- OpenStreetMap attribution, stop-list fallback, optional nearest-stop GPS confined to the browser.
- Web Push sender and device registration controls, VAPID keys configured in the development deployment, personal in-app alerts and scheduled departure reminders.
- PWA manifest, icons, service worker, install instructions, private-data-safe offline screen.
- Typed account deletion confirmation, verified account/application-data removal; sign-out device notification cleanup.

## Verified so far

- Dependency installation, lint, TypeScript, and production build.
- Runtime dependency audit reports zero vulnerabilities (development tooling has separate advisories).
- Seven backend tests: authentication requirements, owner isolation, fare/state validation, report edit restrictions, planner validation, proximity event deduplication, and small-radius crossings between ticks.
- Browser checks: Google button rendering; account-required private pages; no horizontal overflow across public screens at 320/360/390/430/844px; manifest, worker, and offline navigation.
- OSRM geometry saved for every requested directional corridor.

- Connected production-build browser journey passed: profile save/reload, route → vehicle → pickup → tracking/reload → boarding → completion/history, saved planner result/reload. Cross-account community publish/confirm/edit/resolve and saved-route alert fanout also passed. All six browser tests passed together, including dedicated QA data cleanup and permanent deletion of an explicitly disposable test account with signed-out recovery.

## Still in progress / not verified

- Actual Google OAuth completed in Chrome with the owner's account and returned to onboarding. Production OAuth/domain setup still remains.
- Clerk development application claim: CLI consent requests broad persistent management access and is awaiting explicit approval. The unclaimed development instance works but is not a production identity deployment.
- HTTPS deployment: Vercel Hobby import form is prepared for `mmsu-commutehub-pwa`; approval to transmit the development Clerk secret to its environment is pending. Production credentials/domains, installed behavior, and background push on physical devices still require verification.
- Exact terminal locations, safe direction-specific boarding points, and official fare tariffs remain unverified. Estimates and candidate stop coordinates are not operator data.
- Moderation workflow beyond flag storage and application-wide operational monitoring remain release tasks.

The original Figma file was not changed during this implementation. Member TODO files remain the initial assignment checklists, not an assertion that all release criteria are satisfied.
