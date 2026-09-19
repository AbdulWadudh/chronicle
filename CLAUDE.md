# Chronicle

Local-first interactive visual RPG. Turborepo + Bun workspaces, scope `@chronicle`.

Read `LLM_STATE.md` first — current progress and open items. Update it at every wave
gate, before the commit.

## Taxonomy

| Workspace | Package | Role |
| --- | --- | --- |
| `apps/stage` | `@chronicle/stage` | Universal Expo client (iOS / Android / Web) |
| `apps/director` | `@chronicle/director` | Bun + Hono HTTP/WSS gateway, auth, turn DAG, dice adjudicator |
| `apps/crew` | `@chronicle/crew` | BullMQ worker: diffusion, TTS, vector memory |
| `packages/config` | `@chronicle/config` | Zod-validated env + OS user-directory path resolution |
| `packages/db` | `@chronicle/db` | Drizzle SQLite schema, client, Better Auth wiring |
| `packages/shared` | `@chronicle/shared` | Domain types, turn DAG, WS protocol, theme tokens, point-buy |

## CLI

```
bun install
bun run --filter @chronicle/stage dev
bun run --filter @chronicle/director dev
bun run --filter @chronicle/crew dev
bun run check        # audit + lint + typecheck across the graph
bun run audit        # line ceiling + zero-comment scan only
bun run lint         # biome check
bun run format       # biome check --write
turbo run typecheck
```

## Rules

Every rule lives in exactly one file under `.claude/rules/`, auto-loaded each session.
Never restate one elsewhere — a second copy is a copy that will go stale.

- `architecture.md` — import boundaries, runtime split, storage paths, model access, dependencies
- `codestyle.md` — zero comments, 300-line ceiling, file layout, Bun first, types, errors
- `ui-animations.md` — Reanimated worklets, Skia, R3F, expo-audio, reduced motion

`bun run audit` enforces the 300-line ceiling and the zero-comment rule, and fails the build.

## Sub-agent delegation

| Agent | Owns |
| --- | --- |
| `architect-agent` | Root manifests, tsconfig, turbo.json, governance markdown |
| `db-agent` | Drizzle schema, Better Auth tables, migrations, LanceDB connections |
| `director-agent` | Hono routes, WebSocket engine, turn DAG state machine |
| `crew-agent` | BullMQ workers, diffusion client, ONNX TTS streamer, Pub/Sub |
| `stage-ui-agent` | Expo Router, theme engine, Zustand store, `AppModal`, `PaginatedList` |
| `stage-graphics-agent` | Skia flowchart canvas, R3F D20 dice roller |
