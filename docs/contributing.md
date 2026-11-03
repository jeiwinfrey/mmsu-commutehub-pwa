# Contributing

## Work locally

Use Node.js 20.9+ and npm. Run `npm ci`, then `npm run dev`; open http://localhost:3001. No secrets or accounts are required. Open your member TODO, ownership README, and design guide before editing. The Next.js version is pinned in package.json; consult its bundled documentation under `node_modules/next/dist/docs/` before applying unfamiliar APIs.

## Branch and ownership

Clone the published repository, pull the latest `main`, and create a feature branch. Use `ui/russel-auth`-style branches. Keep each PR focused on one member's feature and TODO. Do not edit another member's feature without agreement. Coordinate changes to navigation/layout, global CSS, shared types/fixtures, shadcn components, package.json, and package-lock.json. Never commit node_modules, .next, secrets, or personal configuration.

Keep pages thin. Use `@/` imports. Place local components inside your feature. Avoid global CSS selectors that restyle another member's work. Use shadcn's CLI and installed Radix composition; do not hand-copy component source from random examples. Commit generated component source and lockfile changes together.

## Before a PR

```sh
npm run lint
npm run typecheck
npm run build
```

Inspect the feature on 320/360/390/430 px widths and landscape. Check keyboard focus, overlay close/return, long text, empty/loading/error states, and sample-data labels. Refresh the direct URL. No horizontal overflow or controls hidden behind navigation. Add screenshots and concise manual reproduction steps to the PR. Do not write tests that merely assert placeholder text; add focused behavior tests later when interactions warrant them.

## Completion

Check off the member TODO with evidence. No external integration is part of any current assignment. UI controls may affect local preview state only, and must not imply a successful backend action. Leave PWA/auth/database implementation for a separately agreed phase.
