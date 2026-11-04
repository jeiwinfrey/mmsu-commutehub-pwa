# Free development service setup

Use free tiers only. No subscription, trial, paid plan, or purchase is authorized.

1. Run `npm ci`. Configure an independent Convex project with `npx convex dev`. This writes development URLs to ignored `.env.local`.
2. Set up Clerk development authentication. `npx clerk init --framework next` can provision development credentials. Claiming or production setup requires the account owner's approved permissions. Do not overwrite existing app files blindly.
3. Enable Google sign-in in Clerk. Add a JWT template named `convex`, audience `convex`, with name/email/picture claims if desired. Set the Clerk issuer domain in `convex/auth.config.ts`.
4. Run `npx convex dev --once` to push functions, then `npx convex run vehicles:seedPaths '{}'` once to populate OSRM road geometry. The cron initializes and advances the simulated fleet.
5. Generate a VAPID key pair locally using `web-push`. Put only the public key in `NEXT_PUBLIC_VAPID_PUBLIC_KEY`. Set `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` in Convex deployment environment variables. Never commit private keys.
6. Run `npm run dev`. Authentication, reports, plans, and trips need the configured network services. Optional GPS requires a secure context; localhost is supported for development.
7. For HTTPS hosting, configure the same public URLs and server-only Clerk secret in the host's environment settings. Production Clerk requires its own production keys and Google OAuth configuration; development keys are not a production launch.

## Verification

`npm run test:backend` tests isolated Convex functions with fake test identities. `npm run test:e2e` uses a dedicated Clerk development test account (`commutehub-qa+clerk_test@example.com`) against the configured real development deployment. Clerk's official testing helper creates a temporary sign-in token; it is never included in application code or committed. Tests remove application records only for the two dedicated QA accounts after each run; their Clerk test identities remain reusable. A third, explicitly disposable account (`commutehub-delete-qa+clerk_test@example.com`) is created and permanently deleted to verify the real account-deletion flow.

To test a production build locally: `npm run build`, `npm run start -- --port 3002`, then `E2E_BASE_URL=http://localhost:3002 npm run test:e2e`. Never target production accounts with these tests.

## External resources

- [Clerk + Convex](https://docs.convex.dev/auth/clerk)
- [Convex testing](https://docs.convex.dev/testing/convex-test)
- [Clerk Playwright testing](https://clerk.com/docs/guides/development/testing/playwright/overview)
- [OpenStreetMap tile policy](https://operations.osmfoundation.org/policies/tiles/)

Public OSRM/OSM services have no application-specific SLA. Do not prefetch maps, cache tiles offline, or repeatedly reseed routes. Use an appropriately licensed provider or self-hosted routing for higher volume after separate approval.

## This workspace’s approved deployment

The owner approved Clerk CLI access for `jeiwinfreyulep12@gmail.com` in “Jeiwinfrey’s Organization,” plus storage of this app’s development Clerk secret/configuration in the Vercel Hobby project `mmsu-commutehub-pwa` under `jeiwinfrey’s projects`. Do not ask for the same approval again. Browser use currently reports disabled in Work settings; finish authorization and deployment when that capability is restored. No paid plan or trial is authorized.
