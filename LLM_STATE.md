# LLM_STATE

Build progress tracker. Read this first. Update it at every wave gate, before the commit.

**Status:** Wave 7E (image identity and world art direction) complete and verified live against
ComfyUI. Characters carry a stored look, worlds carry an art bible, a shot size and a render
style, and PuLID holds faces across scenes. Waves 7B-7D still have the open items listed below.
**Updated:** 2026-09-22

## Waves

| Wave | Scope | State |
| --- | --- | --- |
| 1 | Governance, root workspace, audit script | done |
| 2 | `@chronicle/config`, `@chronicle/shared`, `@chronicle/db` | done |
| 3 | `@chronicle/director`, `@chronicle/crew` | done |
| 4a | `@chronicle/stage` foundation: theme, hooks, DRY components, screens | done |
| 4b | Skia flowchart, R3F dice, NarrativeStream, ChoicePills, Director console, settings UI | done |
| 5 | `@chronicle/stage` rewritten as a Vite + React 19 PWA; director serves the build | done |
| 6 | Theme studio, saved themes, role-based admin, Base UI primitive layer | done |
| 7A | World and character authoring, per-field compose, pronouns, generated cover and portrait | done |
| 7B | Playable turn: choices, dice ordering, state fold, Director's Console | choices, whisper and the dice overlay done; dice ordering and state fold open |
| 7C | Immersive delivery: per-sentence audio, scene skeletons, REGENERATE, degraded paths | audio persistence, REGENERATE, live render progress and the painting state done; Cinema Mode gating open |
| 7D | Memory and progression: branching, checkpoints, nomic-embed recall | planned |
| 7E | Image identity, world art direction, render styles, world and portrait editing | done |

## Wave 7E

- `characters.appearance`, `outfit`, `outfitLocked`, `draftPortraitUrl`; `worlds.visualStyle`,
  `shotSize`, `artStyle`. Migrations `0006`-`0011`.
- `engine/appearance.ts` and `engine/worldStyle.ts` draft a look and an art bible once from the
  backstory and the world description, through structured sub-fields so clothing cannot land in
  the appearance field. Each part is capped separately — capping the joined string dropped the
  hair and face fields and cost a day of swapped-gender renders.
- `engine/prompt.ts` split into `prompt/{narrative,scene}.ts`.
- `RENDER_STYLES` (photoreal, anime, painterly, comic, render3d) drive the medium, the style tail,
  the negative and, through `image.stylisedCheckpoint`, the model.
- PuLID face locking: masked per subject, protagonist applied last, and a separate
  `image.identityCastWeight` (0.35) for two-portrait scenes. At the single-subject weight the
  last-applied identity imposes its gender on both figures.
- Portrait regeneration and upload write to a draft slot; saving the character promotes it.
- World editing (`PATCH /api/v1/worlds/:id`), cover regeneration with a composable prompt, and
  an `Imagery` section in Story settings.
- `useTopLayer` portals Select, Tooltip and AlertDialog into the nearest `<dialog>`; Base UI
  portals to `document.body`, which sits under a `showModal()` top layer.

### Open

- Shot size is a prompt lever, not a guarantee. A scene description implying a wide view beats
  the framing token.
- Images are stored as lossless PNG at 2-3 MB. `SaveImageAdvanced` offers AVIF with a CRF knob
  and is accepted by the API; no size comparison measured yet.
- `promotePortrait` overwrites the portrait key, so the previous committed portrait is lost.

## Wave 6

- `packages/shared` renamed to `packages/utils`; values moved to `@chronicle/config`
- Ten palette JSON documents, seeded at director startup, assembled in `utils/presets`
- `/api/v1/themes` CRUD and `/api/v1/account` for display name and avatar
- `components/ui`: dialog, alert-dialog, tooltip, menu, avatar, editable-number; segmented on
  Base UI radio, select on Base UI combobox
- Motion levels (`data-motion`) and scrollbar style (`data-scrollbar`) as device settings
- `.claude/rules/theming.md` and the `changelog/` directory

### Open

- `bun --watch` does not reload an app when only a workspace package changes. Touch the app's
  `src/index.ts` or the fix will look dead.
- `SUBMIT_ACTION` carries no `directorWhisper`, so the composer's whisper card sets a direction
  the director never receives. Closing it is a two-line additive field on the client schema and
  is **waiting on approval** — the WS protocol shape is gated.
- Narration still streams while the die tumbles; the dice-first ordering is unbuilt.
- `loader.ts` still passes `world.initialState`; the state fold is unbuilt.

- Profile screen for name, password and avatar — endpoints exist, UI does not
- Saved themes have no owner column; per-user themes need a migration
- `/admin/queues`, `/admin/storage`, `/admin/worlds`, `/admin/audit` still marked Soon
- `overlayVignette` token is emitted and editable but unread

## Built

- Root: `package.json`, `turbo.json`, `bunfig.toml`, `tsconfig.base.json`, `biome.json`
- Governance: `CLAUDE.md`, `.claude/rules/{architecture,ui-animations}.md`
- `scripts/audit.ts` — line ceiling + zero-comment scan, ignores generated `migrations/`
- `packages/config` — `env.ts` (Zod, lazy + cached), `paths.ts` (OS data root, `ensureFile`)
- `packages/shared` — `types.ts`, `turns.ts`, `theme.ts`, `pointbuy.ts`, `protocol/`
- `packages/db` — `schema/{auth,world,narrative,settings}`, `client.ts` (bun:sqlite WAL),
  `auth.ts` (Better Auth at `/api/v1/auth`), `settings.ts`, migrations `0000`-`0004`
- `apps/director` — `app.ts`, `auth.ts`, `queue.ts`, `routes/{worlds,characters,turns,settings}`,
  `engine/{llm,prompt,adjudicator}`, `ws/{gateway,session,turnSession,buffer,loader,context}`
- `apps/crew` — `redis.ts`, `storage.ts` (Bun.S3Client),
  `processors/{diffusion/{client,workflow,index},tts,memory}`
- `packages/shared/api.ts` — single home for `/api/v1`, WS path, default director port
- `apps/stage` — Vite 8 + React 19 + Tailwind v4, `index.html`, `vite.config.ts`,
  `src/main.tsx`, `theme/{store,tokens,ThemeEngine}`,
  `hooks/{useGameSocket,useAudioQueue,useTurnStream,useResponsiveLayout,useReducedMotion,useCharacterSheet}`,
  `lib/{api,auth,session}`,
  `components/common/{Screen,Bezel,Button,Field,NumberField,AppModal,EmptyState,Spinner,PageHeader,GlowBackdrop,PaginatedList,usePaginatedData}`,
  `components/story/*`, `components/canvas/{flowchart,dice}`,
  `components/character/PointBuyStepper`, routes `index`, `SignIn`, `Worlds`,
  `CharacterSelect`, `Play`, `Settings`

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

- ~~The D20 roller has not been seen rendering.~~ Caught on screen 2026-09-20 on
  `echo-voice · DC 12`, showing 11. It renders, but narration streams underneath it.
- ~~`choices_json` is `[]` on every turn.~~ Fixed. `engine/choices.ts` drafts three labelled
  choices with hints per turn; `SELECT_CHOICE` plays the stored label. Measured 2026-09-20:
  3 choices on a 4.3 s turn.
- ~~`audio_urls_json` is `[]`.~~ Fixed. `recordSentenceAudio` in `director/src/assets.ts`
  writes each clip as it lands. **Kokoro-FastAPI is installed and healthy** on 8880 — verified
  2026-09-20, a 47,660-byte mp3 in 1.52 s.
- `DirectorConsoleModal` now receives real `statDefinitions` and `stats`. `affinities` is
  still `{}` — the world state that holds them is not exposed by any GET route. Closing it
  needs a director change, not a client one.
- ~~No screen can create a world.~~ Fixed in 7A.
- Booleans in runtime settings render as a free-text input (`thinking` shows `true`).
  They should be a switch.
- Placeholder embedding in `crew/processors/memory.ts` — a character-frequency hash, not a
  real model. Note the dimension mismatch: the table is 384-wide and nomic-embed serves
  768, so the swap is a table rebuild, not a function swap.
- A world with few stats and a large `pointBudget` lets every stat be maxed. World
  authors must size the budget to the stat count.
- No service worker, so no offline cache and no install prompt over plain LAN HTTP. Both
  need a secure context.

## Verify

```
bun run check                                  # audit + lint + typecheck
cd apps/director && bun run dev                # needs .env at repo root and Dragonfly up
bun run --filter @chronicle/stage build        # proves the bundle, writes apps/stage/dist
```

Apps load env with `bun --env-file=../../.env` — Bun only auto-loads `.env` from the cwd,
and `.env` lives at the repo root.

Verified live on 2026-09-19: sign-up and sign-in return a bearer token, protected routes
401 without it and 200 with it, world creation persists, point-buy rejects undeclared and
missing stats, the community filter returns only public worlds, settings PATCH applies per
field and rejects out-of-range and traversal values, reset restores defaults, and the WS
upgrade rejects missing and bogus tokens.

## Wave 5 — the Vite client

Verified in a real browser on 2026-09-19 at 390x844 and 1440x900: sign-in empty, filled
and error; the worlds list empty and filled; character creation through the native
`<dialog>` with point-buy; the play screen empty, then a full turn streamed from the live
LLM with the transcript following the stream; the story map with labelled, connected
nodes; the director console with real stats; runtime settings loaded and editable.

Three real bugs were found by rendering it, all fixed:

- `useGameSocket` — a superseded socket's late `onclose` nulled `socketRef`, so the header
  read "Live" while every action was silently dropped. Nothing streamed and nothing
  errored. Handlers now guard on still being the current socket, and a failed send sets
  `lastError`.
- `usePaginatedData` — an `inFlight` boolean deadlocked under StrictMode's double mount, so
  every list rendered its empty state forever. The guard is now controller identity.
- `PaginatedList` rendered a bare line of text for empty and for error, which is the
  "empty screen with a void below it" failure. Both now use `EmptyState`, and an error
  reads as an error rather than as emptiness.

Bundle: 126 kB gzipped entry. CanvasKit (7.3 MB wasm) and `three` are separate lazy
chunks, fetched only by the story map and the dice roller.

The director serves `STAGE_DIST` after the API routes, with an `index.html` fallback for
client routes, a JSON 404 for `/api/*`, and a path-traversal guard on the static handler.
