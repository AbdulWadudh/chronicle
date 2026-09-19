# Chronicle

Local-first interactive visual RPG. Turborepo + Bun workspaces, scope `@chronicle`.

Read `LLM_STATE.md` first — current progress and open items. Update it at every wave
gate, before the commit.

## Taxonomy

| Workspace | Package | Role |
| --- | --- | --- |
| `apps/stage` | `@chronicle/stage` | Vite + React 19 PWA client (browser) |
| `apps/director` | `@chronicle/director` | Bun + Hono HTTP/WSS gateway, auth, turn DAG, dice adjudicator |
| `apps/crew` | `@chronicle/crew` | BullMQ worker: diffusion, TTS, vector memory |
| `packages/config` | `@chronicle/config` | Zod-validated env + OS user-directory path resolution |
| `packages/db` | `@chronicle/db` | Drizzle SQLite schema, client, Better Auth wiring |
| `packages/shared` | `@chronicle/shared` | Domain types, turn DAG, WS protocol, theme tokens, point-buy |

## CLI

```
bun install
bun app              # director + crew + stage in one Windows Terminal tab
bun run --filter @chronicle/stage dev     # vite on 8082, proxies /api to the director
bun run --filter @chronicle/stage build   # dist/, which the director serves in prod
bun run --filter @chronicle/director dev
bun run --filter @chronicle/crew dev
bun run check        # audit + lint + typecheck across the graph
bun run audit        # line ceiling + zero-comment scan only
bun run lint         # biome check
bun run format       # biome check --write
turbo run typecheck
```

## Rules

General code style is global, in `~/.claude/rules/code.md`. Chronicle rules live in
`.claude/rules/`, one source of truth each. Never restate a rule — a second copy goes stale.

- `architecture.md` — Bun first, import boundaries, runtime split, storage, model access,
  dependencies, validation, where to split, audit enforcement
- `ui-animations.md` — Motion, CSS, CanvasKit, R3F, HTML audio, reduced motion

`bun run audit` enforces the 300-line ceiling and the zero-comment rule, and fails the build.

## Sub-agent delegation

| Agent | Owns |
| --- | --- |
| `architect-agent` | Root manifests, tsconfig, turbo.json, governance markdown |
| `db-agent` | Drizzle schema, Better Auth tables, migrations, LanceDB connections |
| `director-agent` | Hono routes, WebSocket engine, turn DAG state machine |
| `crew-agent` | BullMQ workers, diffusion client, ONNX TTS streamer, Pub/Sub |
| `stage-ui-agent` | React Router routes, theme engine, Zustand store, `AppModal`, `PaginatedList` |
| `stage-graphics-agent` | CanvasKit flowchart canvas, R3F D20 dice roller |
