# Code style

## Zero comments

No `//`, no `/* */`, no `/** */`, no JSDoc, no annotation banners, in any
`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, or `.cjs` file. `bun run audit` fails the build on one.

The comment you wanted to write is a rename or an extraction:

```ts
const t = Date.now() - s > 30000;

const hasExceededTurnDeadline = Date.now() - turnStartedAt > TURN_TIMEOUT_MS;
```

Markdown, JSON, and TOML are exempt — they are documentation and configuration.

## 300-line ceiling

Hard fail above 300. Warning at 250. When a file approaches the warning, split by
responsibility, never by line count:

- A screen grows, extract the data hook first, then the presentational subcomponents.
- A schema grows, one file per table group, re-exported from `schema.ts`.
- A worker grows, one file per processor under `processors/`.
- A store grows, one slice per concern, composed in the root store.

## Bun first, Node only as fallback

Everything that runs on Bun — `apps/director`, `apps/crew`, `packages/*`, `scripts/` —
uses the Bun native API. Reach for a `node:` builtin or an npm package **only** when Bun
has no equivalent. Verified against the pinned Bun runtime:

| Instead of | Use |
| --- | --- |
| `fs.readFile`, `fs.readFileSync` | `Bun.file(path).text()` / `.json()` / `.bytes()` |
| `fs.writeFile`, `fs.writeFileSync` | `Bun.write(path, data)` |
| `fs.existsSync` | `await Bun.file(path).exists()` |
| `glob`, `fast-glob`, hand-rolled `readdir` walkers | `new Bun.Glob(pattern).scanSync()` |
| `http.createServer`, `@hono/node-server` | `Bun.serve()` |
| `better-sqlite3`, `node:sqlite` | `bun:sqlite` (`drizzle-orm/bun-sqlite`) |
| `@aws-sdk/client-s3` | `Bun.S3Client` |
| `bcrypt`, `argon2` | `Bun.password.hash` / `.verify` |
| `crypto.createHash` | `new Bun.CryptoHasher(algorithm)` |
| `child_process.spawn`, `execa` | `Bun.spawn` / `Bun.$` |
| `dotenv` | Bun loads `.env` automatically |
| `jest`, `vitest` | `bun:test` |
| `node-fetch`, `axios` | global `fetch` |

Legitimate Node fallbacks, because Bun has no native replacement: `node:path`,
`node:os`, `node:url`, `node:stream`, `node:buffer`.

Two deliberate exceptions where an npm package wins:

- **`ioredis`** stays. BullMQ requires it as its connection; `Bun.redis` is not a
  drop-in for that contract.
- **`onnxruntime-node`** stays. Bun has no ONNX inference runtime.

`apps/stage` is exempt entirely. It runs on Hermes and the browser, not Bun. No `Bun.*`
global and no `bun:` import may appear anywhere under `apps/stage`.

## Types

- `strict` plus `noUncheckedIndexedAccess`. Never `any`. Use `unknown` and narrow.
- Every network and storage boundary parses through Zod. Inbound data is `unknown`
  until a schema has validated it.
- Derive types from schemas with `z.infer` rather than declaring them twice.
- Discriminated unions over optional-field soup. The WS protocol is one union keyed on `type`.
- Exported functions declare their return type.

## Functions

- Pure by default. Side effects live at the edges: route handlers, processors, hooks.
- One reason to change per module. A module that both computes and persists is two modules.
- No default exports except where a framework requires one (Expo Router screens).
- Early return over nested conditionals.

## Naming

- Files: `camelCase.ts` for logic, `PascalCase.tsx` for components.
- Booleans read as assertions: `isStreaming`, `hasPendingAudio`, `canRollBack`.
- Async functions that fetch are verbs: `loadWorlds`, `commitTurn`, `synthesizeSentence`.
- No abbreviations outside established domain terms (`dc`, `d20`, `dag`, `ws`).

## Errors

- Never swallow. Either handle it or propagate it with context attached.
- An empty `catch` is a bug. An empty `catch` with a comment explaining why is two bugs.
- Fail loudly at startup on invalid config. Fail gracefully at runtime on a dropped socket.
