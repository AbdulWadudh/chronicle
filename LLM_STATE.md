# LLM_STATE

Build progress tracker. Read this first. Update it at every wave gate, before the commit.

**Status:** All waves complete. Play screen verified in a real browser at mobile and
desktop, empty through filled, with live LLM and diffusion.
**Updated:** 2026-09-19

## Waves

| Wave | Scope | State |
| --- | --- | --- |
| 1 | Governance, root workspace, audit script | done |
| 2 | `@chronicle/config`, `@chronicle/shared`, `@chronicle/db` | done |
| 3 | `@chronicle/director`, `@chronicle/crew` | done |
| 4a | `@chronicle/stage` foundation: theme, hooks, DRY components, screens | done |
| 4b | Skia flowchart, R3F dice, NarrativeStream, ChoicePills, Director console, settings UI | done |

## Built

- Root: `package.json`, `turbo.json`, `bunfig.toml`, `tsconfig.base.json`, `biome.json`
- Governance: `CLAUDE.md`, `.claude/rules/{architecture,ui-animations}.md`
- `scripts/audit.ts` — line ceiling + zero-comment scan, ignores generated `migrations/`
- `packages/config` — `env.ts` (Zod, lazy + cached), `paths.ts` (OS data root, `ensureFile`)
- `packages/shared` — `types.ts`, `turns.ts`, `theme.ts`, `pointbuy.ts`, `protocol/`
- `packages/db` — `schema/{auth,world,narrative,settings}`, `client.ts` (bun:sqlite WAL),
  `auth.ts` (Better Auth at `/api/v1/auth`), `settings.ts`, migrations `0000`+`0001`
- `apps/director` — `app.ts`, `auth.ts`, `queue.ts`, `routes/{worlds,characters,turns,settings}`,
  `engine/{llm,prompt,adjudicator}`, `ws/{gateway,session,turnSession,buffer,loader,context}`
- `apps/crew` — `redis.ts`, `storage.ts` (Bun.S3Client),
  `processors/{diffusion/{client,workflow,index},tts,memory}`
- `packages/shared/api.ts` — single home for `/api/v1`, WS path, default director port
- `apps/stage` — Expo SDK 57, NativeWind v5 rc, `theme/{store,tokens,ThemeEngine}`,
  `hooks/{useGameSocket,useAudioQueue,useTurnStream,useResponsiveLayout}`,
  `lib/{api,auth,session}`, `components/common/{AppModal,PaginatedList,usePaginatedData}`,
  `components/character/PointBuyStepper`, routes `_layout`, `(auth)/sign-in`, `index`,
  `character-select`, `play/[id]`, `settings`

## Verified

`bun run check` green: audit, Biome, and `turbo run typecheck` across 3 packages on
TypeScript 7.0.2. Database exercised against a real file — migrations apply, typed JSON
roundtrips, `createdAt` returns `Date`, UUIDv7 ids, unique sibling index and foreign keys
reject bad writes, cascade delete works, WAL confirmed. Point-buy curve and protocol
parsing checked against expected values.

## Process

- Stop at each wave gate. Report, wait for the go-ahead, then commit. Never start the
  next wave unprompted.
- Surface spec conflicts as questions before writing the files they affect.
- Settled technical decisions live in `.claude/rules/`, not here. Raise a question
  rather than quietly changing one.

## Fixed during play-screen UI verification (2026-09-19)

- Skia never loaded on web — `CanvasKit is not defined` killed every screen using
  `GlowBackdrop`. Added `apps/stage/index.web.ts` calling `LoadSkiaWeb` with an absolute
  `locateFile`, plus a root `postinstall` that copies `canvaskit.wasm` into
  `apps/stage/public`. The wasm is gitignored; `bun install` regenerates it.
- Session token on web lived in an in-memory `Map`, so every reload signed you out and
  every deep link bounced to `/sign-in`. Now AsyncStorage on web, SecureStore on native.
- Crew published `stream:image:*` and `stream:audio:*` to Dragonfly but nothing consumed
  them, so the scene panel and Cinema Mode audio were permanently empty. Added
  `director/ws/media.ts` — one psubscribe relaying to the socket that owns the turn.
- The transcript never loaded history. Opening a story showed "Your story has not begun"
  regardless of committed turns. `useTurnStream` now seeds from
  `GET /api/v1/turns?characterId=`, and that route returns `TurnNode` via a new
  `toTurnNode` in `@chronicle/db` that `commitTurn` also uses.
- `RESOLVE_DICE` was sent by the client and handled by nobody, so every dice check
  produced an `Unhandled message RESOLVE_DICE.` error banner. Nothing gated on the ack —
  the director resolves the roll itself — so the message is gone from the protocol.
- The transcript did not follow the stream. Added `useFollowScroll`; the scroll is
  non-animated because an animated one fires `onScroll` at intermediate offsets and
  unpins itself.
- `apps/director` and `apps/crew` had no `dev` script, though `CLAUDE.md` and
  `scripts/app-servers.ps1` both call one. Added, with `--watch`.
- Disabled primary buttons were gold at reduced opacity, which reads as a dirty enabled
  button. Disabled now swaps to a neutral surface with muted label.
- `GlowBackdrop` sat inside `Screen`'s padded max-width box, so the "full-bleed" glow was
  a clipped rectangle. It moved into `Screen` behind the content, and was toned down.

## Open

- Story map tab renders unlabelled, unconnected nodes: no turn text, no edges, no
  success/failure treatment, clipped at the bottom. The Skia canvas draws, the design does
  not. Needs `stage-graphics-agent`.
- The D20 roller has not been seen rendering. Dice checks resolve and persist
  (`dice_check_json` is populated), but the roller clears on settle and was never caught
  on screen.
- `choices_json` is `[]` on every turn, so the composer never shows choice pills.
- TTS produces nothing — `audio_urls_json` is `[]`. Kokoro-FastAPI is not installed.
- `index.tsx`, `character-select.tsx`, `settings.tsx` still use the pre-redesign flat
  treatment. Only `(auth)/sign-in` and `play/[id]` have the new primitives.
- `DirectorConsoleModal` is wired with empty `statDefinitions`, `stats`, `affinities`.
- Placeholder embedding in `crew/processors/memory.ts` — a character-frequency hash, not a
  real model. Storage and recall work; retrieval quality will be poor until replaced.
- Nothing has been run on an Android device or emulator. Web is verified; native is not.
- Revisit Expo SDK 58 once it and React Native 0.88 are both stable.
- A world with few stats and a large `pointBudget` lets every stat be maxed. World
  authors must size the budget to the stat count.

## Verify

```
bun run check                                  # audit + lint + typecheck
cd apps/director && bun run dev                # needs .env at repo root and Dragonfly up
cd apps/stage && bunx expo export --platform web --output-dir /tmp/x   # proves the bundle
```

Apps load env with `bun --env-file=../../.env` — Bun only auto-loads `.env` from the cwd,
and `.env` lives at the repo root.

Verified live on 2026-09-19: sign-up and sign-in return a bearer token, protected routes
401 without it and 200 with it, world creation persists, point-buy rejects undeclared and
missing stats, the community filter returns only public worlds, settings PATCH applies per
field and rejects out-of-range and traversal values, reset restores defaults, and the WS
upgrade rejects missing and bogus tokens. The stage web bundle emits 11KB of generated
Tailwind CSS with the theme variables wired.
