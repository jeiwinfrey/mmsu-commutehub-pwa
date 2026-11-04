# Implementation status — 4 November 2026

Current scope is the connected mobile PWA, superseding the original UI-only milestone. Free tiers only; no subscriptions, trials, paid plans, or purchases.

## Implemented

- Feature-owned screens for all 11 assignments, Solar icons, flat shared tokens, Motion transitions, and onboarding notification illustration.
- Clerk development authentication with Google enabled and a Convex JWT template.
- Live Convex development deployment, authenticated owner-scoped profiles/preferences/saved routes/trips/plans/alerts, public reports with confirmations/flags/edit/resolve.
- Persisted active trip with explicit boarding/completion/cancellation, paginated history, ride again, and confirmed history deletion.
- Schedule-based class-time planner with road-distance ride time, separate walking/wait/buffer arithmetic, fare estimates, edit/cancel, route handoff, and revision-checked durable reminders.
- OSRM road geometry for all eight directional route variants, shared simulated fleet updated every 15 seconds, fixed-pickup proximity event deduplication, and small-radius crossings between ticks.
- OpenStreetMap attribution, stop-list fallback, optional nearest-stop GPS confined to the browser.
- Web Push sender and device registration controls, VAPID keys configured in the development deployment, personal in-app alerts and scheduled departure reminders.
- PWA manifest, icons, service worker, install instructions, private-data-safe offline screen.
- Typed account deletion confirmation, verified account/application-data removal; sign-out device notification cleanup.

## Verified so far

- Dependency installation, lint, TypeScript, and production build.
- Runtime dependency audit reports zero vulnerabilities (development tooling has separate advisories).
- Fourteen backend tests, including schedule boundaries and previous-day calculations, edited/cancelled reminder invalidation, history deletion, report/alert consistency and expiry, plus: authentication requirements, owner isolation, fare/state validation, report edit restrictions, planner validation, proximity event deduplication, and small-radius crossings between ticks.
- Browser checks: Google button rendering; account-required private pages; no horizontal overflow across public screens at 320/360/390/430/844px; manifest, worker, and offline navigation.
- OSRM geometry saved for every requested directional corridor.

- Connected production-build browser journey passed: profile save/reload, route → vehicle → pickup → tracking/reload → boarding → completion/history, saved planner result/reload. Cross-account community publish/confirm/edit/resolve and saved-route alert fanout also passed. The expanded six-test suite passed together, including plan edit/cancel/handoff, ride again/history deletion, linked report edits/resolution in Alerts, QA cleanup, and disposable account deletion. Final checks after the map-retry follow-up also passed: lint, TypeScript, build, fourteen backend tests, and all six expanded production-browser tests. The live road-retry endpoint also returned its stored OSRM path successfully.

## Still in progress / not verified

- Actual Google OAuth completed in Chrome with the owner's account and returned to onboarding. Production OAuth/domain setup still remains.
- Clerk development application claim: CLI consent requests broad persistent management access and is awaiting explicit approval. The unclaimed development instance works but is not a production identity deployment.
- HTTPS deployment: Vercel Hobby import form is prepared for `mmsu-commutehub-pwa`; approval to transmit the development Clerk secret to its environment is pending. Production credentials/domains, installed behavior, and background push on physical devices still require verification.
- Exact terminal locations, safe direction-specific boarding points, and official fare tariffs remain unverified. Estimates and candidate stop coordinates are not operator data.
- Moderation workflow beyond flag storage and application-wide operational monitoring remain release tasks.

The original Figma file was not changed during this implementation. Member TODO files remain the initial assignment checklists, not an assertion that all release criteria are satisfied.

The full completion audit and remaining PRD gates are maintained in [completion-audit.md](completion-audit.md). The goal is not yet claimed complete.
