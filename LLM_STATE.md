# LLM_STATE

Build progress tracker. Read this first. Update it at every wave gate, before the commit.

**Status:** Wave 3 complete. Awaiting go-ahead for Wave 4.
**Updated:** 2026-09-19

## Waves

| Wave | Scope | State |
| --- | --- | --- |
| 1 | Governance, root workspace, audit script | done |
| 2 | `@chronicle/config`, `@chronicle/shared`, `@chronicle/db` | done |
| 3 | `@chronicle/director`, `@chronicle/crew` | done |
| 4 | `@chronicle/stage` | next |

## Built

- Root: `package.json`, `turbo.json`, `bunfig.toml`, `tsconfig.base.json`, `biome.json`
- Governance: `CLAUDE.md`, `.claude/rules/{architecture,ui-animations}.md`
- `scripts/audit.ts` — line ceiling + zero-comment scan, ignores generated `migrations/`
- `packages/config` — `env.ts` (Zod, lazy + cached), `paths.ts` (OS data root, `ensureFile`)
- `packages/shared` — `types.ts`, `turns.ts`, `theme.ts`, `pointbuy.ts`, `protocol/`
- `packages/db` — `schema/{auth,world,narrative,settings}`, `client.ts` (bun:sqlite WAL),
  `auth.ts` (Better Auth at `/api/v1/auth`), `settings.ts`, migrations `0000`+`0001`
- `apps/director` — `app.ts`, `auth.ts`, `queue.ts`, `routes/{worlds,characters,turns,settings}`,
  `engine/{llm,prompt,adjudicator}`, `ws/{gateway,session,turnSession,buffer,loader,context}`
- `apps/crew` — `redis.ts`, `storage.ts` (Bun.S3Client),
  `processors/{diffusion/{client,workflow,index},tts,memory}`

## Verified

`bun run check` green: audit, Biome, and `turbo run typecheck` across 3 packages on
TypeScript 7.0.2. Database exercised against a real file — migrations apply, typed JSON
roundtrips, `createdAt` returns `Date`, UUIDv7 ids, unique sibling index and foreign keys
reject bad writes, cascade delete works, WAL confirmed. Point-buy curve and protocol
parsing checked against expected values.

## Process

- Stop at each wave gate. Report, wait for the go-ahead, then commit. Never start the
  next wave unprompted.
- Surface spec conflicts as questions before writing the files they affect.
- Settled technical decisions live in `.claude/rules/`, not here. Raise a question
  rather than quietly changing one.

## Open

- `public/logo_x512.{png,webp}` at root, move into `apps/stage` in Wave 4.
- `apps/stage` needs its own tsconfig `types` so the root `@types/bun` does not leak the
  `Bun` global into Hermes code.
- Nothing has run against live Dragonfly, RustFS, diffusion, TTS, or LLM endpoints.
- A world with few stats and a large `pointBudget` lets every stat be maxed. World
  authors must size the budget to the stat count.

## Verify

```
bun run check
```
