# Architecture rules

General code style lives in `~/.claude/rules/code.md`. This file holds Chronicle only.

## Bun first

Use Bun native APIs. Node builtins and npm packages only where Bun has no equivalent.

- `Bun.file` / `Bun.write` / `Bun.Glob` / `Bun.serve` / `Bun.spawn` / `Bun.$`
- `bun:sqlite` via `drizzle-orm/bun-sqlite`, `Bun.S3Client`, `Bun.password`, `bun:test`
- `fetch` and `.env` are built in. No `axios`, no `dotenv`.
- Bun has no path or homedir API. Keep `node:path`, `node:os` (`homedir` only),
  `node:url`, `node:stream`, `node:buffer`. No `node:fs` — `Bun.write` creates parents.
- `process.platform` over `os.platform()`. `Bun.write` already creates parent directories.
- Keep `ioredis`. BullMQ requires it as its connection type.

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
| `expo` | `~57.0.24` | SDK boundary. Stay on stable, not the 58 beta |
| `react`, `react-dom`, `react-native` | the versions Expo SDK 57 requires | Expo will not boot on a mismatched React Native |
| `expo-*` modules | the versions Expo SDK 57 requires | Same |
| `react-native-css` | `3.1.0-rc.0` | exact peer of `nativewind@5.0.0-rc.0`; `latest` is 3.0.7 |
| `lightningcss` | `1.30.1` via root `overrides` | newer builds fail Metro with `failed to deserialize; expected an object-like struct named Specifier` |

Client versions come from `node_modules/expo/bundledNativeModules.json`, never from
`latest`. SDK 57 wants `react-native-gesture-handler@~2.32` while `latest` is 3.x, and
`@react-native-async-storage/async-storage@2.2` while `latest` is 3.x — both whole majors.

SDK 58 was evaluated on 2026-09-19 and rejected: it pins `react-native@0.88.0-rc.0`, but
the `react-native-reanimated@4.6.0` it ships declares `react-native: 0.83 - 0.87`. Revisit
once 58 and RN 0.88 are both stable.

`typescript` stays on `"latest"` (7.0.2, the Go-native compiler) deliberately. Fall back
to `^5` only if the compiler itself, rather than our code, fails a typecheck.

Everything else — `hono`, `drizzle-orm`, `better-auth`, `bullmq`, `ioredis`, `zod`,
`@lancedb/lancedb`, `three`, `zustand` — is `"latest"`.

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

Generated output is exempt and ignored by the auditor: `migrations/` with its drizzle
snapshots, and `*-env.d.ts` ambient type files. The ceiling governs code a human edits. Never hand-edit a generated file.

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

## External service contracts

- `LLM_ENDPOINT` — OpenAI-compatible `POST /v1/chat/completions`, SSE streaming.
- `DIFFUSION_ENDPOINT` — ComfyUI. `POST /prompt` with an API-format workflow and a
  `client_id`, poll `GET /history/{promptId}`, fetch bytes from `GET /view`. The
  SDXL-Lightning workflow template lives in `apps/crew/src/processors/diffusion/`.
- `TTS_ENDPOINT` — Kokoro-FastAPI, OpenAI-compatible `POST /v1/audio/speech`.
  No in-process ONNX. `onnxruntime-node` is not a dependency.
- Queue payloads are typed in `@chronicle/shared/jobs`. Director enqueues, crew consumes,
  neither redefines a shape.

## WebSocket authentication

The client obtains a session token over HTTPS, then connects to
`/api/v1/ws?token=...`. The director validates it with Better Auth before accepting the
upgrade and closes with 1008 on failure. Cookies are not used — React Native does not
send them on a WS upgrade. Never log the token.

## Configuration tiers

Tier rules are global, in `~/.claude/rules/config.md`. Chronicle places them as:

| Tier | Home | Examples |
| --- | --- | --- |
| Constants | `@chronicle/shared/rules` | `D20_SIDES`, `CRITICAL_SUCCESS`, rank bounds, cost curve |
| Environment | `@chronicle/config` | ports, `DATABASE_PATH`, `AUTH_SECRET`, the four endpoints |
| Runtime | `@chronicle/shared/settings` schema, stored by `@chronicle/db` | `image.*`, `tts.*`, `narrative.*`, `prompt.*`, `turn.*`, `dice.*` |

- Constants live in `shared` because `apps/stage` needs them and may not import `config`.
- Runtime settings are one row (`settings.id = "runtime"`) holding the whole nested object.
- `loadSettings()` caches; `updateSettings()` writes, updates the cache, and notifies.
  The director then publishes `SETTINGS_CHANNEL` so crew invalidates too.
- The admin surface is `GET/PATCH /api/v1/settings` and `POST /api/v1/settings/reset`.
- Job payloads carry resolved values. A processor never re-reads a default.

## Local AI services

Everything AI-related lives under `G:\AI`. Chronicle never reads these paths directly —
it only talks to the HTTP endpoints — but this is where the services are run from.

| Path | What |
| --- | --- |
| `G:\AI\MODELS` | Model weights. `Qwen3.5_9B\*.gguf` is the narrative LLM |
| `G:\AI\STABILITY_MATRIX\Data\Packages\ComfyUI` | ComfyUI, serves `DIFFUSION_ENDPOINT` |
| `G:\AI\STABILITY_MATRIX\Data\Models\StableDiffusion` | ComfyUI checkpoints |

Installed checkpoints:

| File | Kind | Steps | CFG | Sampler |
| --- | --- | --- | --- | --- |
| `DreamShaperXL_Lightning.safetensors` | Lightning, the default | 6 | 2 | `dpmpp_sde` / karras |
| `epicrealismXL_pureFix.safetensors` | full SDXL, photoreal | 26 | 7 | `dpmpp_2m` / karras |

Lightning settings on a full model produce mush, and full-model settings on Lightning
produce burnt output — the two rows are not interchangeable. Checkpoint, steps, cfg,
sampler and scheduler are all runtime settings (`image.*`), so switching models is a
settings change, never a code change.

`image.checkpoint` accepts either a bare filename or a path relative to ComfyUI's
checkpoints root, which `extra_model_paths.yaml` points at `Data/Models/StableDiffusion`.

`resolveCheckpoint` asks ComfyUI for its real list via
`GET /object_info/CheckpointLoaderSimple` and matches: exact path first, then
case-insensitive filename. An ambiguous filename across two subfolders is an error naming
both; a missing one is an error listing everything available. Never guess a fallback
checkpoint — a silently wrong model is worse than a failed job.

The value is validated in `checkpointSchema` before it ever leaves the API: backslashes
normalise to forward slashes, a leading slash is stripped, and absolute paths, `..`
traversal, and non-model extensions are rejected. It becomes a file path in another
process, so it is a trust boundary.

Kokoro-FastAPI is not installed yet, so `TTS_ENDPOINT` will fail until it is.

## Import aliases

`apps/*` use the `~/*` alias for their own `src`. `packages/*` use relative imports —
an alias defined in a package's tsconfig is not honoured when another workspace compiles
it, so `~/client` inside `packages/db` resolves against the *consuming* app and fails.

## Running the AI stack

`scripts\ai-servers.ps1 -Action start|stop|status [-WithEmbeddings]` launches everything
in Windows Terminal panes. It writes `.cmd` launchers to `%TEMP%\chronicle-ai` and runs
those, because a long `cmd /k "... && ..."` string mangles when passed through
`Start-Process -ArgumentList`.

Three Windows quirks it works around, all found the hard way:

- `NoDefaultCurrentDirectoryInExePath` is set on this machine, so `cd /d <dir>` followed
  by a bare `llama-server.exe` fails. Every command uses an absolute executable path.
  EIDOLON's own `START\*.bat` files have this latent bug.
- A space in a `wt` argument splits it. `--title 'Chronicle AI'` made Terminal read
  `Chronicle` as the title and `AI` as the first word of the command, shifting every
  later argument. Titles are single tokens.
- `Get-Content -Wait` does not reliably tail when given more than one path, so each
  service writes one merged log (`> log 2>&1` inside its `.cmd`) and each pane tails
  exactly one file.

`Get-NetTCPConnection` returns nothing without privileges here, so readiness is a real
`TcpClient` connect.

## Model behaviour

Qwen3.5 is a reasoning model: it fills `reasoning_content` and leaves `content` empty
until thinking ends, which starves a token stream and can burn the whole budget. Every
request sends `chat_template_kwargs: { enable_thinking: <narrative.thinking> }`, default
`false`. Turn it on only if the served model benefits and you accept no visible streaming.

`nomic-embed-text-v1.5` on port 8081 (`-WithEmbeddings`) serves 768-dimension embeddings
and is the intended replacement for the placeholder hash in `crew/processors/memory.ts`.

## Infrastructure facts

Dragonfly and RustFS run as Docker containers `eidolon-cache` and `eidolon-storage`.
Docker owns their lifecycle — `scripts/ai-servers.ps1` does not start, stop or list them.

- Dragonfly runs `--cluster_mode=emulated --lock_on_hashtags`, so every BullMQ key for a
  queue must hash to one slot. All queues use `prefix: QUEUE_PREFIX` = `{chronicle}`.
  Without the hash tag, BullMQ's Lua scripts fail with a cross-slot script error.
- BullMQ also rejects `:` in a queue name, so queues are `chronicle-diffusion` etc.
- RustFS credentials come from the container env (`RUSTFS_ACCESS_KEY` /
  `RUSTFS_SECRET_KEY`). The `chronicle-assets` bucket must exist before the first upload.
- ComfyUI's `SaveImage` writes PNG. Scenes are stored as `.png` with `image/png`.

## Prompt construction

Qwen's chat template raises `System message must be at the beginning`, so a request may
carry at most one system message and it must be first. `buildNarrativePrompt` merges the
instructions and the world context into a single system message.

Thinking is enabled only for `enhanced` mode and only when `narrative.thinking` is on.
The budget is enforced client-side: `max_tokens` is raised by `narrative.thinkingBudget`,
reasoning deltas are dropped from the stream, and if reasoning consumed everything and no
content arrived, the call is retried once with thinking off. `completeStructured` always
disables thinking — it needs JSON, not prose.

## Asset layout

Keys are entity-scoped so deleting an entity is a single prefix delete. SQL cascade does
not touch object storage, so this is the only layout where cleanup is not a manual join.

```
worlds/<worldId>/cover.png
worlds/<worldId>/characters/<characterId>/portrait.png
worlds/<worldId>/characters/<characterId>/turns/<turnId>/scene-<variant>.png
worlds/<worldId>/characters/<characterId>/turns/<turnId>/audio/<sentenceIndex>.mp3
```

Builders live in `@chronicle/shared/assets`. Never concatenate a key at a call site.

`REGENERATE` writes a new numbered variant (`scene-2.png`) rather than overwriting, so a
cached client never serves stale bytes and earlier renders stay comparable.

The bucket has a public-read policy on `s3:GetObject`. Stage renders images and plays
audio straight from the URL with no auth header, so objects must be readable anonymously.
Writes still require the RustFS credentials. Do not put anything private in this bucket.

## VRAM budget

Measured on a 16 GB card with everything resident — 9B Q6_K at 32K context with q8_0 KV,
nomic-embed, ComfyUI holding SDXL Lightning, and Kokoro: **11.9 GB of 16.3 GB**. Keep
`-ctk q8_0`. Dropping the K cache to q4_0 saves little and measurably hurts long-context
coherence, which is exactly what a story accumulating turn history depends on. If VRAM
ever gets tight, lower `-ctv` first — the value cache quantizes far more gracefully.

## Dev stack

Two scripts, two tabs in one Windows Terminal window named `Chronicle`.

| Command | Tab | Panes |
| --- | --- | --- |
| `bun ai` | `AI` | comfy full-height left; llm, embed, tts stacked right |
| `bun app` | `App` | director full-height left; crew, stage stacked right |

`bun ai` daemonises the model servers and the panes only tail their logs, so closing the
window leaves them running. `bun app` runs the apps *in* the panes because they are
watch-mode dev processes you interrupt with Ctrl+C.

Metro runs on **8082**, not its default 8081, because the embeddings server owns 8081.

Neither script touches Dragonfly or RustFS. Docker owns those.

Both scripts write a `.ps1` per pane and launch it with `pwsh -File`. Never pass a
command string to `wt` directly: `;` is Terminal's own command separator, so a
`Set-Location 'x'; bun run dev` argument splits into extra tabs. A space splits arguments
too, which is why window and tab titles are single tokens.

Each pane runs `bun run dev` and lets the app's own `package.json` own its flags, so the
launcher never duplicates an `--env-file` or a port.

`Get-CimInstance` and `Get-NetTCPConnection` both fail without privileges in this shell,
so readiness is a `TcpClient` connect and process cleanup goes through `netstat -ano`
plus `Get-Process`. Crew binds no port, so its status cannot be probed.

## Hermes and store gotchas

`three` is pinned to `0.180.0`. From `0.186.0` the CJS build is a deprecation shim that
calls `process.emitWarning`, which Hermes does not implement, so
`require("three")` throws `undefined is not a function` the moment
`@react-three/fiber/native` loads. Do not bump `three` without checking
`node_modules/three/build/three.cjs` for `emitWarning`.

A Zustand selector must never build a new object. `useThemeStore(selectResolvedTokens)`
returned a freshly merged token object on every call, so React saw a new snapshot each
render and looped until `Maximum update depth exceeded`. Select stored values
individually and combine them in `useMemo`.
