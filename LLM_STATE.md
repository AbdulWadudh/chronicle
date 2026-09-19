# LLM_STATE

Build progress tracker. Read this first. Update it at every wave gate, before the commit.

**Status:** Wave 1 complete. Awaiting go-ahead for Wave 2.
**Updated:** 2026-09-19

## Waves

| Wave | Scope | State |
| --- | --- | --- |
| 1 | Governance, root workspace, audit script | done |
| 2 | `@chronicle/config`, `@chronicle/shared`, `@chronicle/db` | next |
| 3 | `@chronicle/director`, `@chronicle/crew` | not started |
| 4 | `@chronicle/stage` | not started |

## Built

- Root: `package.json`, `turbo.json`, `bunfig.toml`, `tsconfig.base.json`, `biome.json`,
  `.gitattributes`, `.env.example`
- Governance: `CLAUDE.md`, `.claude/rules/{architecture,codestyle,ui-animations}.md`
- `scripts/audit.ts` — 300-line ceiling + zero-comment scan, exit 1 on violation

## Process

- Stop at each wave gate. Report, wait for the go-ahead, then commit. Never start the
  next wave unprompted.
- Surface spec conflicts as questions before writing the files they affect.
- Settled technical decisions live in `.claude/rules/`, not here. Raise a question
  rather than quietly changing one.

## Open

- `public/logo_x512.{png,webp}` exists at root, needs moving into `apps/stage` in Wave 4.
- Local infra (Dragonfly, RustFS, diffusion, TTS, LLM) unverified — nothing has been run
  against a live endpoint yet.

## Verify

```
bun run check
```
