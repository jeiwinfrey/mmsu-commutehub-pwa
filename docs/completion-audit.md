# Completion audit

The goal remains the complete functional mobile app. Verification at this checkpoint: lint, TypeScript, production build, fourteen backend tests and six expanded production-browser tests passed. Passing the current tests does not establish that every PRD release gate is complete. No subscriptions, trials, paid plans, or purchases are authorized.

## Current evidence

| Requirement | Evidence | Status |
| --- | --- | --- |
| Mobile, flat shadcn interface, Solar icons, Motion | Shared tokens/layout, owned screens, onboarding SVG, production build and phone-width browser checks | Implemented; physical-device QA remains |
| Real Google sign-in and shared database | Google flow completed in Chrome; authenticated Clerk/Convex development deployment; owner-isolation and real connected browser tests | Development works; production ownership/keys/domains pending |
| Corridors in both directions and working map | Eight stored OSRM paths, attributed Leaflet/OSM maps, simulated fleet and fixed-stop geofences | Implemented with unverified terminal candidates and illustrative tariffs |
| Onboarding → route → vehicle/fare → pickup/radius → waiting → boarding/completion | Connected browser journey, persistence after refresh, server-side fare/state validation | Implemented |
| Class-time planner | Backward scheduled-run search, OSRM ride distances, walking/wait breakdown, fare, edit/cancel, route handoff, revision-checked durable reminders | Implemented; expanded production-browser checks passed |
| Recent trips | Active record plus paginated terminal history, details, ride again, confirmed owner-scoped deletion | Implemented; expanded production-browser checks passed |
| Community and alerts | Paginated/filterable feed; report-ID links; current report text/status in account inbox; saved-route/trip/plan eligibility; unread badge; posting/expiry/push limits | Implemented; expanded production-browser checks passed |
| PWA installation, offline and notifications | Manifest/icons, service-worker/offline browser test, opt-in device controls and configured VAPID sender | Shell/offline verified locally; HTTPS install/background push on physical phones unverified |
| Profile and account lifecycle | Persistent preferences/routes; confirmed sign-out/deletion; disposable account deletion browser test; QA data cleanup | Core implemented; additional PRD profile controls remain |

## Remaining work before claiming the full PRD release

- Production/HTTPS setup awaits the existing approval cards for Clerk access/ownership and credential storage in the Vercel Hobby project. No approval has been inferred from silence.
- Physical iOS/Android install, notification permission states, background delivery and notification click behavior require evidence beyond local manifest/offline tests.
- Real terminal bays, directional boarding permissions, campus walking access, and official fare-matrix provenance remain unverified; current approximate catalog/tariffs are explicitly labeled. See `terminal-research.md`.
- The broader PRD still calls for moderation/admin roles, catalog review/audit history, data-retention jobs, richer service/dwell/run lifecycle and missed/expired-trip recovery, history deep links, earlier/late planner alternatives and additional preference controls. These are not made complete by the current six browser tests.
- Investigate the development SDK's session-refresh warnings under a production/staging origin; do not treat successful client rendering alone as a complete session-lifecycle audit.
- Failed-road-route retry now performs a real server re-fetch. Backend tests cover invalid routes, provider failure, per-route cooldown, global throttling, successful replacement, and the ready-cache shortcut. Physical map/GPS checks remain part of phone QA.

Keep this file aligned with implementation and verification. Do not mark the goal complete while any required functionality or release gate lacks evidence.
