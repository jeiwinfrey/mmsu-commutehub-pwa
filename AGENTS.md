<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


# Current assignment

The user explicitly expanded scope to a functional mobile PWA: Clerk Google sign-in, Convex persistence/authorization, working maps, planner/trips/community/alerts/profile, device notifications, and server-simulated vehicles. Original UI-only notes in member documents are historical. All vehicle operations and unverified fare/terminal data must be labeled honestly.

Use free tiers only. No subscriptions, trials, paid plans, or purchases. Never commit credentials, `.env.local`, `.clerk`, `.vercel`, authentication storage state, or test traces. Do not bypass required account approval or make Figma changes.

Read README.md, docs/design-guide.md, docs/architecture.md, the relevant feature ownership README/TODO, and [.agents/skills/commutehub-ui/SKILL.md](.agents/skills/commutehub-ui/SKILL.md). Keep feature screens in their owned folders and route pages thin. Reuse installed shadcn components. Solar icons, Motion with reduced-motion support, semantic tokens, 44px touch targets, maximum 480px phone shell, no shadows or gradients.

Verify lint, TypeScript, backend authorization tests, production build, and relevant browser flows. Browser integration tests target the development services using dedicated test accounts. Keep release blockers and incomplete device checks explicit in docs/implementation-status.md.
