# Architecture rules

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
per the Bun-first rule in `.claude/rules/codestyle.md`.
