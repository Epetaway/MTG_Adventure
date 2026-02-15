# Character Commander

Lore-consistent custom Commander progression with a rules engine, deck validator, and table tracker.

## Monorepo Layout
- apps/web: Next.js PWA client
- apps/api: Express API
- packages/shared: shared types and schemas
- packages/rules-engine: rules validation logic

## Quick Start
1. Install dependencies: `pnpm install`
2. Run API: `pnpm --filter @cc/api dev`
3. Run web: `pnpm --filter @cc/web dev`

## Environment
Copy `.env.example` to `.env` in `apps/api` and update values.
