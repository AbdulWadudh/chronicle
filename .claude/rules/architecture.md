# Architecture rules

General code style lives in `~/.claude/rules/code.md`. This file holds Chronicle only.

## Bun first

Use Bun native APIs. Node builtins and npm packages only where Bun has no equivalent.

- `Bun.file` / `Bun.write` / `Bun.Glob` / `Bun.serve` / `Bun.spawn` / `Bun.$`
- `bun:sqlite` via `drizzle-orm/bun-sqlite`, `Bun.S3Client`, `Bun.password`, `bun:test`
- `fetch` and `.env` are built in. No `axios`, no `dotenv`.
- Bun has no path, mkdir, or homedir API. Keep `node:path`, `node:os` (`homedir` only),
  `node:fs` (`mkdirSync` only), `node:url`, `node:stream`, `node:buffer`.
- `process.platform` over `os.platform()`. `Bun.write` already creates parent directories.
- Keep `ioredis` (BullMQ needs it) and `onnxruntime-node` (no Bun ONNX runtime).

`apps/stage` is exempt. It runs on Hermes, no `Bun.*` or `bun:` imports there.

## Import boundaries

```
apps/stage    ─┐
apps/director ─┼─> packages/shared
apps/crew     ─┘    packages/config
                    packages/db
```

- An app **never** imports another app. Not by relative path, not by package name.
- `packages/shared` imports nothing from the workspace. It is the leaf.
- `packages/config` may import `packages/shared` types only.
- `packages/db` may import `packages/config` and `packages/shared`.
- `apps/stage` imports `packages/shared` only. It must never pull in `packages/db`,
  `packages/config`, `drizzle-orm`, `bullmq`, or `ioredis` — those carry Node built-ins
  that break the Metro bundler.

## Runtime split

| Concern | Home | Why |
| --- | --- | --- |
| Auth, session, turn commit | `director` | Single writer to SQLite |
| Dice adjudication | `director` | Server-authoritative; the client never decides an outcome |
| Prompt assembly | `director` | Keeps model contracts out of the client bundle |
| GPU diffusion, CPU TTS, embeddings | `crew` | Long-running, queue-backed, restartable |
| Rendering, gestures, audio playback | `stage` | Never blocks on network for a frame |

`director` and `crew` communicate only through Dragonfly: BullMQ queues for work,
Pub/Sub channels (`stream:audio:<turnId>`) for progress. Neither calls the other over HTTP.

## Storage locations

Nothing persistent lives inside the repository.

- SQLite: `%APPDATA%/chronicle/data.db` on Windows, `~/.local/share/chronicle/data.db` on POSIX.
- LanceDB: the sibling `vectors/` directory under the same root.
- Generated images and audio: the S3 bucket at `STORAGE_ENDPOINT`.

`packages/config` resolves these and creates parent directories. No other package
computes a path.

## Model access

`LLM_ENDPOINT` is OpenAI-compatible (`POST /v1/chat/completions`, SSE streaming).
Structured output uses `response_format: { type: "json_schema" }` rather than raw GBNF,
so the endpoint can be llama.cpp, vLLM, Ollama, or LM Studio interchangeably.

## Dependency policy

All manifests use `"latest"` with these exceptions, which exist because `"latest"`
provably breaks the build:

| Package | Pin | Reason |
| --- | --- | --- |
| `nativewind` | `5.0.0-rc.0` | `^5.0.0` matches nothing; v5 is prerelease-only |
| `expo` | `~57.0.0` | SDK boundary |
| `react`, `react-dom`, `react-native` | the versions Expo SDK 57 requires | Expo will not boot on a mismatched React Native |
| `expo-*` modules | the versions Expo SDK 57 requires | Same |

`typescript` stays on `"latest"` (7.0.2, the Go-native compiler) deliberately. Fall back
to `^5` only if the compiler itself, rather than our code, fails a typecheck.

Everything else — `hono`, `drizzle-orm`, `better-auth`, `bullmq`, `ioredis`, `zod`,
`@lancedb/lancedb`, `onnxruntime-node`, `three`, `zustand` — is `"latest"`.

`@aws-sdk/client-s3` is **not** a dependency. Object storage goes through `Bun.S3Client`,
per the Bun-first rule above.

## Validation

- Every network and storage boundary parses through Zod. Inbound data is `unknown` until
  a schema has validated it. Derive types with `z.infer`, never declare them twice.
- The WS protocol is one discriminated union keyed on `type`.
- Domain abbreviations are fine: `dc`, `d20`, `dag`, `ws`. Nothing else.

## Where to split

- A screen grows, extract the data hook first, then the presentational subcomponents.
- A schema grows, one file per table group, re-exported from `schema.ts`.
- A worker grows, one file per processor under `processors/`.
- A store grows, one slice per concern, composed in the root store.

## Enforcement

`bun run audit` fails the build on any comment in `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`,
`.cjs`, or any measured file over 300 lines. It warns at 250. Markdown, JSON, and TOML
may contain comments — they are documentation and configuration.

Generated output is exempt and ignored by the auditor: `migrations/` and its drizzle
snapshots. The ceiling governs code a human edits. Never hand-edit a generated file.

## Data model decisions

- IDs are `Bun.randomUUIDv7()` text primary keys. Time-sortable, so DAG walks and
  recency lists get index locality without a separate sort column.
- Timestamps are `integer({ mode: "timestamp_ms" })`. Drizzle returns `Date`.
- Every `*Json` column is `text({ mode: "json" }).$type<T>()`. Never `JSON.parse` a
  column at a call site.
- `worlds` and `characters` carry `userId`. `worlds` also carries
  `visibility: "private" | "public"` — the Community Browser filters on it.
- Stats are per-world. `worlds.statDefinitionsJson` declares them and
  `worlds.pointBudget` sets the point-buy budget (default 20).
  `characters.statsJson` is `Record<statId, rank>`.
- Point-buy: rank 1 is free, cumulative cost per stat is `[0, 1, 2, 4, 6]`, max rank 5.
- Migrations are `drizzle-kit generate` SQL committed to `packages/db/migrations`,
  applied at director startup. A user's existing database upgrades deterministically.

## Protocol decisions

- Every message carries `v: 1`. Every client message carries `msgId`; the director
  echoes it on the matching response and on `ERROR`.
- `PING` / `PONG` heartbeat detects dead sockets.
- `RESUME_TURN { turnId, fromSentenceIndex }` replays a dropped stream. The director
  buffers an in-flight turn until commit.

## API surface

Path versioning rules are global, in `~/.claude/rules/api.md`. Chronicle mounts:

- `/api/v1/auth/*` — Better Auth, `basePath: "/api/v1/auth"`
- `/api/v1/*` — REST routes
- `/api/v1/ws` — WebSocket upgrade
- `/health` — unversioned liveness
