# Chronicle

Local-first interactive visual RPG. Turborepo + Bun workspaces, scope `@chronicle`.

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

## Non-negotiable rules

1. **300-line ceiling.** No file exceeds 300 lines. At 250 lines, decompose into
   submodules, hooks, atomic components, or schema fragments before continuing.
   `bun run audit` enforces this and fails the build.
2. **Zero comments.** No `//`, `/* */`, or `/** */` anywhere in `.ts`, `.tsx`,
   `.js`, `.jsx`, `.mjs`, `.cjs`. Names, types, and control flow carry the meaning.
   `bun run audit` enforces this and fails the build.
3. **Apps never import apps.** All cross-cutting code lives in `packages/*`.
4. **Bun first.** Use Bun native APIs on the server and in scripts; Node or npm only
   where Bun has no equivalent. `apps/stage` is exempt (Hermes).
5. **`expo-av` is banned.** Audio is `expo-audio` only.
6. **Dependency policy.** Everything resolves to `"latest"` except the Expo client
   surface, which is pinned to the versions Expo SDK 57 requires, and `nativewind`,
   pinned to the published v5 release candidate. See `.claude/rules/architecture.md`.

## Protocol before each task wave

Inventory available skills, MCP servers, and tools first. If one covers the task,
use it. If nothing covers it, prefer an established idiom over a bespoke solution.

## Sub-agent delegation

| Agent | Owns |
| --- | --- |
| `architect-agent` | Root manifests, tsconfig, turbo.json, governance markdown |
| `db-agent` | Drizzle schema, Better Auth tables, migrations, LanceDB connections |
| `director-agent` | Hono routes, WebSocket engine, turn DAG state machine |
| `crew-agent` | BullMQ workers, diffusion client, ONNX TTS streamer, Pub/Sub |
| `stage-ui-agent` | Expo Router, theme engine, Zustand store, `AppModal`, `PaginatedList` |
| `stage-graphics-agent` | Skia flowchart canvas, R3F D20 dice roller |
