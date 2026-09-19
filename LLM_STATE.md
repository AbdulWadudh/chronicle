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

## Locked decisions

Do not re-litigate these. Raise a question if one needs to change.

- Deps are `"latest"` except the Expo SDK 57 client surface and `nativewind@5.0.0-rc.0`.
  `^5.0.0` resolves to nothing — v5 is prerelease-only.
- `typescript@latest` is 7.0.2 (Go-native). Deliberate. Fall back to `^5` only if the
  compiler, not our code, fails a typecheck.
- `LLM_ENDPOINT` is OpenAI-compatible `/v1/chat/completions` + SSE. Structured output via
  JSON schema, not GBNF, so llama.cpp / vLLM / Ollama are interchangeable.
- Biome replaces Prettier. Bun native APIs over Node.
- `@aws-sdk/client-s3` dropped for `Bun.S3Client`. SQLite is `bun:sqlite` via
  `drizzle-orm/bun-sqlite`. `ioredis` and `onnxruntime-node` stay.
- Commit at each wave gate. Do not start the next wave unprompted.

## Open

- `public/logo_x512.{png,webp}` exists at root, needs moving into `apps/stage` in Wave 4.
- Local infra (Dragonfly, RustFS, diffusion, TTS, LLM) unverified — nothing has been run
  against a live endpoint yet.

## Verify

```
bun run check
```
