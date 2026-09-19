# Code style

Zero comments, the 300-line ceiling, and feature-folder layout come from
`~/.claude/rules/code.md`. This file holds only what is specific to Chronicle.

## Enforcement

`bun run audit` fails the build on any comment in `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`,
`.cjs`, or any measured file over 300 lines. It warns at 250. Markdown, JSON, and TOML
may contain comments — they are documentation and configuration.

## Where to split

- A screen grows, extract the data hook first, then the presentational subcomponents.
- A schema grows, one file per table group, re-exported from `schema.ts`.
- A worker grows, one file per processor under `processors/`.
- A store grows, one slice per concern, composed in the root store.

## Bun first

Use Bun native APIs. Node builtins and npm packages only where Bun has no equivalent.

- `Bun.file` / `Bun.write` / `Bun.Glob` / `Bun.serve` / `Bun.spawn` / `Bun.$`
- `bun:sqlite` via `drizzle-orm/bun-sqlite`, `Bun.S3Client`, `Bun.password`, `bun:test`
- `fetch` and `.env` are built in. No `axios`, no `dotenv`.
- Fine to keep: `node:path`, `node:os`, `node:url`, `node:stream`, `node:buffer`.
- Keep `ioredis` (BullMQ needs it) and `onnxruntime-node` (no Bun ONNX runtime).

`apps/stage` is exempt. It runs on Hermes, no `Bun.*` or `bun:` imports there.

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
