# Implementation status — 4 November 2026

Current scope is the connected mobile PWA, superseding the original UI-only milestone. Free tiers only; no subscriptions, trials, paid plans, or purchases. The owner has approved Clerk CLI access and storing this app’s development credentials in its Vercel Hobby project. Browser execution is currently disabled in Work settings, so those approved actions remain unexecuted.

## Implemented

- Feature-owned screens for all 11 assignments, Solar icons, flat shared tokens, Motion transitions, and onboarding notification illustration.
- Clerk development authentication with Google enabled and a Convex JWT template.
- Live Convex development deployment, authenticated owner-scoped profiles/preferences/saved routes/trips/plans/alerts, public reports with confirmations/flags/edit/resolve.
- Persisted active trip with explicit boarding/completion/cancellation, run-scoped missed/expired recovery, arrival-confirmation prompts, paginated history, refresh-safe trip details, ride again, and confirmed history deletion.
- Schedule-based class-time planner with road-distance ride time, separate walking/wait/buffer arithmetic, fare estimates, edit/cancel, route handoff, and revision-checked durable reminders.
- OSRM road geometry for all eight directional route variants, deterministic outbound/return fleet with terminal/intermediate dwell, run snapshots, and a ten-second server watch tick, fixed-pickup proximity event deduplication, and small-radius crossings between ticks.
- OpenStreetMap attribution, stop-list fallback, optional nearest-stop GPS confined to the browser.
- Web Push sender with per-device attempt records, bounded transient retries, event tags and TTL, plus device registration controls, VAPID keys configured in the development deployment, personal in-app alerts and scheduled departure reminders.
- PWA manifest, icons, service worker, install instructions, private-data-safe offline screen.
- Typed account deletion confirmation, verified account/application-data removal; sign-out device notification cleanup.

## Verified so far

- Dependency installation, lint, TypeScript, and production build.
- Runtime dependency audit reports zero vulnerabilities (development tooling has separate advisories).
- Twenty-one backend tests, including schedule boundaries and previous-day calculations, edited/cancelled reminder invalidation, history deletion, report/alert consistency and expiry, plus: authentication requirements, owner isolation, fare/state validation, report edit restrictions, planner validation, proximity event deduplication, and small-radius crossings between ticks.
- Browser checks: Google button rendering; account-required private pages; no horizontal overflow across public screens at 320/360/390/430/844px; manifest, worker, and offline navigation.
- OSRM geometry saved for every requested directional corridor.

- Connected production-build browser journey passed: profile save/reload, route → vehicle → pickup → tracking/reload → boarding → completion/history, saved planner result/reload. Cross-account community publish/confirm/edit/resolve and saved-route alert fanout also passed. The expanded six-test suite passed together, including plan edit/cancel/handoff, ride again/history deletion, linked report edits/resolution in Alerts, QA cleanup, and disposable account deletion. Final checks after the map-retry follow-up also passed: lint, TypeScript, build, fourteen backend tests, and all six expanded production-browser tests. The live road-retry endpoint also returned its stored OSRM path successfully.

## Still in progress / not verified

- Actual Google OAuth completed in Chrome with the owner's account and returned to onboarding. Production OAuth/domain setup still remains.
- Clerk development application claim: CLI consent requests broad persistent management access and has explicit owner approval; browser use is disabled, preventing completion. The unclaimed development instance works but is not a production identity deployment.
- HTTPS deployment: Vercel Hobby import form is prepared for `mmsu-commutehub-pwa`; the owner approved transmitting the development Clerk secret to its environment, but browser use is currently disabled. Production credentials/domains, installed behavior, and background push on physical devices still require verification.
- Exact terminal locations, safe direction-specific boarding points, and official fare tariffs remain unverified. Estimates and candidate stop coordinates are not operator data.
- Community moderation is implemented; catalog maintenance/provenance review, investigation-hold release controls, and application-wide operational monitoring remain release tasks.

The original Figma file was not changed during this implementation. Member TODO files remain the initial assignment checklists, not an assertion that all release criteria are satisfied.

The full completion audit and remaining PRD gates are maintained in [completion-audit.md](completion-audit.md). The goal is not yet claimed complete.

Latest follow-up: profile supports a persisted default radius, separate departure alerts and onboarding replay. Delivery-attempt retention is 30 days; old inbox items and unflagged expired reports are removed after 90 days in bounded daily jobs. Flagged reports are held for review. Worker upgrades now wait for an explicit reload; the real browser upgrade test passed for defer, redisplay after refresh, explicit activation, and preserved route. Critical UI mutations now reject a new disconnected submission instead of auto-queuing it; the offline-draft test passed, including reconnect/reload verification that the rejected edit was not saved.

Latest verification: 21 backend tests and 8 production-browser tests pass. Browser coverage includes persisted default radius, direct trip links after refresh, full trip/planner/community/account flows, offline rejection without silent replay, and real old/new service-worker updates. Lint, TypeScript, Convex deployment and production build pass. Production OAuth/deployment, physical-device background push and other remaining PRD gates are still not claimed complete.

## Community moderation checkpoint

Added a mobile `/moderation` view reached from the authorized owner's Profile. Roles derive from exact Clerk subjects in the server deployment environment; absent configuration denies access. No student or QA identity was granted moderator privileges. Required review reasons and immutable server audit events accompany hiding, restoration, incident resolution, and flag dismissal. Hidden records disappear from Community, redact inbox content, and suppress pending push; previously delivered OS notifications cannot be recalled. Restoration preserves the original expiry and does not notify again. Account deletion removes authored-report audit evidence and anonymizes a deleted moderator's identifier on other reports.

Verification: lint, TypeScript, production build, 24 backend tests and 9 connected production-browser tests passed. The moderator browser check used the existing development owner only to review a dedicated QA report, then removed that report/flags/audit through the QA author's cleanup. It verified student denial, hiding, restoration, decision history, and no horizontal overflow at 320/430/844px. No owner profile or unrelated reports were edited. Clerk ownership authorization, Vercel HTTPS deployment and physical-phone install/background push remain unexecuted because local browser use still reports disabled.
