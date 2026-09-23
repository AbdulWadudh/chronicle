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

`apps/stage` is exempt. It is a browser bundle: no `Bun.*`, `bun:` or `node:` imports there.

## Import boundaries

```
apps/stage    ─┐
apps/director ─┼─> packages/utils -> packages/config
apps/crew     ─┘
                    packages/db -> packages/config, packages/utils
```

- An app **never** imports another app. Not by relative path, not by package name.
- `packages/config` imports nothing from the workspace. It is the leaf: constants, config
  data and palette JSON at `@chronicle/config`; the Zod-validated environment loader at
  `@chronicle/config/env`; OS user-directory path resolution at `@chronicle/config/paths`.
  The `/env` and `/paths` entries touch `node:*` and `Bun.*` and are Bun/Node-only.
- `packages/utils` may import `@chronicle/config` (the main entry only, never `/env` or
  `/paths`) for the data its functions operate on. It holds the functions themselves —
  `mergeThemeTokens`, `mergeRuntimeSettings`, the turn DAG, the WS protocol, point-buy —
  so a value that is tunable lives in `config`, and the logic that touches it lives here.
- `packages/db` may import `packages/config` (all three entries) and `packages/utils`.
- `apps/stage` imports `packages/utils` and the main `@chronicle/config` entry only. It
  must never pull in `packages/db`, `@chronicle/config/env`, `@chronicle/config/paths`,
  `drizzle-orm`, `bullmq`, or `ioredis` — those carry Node built-ins that do not exist in
  a browser.

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
| `react`, `react-dom` | `19.2.8` | the only release satisfying both `react-router@8` (`>=19.2.7`) and `@react-three/fiber@9` (`<19.3`) |
| `@types/react`, `@types/react-dom` | `~19.2.0` | track the runtime pin |

`typescript` stays on `"latest"` (7.0.2, the Go-native compiler) deliberately. Fall back
to `^5` only if the compiler itself, rather than our code, fails a typecheck.

Everything else — `vite`, `tailwindcss`, `react-router`, `motion`, `gsap`,
`canvaskit-wasm`, `three`, `@hugeicons/react`, `@hugeicons/core-free-icons`,
`zustand`, `hono`, `drizzle-orm`,
`better-auth`, `bullmq`, `ioredis`, `zod`, `@lancedb/lancedb` — is `"latest"`.

Before bumping `react`, check the peer ranges of `react-router` and `@react-three/fiber`
together. They are the constraint, and they move in opposite directions.

`@aws-sdk/client-s3` is **not** a dependency. Object storage goes through `Bun.S3Client`,
per the Bun-first rule above.

Expo, React Native, NativeWind and Reanimated were removed on 2026-09-19. Do not
reintroduce one to solve a styling or animation problem — see the client sections below.

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
- `/api/v1/admin/*` — operator surface, owner only
- `/api/v1/ws` — WebSocket upgrade
- `/health` — unversioned liveness
- everything else — the built client from `STAGE_DIST`, falling back to `index.html` so
  a deep client route survives a reload. `/api/*` returns a JSON 404 before that
  fallback, so a mistyped endpoint never answers with the app shell.

## External service contracts

- `LLM_ENDPOINT` — OpenAI-compatible `POST /v1/chat/completions`, SSE streaming.
- `DIFFUSION_ENDPOINT` — ComfyUI. `POST /prompt` with an API-format workflow and a
  `client_id`, poll `GET /history/{promptId}`, fetch bytes from `GET /view`. The
  SDXL-Lightning workflow template lives in `apps/crew/src/processors/diffusion/`.
- `TTS_ENDPOINT` — Kokoro-FastAPI, OpenAI-compatible `POST /v1/audio/speech`.
  No in-process ONNX. `onnxruntime-node` is not a dependency.
- Queue payloads are typed in `@chronicle/utils` (`jobs.ts`); the queue names themselves
  (`QUEUE_DIFFUSION`, `QUEUE_PREFIX`, ...) are constants in `@chronicle/config`. Director
  enqueues, crew consumes, neither redefines a shape.
- `diffusionJobSchema` is a discriminated union on `kind`: `scene`, `cover`, `portrait`.
  Authoring jobs carry a lower `JOB_PRIORITY` so they never stall an in-play scene on the
  concurrency-1 queue.
- Crew never writes SQLite. A finished render is published to `ASSET_CHANNEL` and the
  director's `startAssetWriter` performs the write, keeping the single-writer rule intact.

## WebSocket authentication

The client obtains a session token over HTTPS, then connects to
`/api/v1/ws?token=...`. The director validates it with Better Auth before accepting the
upgrade and closes with 1008 on failure. Cookies are not used — React Native does not
send them on a WS upgrade. Never log the token.

## Admin access

Roles, not a single owner. `users.role` is `"user" | "admin"`, guarded by `requireAdmin`
in `apps/director/src/auth.ts`, which checks `roleOf(userId)` and 403s anyone who is not
an admin. The first account ever created is promoted automatically at startup
(`promoteFirstAccount` in `packages/db/src/accounts.ts`) if no admin exists yet.
`setRole` refuses to demote the last remaining admin — promote a replacement first.

Client screens sit behind `AdminScreen`, which calls `GET /api/v1/admin` once and shows a
locked state on 403. That is cosmetic; the guard on the director is the real gate.

## Configuration tiers

Tier rules are global, in `~/.claude/rules/config.md`. Chronicle places them as:

| Tier | Home | Examples |
| --- | --- | --- |
| Constants | `@chronicle/config` | `DICE`, `STATS`, `API` routes, theme defaults, queue names |
| Environment | `@chronicle/config/env`, `@chronicle/config/paths` | ports, `DATABASE_PATH`, `STAGE_DIST`, `AUTH_SECRET`, the four endpoints |
| Runtime | `@chronicle/config` schema (`runtimeSettingsSchema`), merged in `@chronicle/utils`, stored by `@chronicle/db` | `image.*`, `tts.*`, `narrative.*`, `prompt.*`, `turn.*`, `dice.*` |

- Constants and runtime-settings schemas are plain data, so they live at the main
  `@chronicle/config` entry, importable by `apps/stage`. The environment loader touches
  `process.env`, `node:os` and `Bun.file`, so it is Bun/Node-only and lives behind the
  separate `/env` and `/paths` entries that `apps/stage` never imports.
- A function that operates on that data (`mergeThemeTokens`, `mergeRuntimeSettings`, the
  palette-assembly in `presets/index.ts`) lives in `@chronicle/utils`, not `config` —
  `config` holds values, `utils` holds the logic that touches them.
- Runtime settings are one row (`settings.id = "runtime"`) holding the whole nested object.
- `loadSettings()` caches; `updateSettings()` writes, updates the cache, and notifies.
  The director then publishes `SETTINGS_CHANNEL` so crew invalidates too.
- The admin surface is `GET/PATCH /api/v1/settings` and `POST /api/v1/settings/reset`,
  also mounted under `/api/v1/admin/settings` behind the owner guard.
- Job payloads carry resolved values. A processor never re-reads a default.

## Local AI services

Everything AI-related lives under `G:\AI`. Chronicle never reads these paths directly —
it only talks to the HTTP endpoints — but this is where the services are run from.

| Path | What |
| --- | --- |
| `G:\AI\MODELS` | Model weights. `Qwen3.5_9B\*.gguf` is the narrative LLM |
| `G:\AI\EIDOLON\COMFY_UI` | ComfyUI, serves `DIFFUSION_ENDPOINT`, launched by `scripts\ai-servers.ps1` |
| `G:\AI\EIDOLON\COMFY_UI\ComfyUI\models\checkpoints` | ComfyUI checkpoints |

Stability Matrix (`G:\AI\STABILITY_MATRIX`) is a separate, unused ComfyUI install — its
model tree is not on the `DIFFUSION_ENDPOINT` path. An earlier version of this file named
it as the server; confirmed wrong on 2026-09-21 against `scripts/ai-servers.ps1`, which
launches `G:\AI\EIDOLON\COMFY_UI` on port 8188.

Installed checkpoints, confirmed against `GET /object_info/CheckpointLoaderSimple`
on 2026-09-20. Both are Lightning; no full-step SDXL checkpoint is installed.

| File | Kind | Steps | CFG | Sampler |
| --- | --- | --- | --- | --- |
| `RealVisXL_V5.0_Lightning_fp16.safetensors` | Lightning, **the default** | 8 | 2 | `dpmpp_sde` / karras |
| `DreamShaperXL_Lightning.safetensors` | Lightning, stylised | 6 | 2 | `dpmpp_sde` / karras |

RealVis holds faces, hands and skin far better than DreamShaper and is the default for
that reason. `epicrealismXL_pureFix` is **not** installed — an earlier version of this
file claimed it was. Never name a checkpoint here without asking ComfyUI first.

Lightning settings on a full model produce mush, and full-model settings on Lightning
produce burnt output — the rows are not interchangeable. Checkpoint, steps, cfg,
sampler and scheduler are all runtime settings (`image.*`), so switching models is a
settings change, never a code change.

`image.upscale` adds a hires pass: the base latent is upscaled by that multiple and run
through a second `KSampler` at `image.upscaleDenoise`. At 1.5 it is the difference
between a soft 1024 and a sharp 1536. Measured 2026-09-20 on the 16 GB card: 1536x1536 in
**21 s**, 3.19 MB, no OOM with the LLM resident. `1` turns the pass off.

`image.checkpoint` accepts either a bare filename or a path relative to ComfyUI's
checkpoints root. `G:\AI\EIDOLON\COMFY_UI` carries no `extra_model_paths.yaml`, so that
root is its own `ComfyUI\models\checkpoints`, not a Stability Matrix path.

`resolveCheckpoint` asks ComfyUI for its real list via
`GET /object_info/CheckpointLoaderSimple` and matches: exact path first, then
case-insensitive filename. An ambiguous filename across two subfolders is an error naming
both; a missing one is an error listing everything available. Never guess a fallback
checkpoint — a silently wrong model is worse than a failed job.

The value is validated in `checkpointSchema` before it ever leaves the API: backslashes
normalise to forward slashes, a leading slash is stripped, and absolute paths, `..`
traversal, and non-model extensions are rejected. It becomes a file path in another
process, so it is a trust boundary.

Kokoro-FastAPI serves `TTS_ENDPOINT` on 8880. Verified 2026-09-20: `/health` returns healthy and
`/v1/audio/speech` returns mp3.

## Import aliases

`apps/*` use the `~/*` alias for their own `src`; in `apps/stage` it is declared twice,
in `tsconfig.json` for the typechecker and in `vite.config.ts` for the bundler, and the
two must agree. `packages/*` use relative imports —
an alias defined in a package's tsconfig is not honoured when another workspace compiles
it, so `~/db` inside `packages/db` resolves against the *consuming* app and fails.

## Running the AI stack

`scripts\ai-servers.ps1 -Action start|stop|status` launches everything
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

`nomic-embed-text-v1.5` on port 8081 serves the 768-dimension embeddings behind vector
memory (`EMBED_ENDPOINT`). Texts carry nomic's `search_document:` / `search_query:` prefixes.

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

Builders live in `@chronicle/utils` (`assets.ts`). Never concatenate a key at a call site.

`REGENERATE` writes a new numbered variant (`scene-2.png`) rather than overwriting, so a
cached client never serves stale bytes and earlier renders stay comparable.

The bucket has a public-read policy on `s3:GetObject`. Stage renders images and plays
audio straight from the URL with no auth header, so objects must be readable anonymously.
Writes still require the RustFS credentials. Do not put anything private in this bucket.

## VRAM budget

Kokoro runs CPU-only (`USE_GPU=false` in `scripts/ai-servers.ps1`) as of 2026-09-21, so
only the LLM, nomic-embed, and ComfyUI share the card. The last full measurement
(**11.9 GB of 16.3 GB**, 2026-09-20) included Kokoro on GPU and is stale — re-measure
before relying on a specific headroom number. Keep `-ctk q8_0`. Dropping the K cache to
q4_0 saves little and measurably hurts long-context coherence, which is exactly what a
story accumulating turn history depends on. If VRAM ever gets tight, lower `-ctv` first —
the value cache quantizes far more gracefully.

## Dev stack

Two scripts, two tabs in one Windows Terminal window named `Chronicle`.

| Command | Tab | Panes |
| --- | --- | --- |
| `bun ai` | `AI` | comfy full-height left; llm, embed, tts stacked right |
| `bun app` | `App` | director full-height left; crew, stage stacked right |

`bun ai` daemonises the model servers and the panes only tail their logs, so closing the
window leaves them running. `bun app` runs the apps *in* the panes because they are
watch-mode dev processes you interrupt with Ctrl+C.

Vite runs on **8082**, not its default 5173, because the embeddings server owns 8081 and
8082 is what the scripts already probe. It proxies `/api` (with `ws: true`) and `/health`
to the director, so the client is same origin in dev exactly as it is in production.
`bun app:clear` adds `--force` to re-optimise dependencies.

Vite binds `localhost`. Probing `127.0.0.1:8082` with curl fails while the browser
succeeds — use `localhost` or you will chase a proxy bug that is not there.

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

## Client platform notes

`apps/stage` is a Vite + React 19 single-page app, served by the director in production
and by the Vite dev server behind a proxy in development. Distribution is a browser tab
or an installed PWA. There is no native build.

PWA install and service workers need a secure context. Over plain LAN HTTP to the
director there is neither, which is why `public/manifest.webmanifest` ships but no
service worker does. Add one when there is HTTPS, not before.

`lib/session.ts` keeps the bearer token in `localStorage` — XSS-readable, accepted
because this is a local-first single-user surface. Never move a secret there.

CanvasKit is loaded lazily, only by the story map, through
`canvaskit-wasm/bin/canvaskit.wasm?url`. Nothing else may import it: the wasm is 7 MB and
blocking the first paint on it is the bug that broke every screen under the old client.
The glow backdrop is a CSS `radial-gradient`, not Skia, for the same reason.

The story map draws its nodes and edges with CanvasKit but renders **labels as DOM**, in
an overlay that carries the same `translate`/`scale` transform. Canvas text needs a
bundled TTF that no dependency ships, and it is invisible to a screen reader. Keep labels
in the overlay.

## Icons

HugeIcons, never lucide. One renderer, `<HugeiconsIcon icon={...} />`, taking icon *data*
from `@hugeicons/core-free-icons` — not a component per icon. A prop that accepts an icon
is typed `IconSvgElement`, and call sites pass the bare export.

Verify a name exists in `node_modules/@hugeicons/core-free-icons/dist/types` before using
it. The names do not match lucide's and a wrong guess typechecks, then renders nothing.

## Client gotchas

Each of these cost a debugging session. They are live, not historical.

`StrictMode` double-invokes every effect in development. Any hook that creates a
connection, a request or a timer must guard its callbacks on *still being the current
one*, not merely on a boolean:

- `useGameSocket` — a superseded socket's late `onclose` used to null `socketRef`, so the
  UI showed "Live" while every send silently dropped. Compare against `socketRef.current`
  in `onopen`, `onmessage`, `onerror` and `onclose`.
- `usePaginatedData` — an `inFlight` boolean made the second mount return early while the
  first was already aborted, so lists loaded nothing and reported no error. Compare
  against `controllerRef.current`.

A failed `send` must surface. `useGameSocket.send` sets `lastError` when the socket is
not open, for everything except `PING`.

A Zustand selector must never build a new object. `useThemeStore(selectResolvedTokens)`
returned a freshly merged token object on every call, so React saw a new snapshot each
render and looped until `Maximum update depth exceeded`. Select stored values
individually and combine them in `useMemo`.

Changing a component's hook count while the dev server is live leaves HMR in a broken
state that reports a phantom hook-order error. Hard reload before believing it.
