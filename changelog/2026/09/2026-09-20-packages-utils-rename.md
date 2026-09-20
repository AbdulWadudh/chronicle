# packages/shared becomes packages/utils

**Date:** 2026-09-20
**Scope:** packages/config, packages/utils, packages/db

## What changed

`packages/shared` was renamed to `packages/utils` and its contents split by kind.

- `@chronicle/config` holds values: constants, theme token defaults, the runtime settings schema
  and the ten palette JSON documents, all at the bare entry so `apps/stage` can import them in a
  browser bundle. `/env` and `/paths` stay Bun-only behind separate entries.
- `@chronicle/utils` holds the functions that operate on those values — `mergeThemeTokens`,
  `mergeRuntimeSettings`, the turn DAG, the WS protocol, point-buy, asset key builders and the
  palette assembly in `presets/index.ts`.
- `packages/db` gains `themes.ts` and an extended `accounts.ts`.

## Why

"Shared" describes where a module sits, not what it is, and the package had drifted into holding
both data and behaviour. The split makes the import rule enforceable: a tunable value lives in
`config`, the logic that touches it lives in `utils`, and `config` still imports nothing from the
workspace.

The browser constraint forced the issue. `apps/stage` must never pull in `node:*`, so the
palette documents and token defaults had to be reachable without dragging in the environment
loader.

## Evidence

- `bunx turbo run typecheck` green across all six packages after the rename.
- `bun run audit` passes the 300-line ceiling and the zero-comment scan.

## Follow-ups

- None. The rename is complete; no `@chronicle/shared` references remain.
