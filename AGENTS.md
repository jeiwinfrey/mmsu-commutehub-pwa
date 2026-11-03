<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


# Team milestone rules

Current work is UI-only. Read README.md, docs/design-guide.md, docs/architecture.md, and the relevant member TODO before changing a feature. Keep all 11 features separately owned. No PWA infrastructure, auth, Convex, SDKs, backend, permissions, persistent storage, or live simulation without a new explicit assignment. The full PRD is future scope; current TODOs take precedence for this milestone.

Use shadcn/ui via its CLI, semantic theme tokens, accessible native controls, and local state for previews. Keep route pages thin and feature components in their assigned folder. Coordinate shared contract/navigation/theme/dependency changes. Run lint, typecheck, and production build. Label every mock action and sample dataset honestly.


# Project UI skill

For CommuteHub screen implementation, visual refinement, or UI review, read [.agents/skills/commutehub-ui/SKILL.md](.agents/skills/commutehub-ui/SKILL.md). It applies the shared design guide and shadcn conventions within the current assignment scope. Later explicit user instructions take precedence over the UI-only milestone.
