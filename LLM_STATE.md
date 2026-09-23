# LLM_STATE

Build progress tracker. Read this first. Update it at every wave gate, before the commit.

**Status:** Wave 7F (WebP assets, TanStack Query, authoring UI) complete. Wave 7E (image identity
and world art direction) complete and verified live against ComfyUI. Characters carry a stored look, worlds carry an art bible, a shot size and a render
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
| 7F | WebP assets, TanStack Query, grouped authoring forms | done |
| 8 | Narrator prompt, voices, character personality, opt-in ensemble | waves 1-3 done, verified live |
| 9 | Vector memory: real embeddings, rolling summaries, recall in prompts | built, verified live 2026-09-24 |

## Wave 9 — Vector memory (decisions locked 2026-09-24)

Decided at the gate: LanceDB connection lives in `packages/db` (crew writes, director reads);
the summariser is a **separate crew job**, not folded into the plan call; the embed server is
part of the default `bun ai` stack (the `-WithEmbeddings` switch is gone).

### Built

- `EMBED_ENDPOINT` (default `http://127.0.0.1:8081/v1`), nomic-embed-text-v1.5, 768 dims,
  `search_document:` / `search_query:` prefixes in one place (`packages/db/src/memory/embed.ts`).
- `packages/db/src/memory/store.ts`: one row per turn (`Player: …
Narrator: …`), keyed by
  `turnId`. A table with the wrong vector width is dropped on open — the old 384-dim hash table
  was garbage. A rewritten turn replaces its own row.
- Recall (`engine/recall.ts`) runs once per turn in `runTurn`, embeds the player action, and
  searches only the current ancestry minus the last `prompt.historyDepth` turns — branch-safe,
  never repeats what the history block already carries. Results are re-sorted into story order
  and rendered as "Earlier in this story…" in both the solo and ensemble system context. The
  embed server being down logs a warning and the turn narrates without memory.
- Summariser: every `memory.summaryEvery` turns the director enqueues the previous summary plus
  the window of turns; crew calls the LLM with a JSON schema and publishes `MEMORY_CHANNEL`;
  `startMemoryWriter` merges `summary` + `factsAdded` into that turn's `stateDiffJson`. The
  fold in `loader.ts` then carries it forward, so `describeState` finally has a live summary.
- The summary can arrive before the turn row is committed (it did, on the first live run). It is
  buffered and merged at commit exactly like early sentence audio.
- `memory` runtime settings group (`recallDepth` 0–8 default 3, `summaryEvery` 1–10 default 3)
  with an admin card; `SETTING_BOUNDS` now carries `ensemble` and `memory`, which the admin
  sliders read. `prompt.recentFacts` blurb corrected — it was never vector memory.
- `bun run --filter @chronicle/director backfill` enqueues one memory job per existing turn.
  Ran once: 145 turns embedded.
- Crew has its own 40-line structured LLM client (`apps/crew/src/llm.ts`); apps cannot import
  the director's.

### Verified live (Kaelen Thorne, 63 → 65 turns)

- Direct recall for "corrosion data from the aqueduct" returned three episodes from beyond the
  last eight turns, in story order.
- A played turn logged `recalled 3 of 56 older turns`; the next turn's `state_diff_json`
  gained a 600-character summary and four facts. Vector rows 145 → 147.
- Memory admin card at 390 and 1440: labels, hints, units and ranges render; sliders save.

### Open

- Summary quality is the 9B model's: the first one invented "the couple's love" from the world
  opening. Tune `MEMORY.summariser` before trusting facts as canon.
- Regenerating a turn re-embeds it but never re-summarises; the previous summary stands until
  the next window.
- Elara is still in Kaelen's `cast_json` from the earlier presence bug and answered a question
  addressed to Nia. Clearing it is a one-row update, waiting on a yes.
- Backfill is manual. A story played before this wave on another machine has no episodes until
  someone runs it.

## Wave 8 — Ensemble (decisions locked 2026-09-22, Wave 0 gate)

Narrator/voice/personality settings plus an opt-in multi-character system. Built as an
**additive sibling** to the single-character path, never a rewrite of it.

### Locked

- **Presence** — `turns.castJson` (`{ present: string[] }`, nullable). Not a join table: presence
  is read once by the loader and the DAG branches, so a world-level roster would desync on
  `SWITCH_BRANCH`. Entered/exited are derived by diffing the parent turn.
- **Generation** — one streaming call, line-prefixed attribution (`Name: text`; a bare line is
  narrator), parsed incrementally so `NARRATIVE_CHUNK` is untouched. Structured JSON would kill
  the token stream; one call per speaker costs N× TTFT on a single llama.cpp slot and makes
  characters talk past each other. Format drift degrades to narrator-only, i.e. today.
- **Attribution** — split per line, strip the prefix, then sentence-split within the line, so the
  global `sentenceIndex` stays monotonic and `useAudioQueue` / `RESUME_TURN` are unchanged.
  `speakerId` (nullable, default null) added to `SENTENCE_AUDIO_READY` and `ttsJobSchema`.
  **Protocol stays `v: 1`** — additive optional field, and `RESUME_TURN` replays from an in-memory
  buffer so no stored payload carries the old shape.
- **Voices** — per character. `worlds.narratorVoiceId`, `characters.voiceId` (null = narrator).
  `GET /api/v1/voices` proxies Kokoro's live list, cached per process, validated at write time —
  same contract as `resolveCheckpoint`, never a hardcoded list. If a stored voice has vanished at
  enqueue time the director falls back to the narrator voice and emits `ERROR`; failing the job
  would stall the whole turn's audio queue.
- **Image subjects** — hard cap of 2 (`IMAGERY.scene.maxSubjects`). Protagonist plus the single
  most-involved other, ties broken by who spoke first. The rest of the present cast is absent from
  the prompt entirely. This is the measured PuLID ceiling, not a new limit.
- **Turn-taking** — director-owned, one pure function in `packages/utils/src/ensemble/`.
  `@mention` always speaks; then fill to `ensemble.maxSpeakers` weighted by `characters.eagerness`
  and a recency penalty, gated by `ensemble.speakChance`. Eagerness 0 never speaks unprompted.
- **Presence transitions** — `presentAfter: string[]` added to the existing `PLAN_SCHEMA`, so they
  come from the structured call that already runs. No extra round trip, no parsing risk.
- Character `likes` / `dislikes` / `responseStyle` feed **both** paths, guarded on non-empty, so a
  blank character yields today's exact prompt. `eagerness` is ensemble-only by nature.
- `directorWhisper` on `SUBMIT_ACTION` folded in (closes the Wave 6 open item).

### Separation and revert

`prompts.ts` takes zero edits. All ensemble text, bounds and the settings schema live in
`packages/config/src/ensemble.ts`; `settings.ts` gains 3 lines (it sits at 245, one under the
audit warn). `buildEnsemblePrompt` is a sibling of `buildNarrativePrompt`, selected by one ternary
in `turnSession.ts` on `world.ensembleEnabled && settings.ensemble.enabled`. The solo path never
imports the ensemble module.

Reverting is 3 file deletions plus ~6 line-edits. The schema columns can stay: unread, their
defaults *are* the old behaviour, so there is no down-migration.

Sole exception granted: `buildNarrativePrompt` gains one additive line for the world's narrator
system prompt, which is a world setting independent of the toggle.

### Wave 1 built and verified

Migration `0013` applied to the real database: 14 migrations, row counts unchanged
(3 worlds / 10 characters / 134 turns), every new column defaulted, `ensemble_enabled = 0`
on all existing worlds. `bun run check` green across six workspaces. Verified in a browser
at 390x844 signed in as the owner.

- `packages/config/src/ensemble.ts` — `ENSEMBLE` prompts, `ENSEMBLE_BOUNDS`,
  `ensembleSettingsSchema`. `prompts.ts` untouched. `settings.ts` +3 lines, now 248.
- `worlds.narratorPrompt` / `narratorVoiceId` / `ensembleEnabled`;
  `characters.likes` / `dislikes` / `responseStyle` / `eagerness` / `voiceId`; `turns.castJson`.
  Every default reproduces current behaviour.
- `worldState.bonds` and `statePatch.bondDeltas`, reduced and clamped in `applyStatePatch`.
  The **existing `affinities` map was never written by anything** — `commitTurn` stores
  `stateDiffJson: null` and the Director Console is fed a hardcoded `{}`. Bonds inherit that
  gap; Wave 3 gives both a producer.
- `GET /api/v1/voices` proxies Kokoro's live list (74 voices, graded), cached per process.
  `voiceRejection` validates at write time on both world and character routes, so an
  uninstalled id cannot be stored.
- `routes/characters.ts` (280 lines) split to `routes/characters/{index,schemas}.ts` at 203/67.
- Client: `useVoices`, `VoiceSelect`, `WorldNarrationFields`, `PersonaFields`. Eagerness is a
  0-100 slider with a plain-language blurb per band.
- `buildNarrativePrompt` gained exactly two additive lines: the world narrator prompt, and
  `describePersona` on the protagonist and interacting-character lines. Confirmed against the
  real rows: one leading system message, persona present for a filled character and absent for
  a blank one.
- Voices render as friendly names with locale/gender groups, a quality grade and a hover
  preview (`GET /api/v1/voices/:id/preview`, 51 KB `audio/mpeg`; an unknown id 400s by name).
  Narrator prompt and all three persona fields carry the generate/enhance pair, on four new
  compose targets. `engine/compose.ts` (276 lines) split to `engine/compose/{index,targets}.ts`.

### Wave 2 built

`engine/prompt/ensemble.ts` — `buildEnsemblePrompt` and `buildEnsembleChoicePrompt`, siblings of
the solo builders, importing nothing from them but `buildHistory`, `describeState`,
`describeStats` and `describePersona`. `packages/utils/src/ensemble/bonds.ts` holds `bondKey`,
`bondBand` and `describeBonds`.

Measured with llama.cpp `/tokenize` against real rows, `n_ctx` 32768:

| Prompt | Tokens |
| --- | --- |
| solo, before Wave 1 | 535 |
| solo, after (persona + narrator prompt) | 605 |
| ensemble, 4 characters, 3 present, 2 speaking | 1118 |

The ensemble prompt costs **3.4% of the window**. History at `historyDepth` 12 is the dominant
cost in a long game, not the cast.

Verified against the live endpoint:

- Attribution format was followed exactly — `Corvin Ashgrave: ...` per line, narration
  unattributed, both named speakers spoke in the given order and the silent one stayed silent.
- Personas separated the voices. `Barely speaks. One clause, then waits.` produced
  "Three souls. Two memories. One hour of breath." `Warm and circling. Tells a story instead of
  answering.` produced a circling anecdote that also hit her recorded dislike.
- The solo path reads no worse: the "after" narration honoured the narrator instruction and
  stayed in register.

### Wave 3 built and verified

Runtime is live. Verified in the browser on **The Fracture Between Us** (toggle on, 3 characters):
an action with **no @mention** produced attributed dialogue from two characters, narration first.

```
The resonance in the room shifts; the panic in Nia's posture fractures into a cold, sharp focus...

Nia Solace: Wrong about the strut? I calculated the microfractures three times before we even stood here.
Kaelen Thorne: She's right, Voss. But my original model was based on pre-corrosion data.
```

`audio_urls_json` carried the right ids (`0,1` Kaelen / `2,3` Nia), `cast_json` recorded presence,
and `state_diff_json` persisted resolved `fromId>toId` bond keys.

- `packages/utils/src/ensemble/` — `pickSpeakers`, `parseAttributedLines`, bond helpers. Pure,
  with `ensemble.test.ts` (10 tests) as the check.
- `ws/narration.ts` holds the shared streaming primitives so `turnSession` (solo) and
  `ensembleTurn` sit beside each other with no import cycle. `runTurn` branches on one line and
  falls back to solo whenever the ensemble yields no speakers.
- `loader.ts` now **folds `stateDiff` across the ancestry** and maps `castJson`. Without the fold
  bonds were computed and discarded every turn. Existing turns hold `stateDiff: null`, so the
  fold is the identity for every pre-existing game.
- Scene subjects capped by `IMAGERY.scene.maxSubjects` (2), preferring whoever actually spoke.
- `useTurnStream.ts` hit 301 lines; `mergeSentenceAudio` extracted to bring it back under.

### Three bugs found only by running it

- **`speakChance` gated the first speaker**, so ~40% of ensemble turns silently fell back to solo.
  It now gates only speakers *after* the first: someone always speaks when the room is occupied.
- **The model wrote narration and stopped.** The length rule said "then stop", and the replayed
  ancestry is all narration-only assistant turns, so it pattern-matched. The speaking order now
  lives in the **final user message**, closest to generation, and says so explicitly.
- **`bondDeltas` came back with emotional phrases, not names** (`"panicked and disjointed"` →
  `"sharp and aligned"`), so every entry was silently filtered and no bond ever moved. Fixed by
  constraining `from`/`to` with a JSON-schema `enum` of the real cast names, which llama.cpp
  enforces as grammar. Prompt wording alone did not fix this; two attempts failed before probing
  the raw output.

### @mention fix

Reported as "@mentioning is not working". Selecting from the composer menu always worked; the
break was everything else.

- `SELECT_CHOICE` calls `startTurn` with **no `mentionedCharacterIds` at all**, and the ensemble
  choice rule tells the model to name a character in at least one option. So every choice-driven
  turn — the normal way to play — reached `chooseCast` with zero mentions.
- `chooseCast` read only `mentionedCharacterIds`. The solo path's `resolveInteractingCharacters`
  regex-matched names in the action text; the ensemble path had no such fallback, so a name typed
  by hand or left by a choice was silently dropped.
- The old solo matcher used `normalizedAction.includes(lowerName)`, so a character named "Will"
  or "May" matched ordinary English.

Fixed once at the shared point: `mentionedIn(action, cast, explicitIds)` in
`packages/utils/src/ensemble/mentions.ts`, used by **both** paths. Word-boundary matching,
`@Name` or `@FirstName` case-insensitive, bare full names case-sensitive. Four tests cover the
choice case, the "Will" false positive, and explicit-id precedence.

Verified live: `"I press Nia Solace for the exact number"` — no `@` at all — made Nia open the
exchange, against a recency weighting that favoured Kaelen.

### Presence fix — a mention must not teleport

Reported as "the generated output is bullshit and the image shows two women when I am male".
Both symptoms had one cause.

`presentFor` force-added any mentioned character to the scene. Kaelen's playthrough had abandoned
Elara ~20 turns earlier ("I drop her and run"; she is trapped behind a collapsed arch) and fled to
an aqueduct ledge. Saying "Hi @Elara Voss, where are you?" put her back in the room, so she
answered as if standing there, **and** she was handed to the renderer as a second subject.

- Mentions no longer create presence. `presentFor(cast, parent)` reads the recorded cast; with no
  record it seeds from **who the previous turn's narration actually named** (`mentionedIn` over
  `narrativeText`), and only a world's very first turn seeds from the full cast.
- `chooseCast` returns `absent` — mentioned but not in the scene. The prompt says they cannot hear
  it and do not answer, so the narration shows what the words meet instead.
- The ensemble path now also runs when there are no speakers but someone absent was addressed,
  otherwise the solo fallback would resurrect them through `resolveInteractingCharacters`.
- `ENSEMBLE.turnTaking` gained: a character addressed by name answers what was actually asked.

Verified live as Kaelen: "Hi @Nia Solace, where are you?" (Nia has never appeared in his story)
produced "Your voice ... finds no living ear to answer it" plus Elara saying "Nia isn't in this
sector." Nia neither spoke nor entered `cast_json`.

`presentFor` has four tests in `apps/director/src/engine/ensemble.test.ts`, including the real
aqueduct text yielding an empty scene.

### The two-women render

Not caused by this work. The scene prompt for that turn was reconstructed and was correct:
`(one adult man and one adult woman:1.4)`, `Kaelen Thorne ((a man:1.3) ... on the left)`, with
`two women, two female subjects, all-female` in the negative. Kaelen's stored portrait is
unambiguously male and PuLID applies the protagonist last, masked left. The render ignored all of
it — the documented Wave 7E two-subject gender bleed. The presence fix removes the second subject
from scenes like this one, which is the only lever that reliably helps today.

### Still open after Wave 3

- `directorWhisper` was **already wired end to end** before this wave — the Wave 6 note claiming
  otherwise was stale. Nothing was built for it.
- The narrative text keeps its `Name:` prefixes when displayed; TTS strips them. The client has
  no designed speaker treatment yet.
- `planEnsembleTurn` still swallows every failure into an empty plan. It hid the bond bug.
- Bond deltas are often `0` even on a pointed exchange. The plumbing is proven; the 9B is
  conservative about scoring them.
- `ensemble.maxSpeakers` is advisory, not enforced. At `maxSpeakers: 1` the model still wrote a
  line for a second character, and `parseAttributedLines` attributes any named cast member. The
  cap shapes the prompt; it does not gate the parser.

### Open from Wave 2

- **The model wraps spoken lines in quotation marks** despite the instruction not to. The Wave 3
  parser must strip them rather than fight the model.
- Speaker persona blocks clip bios at 220 chars, silent cast at 140 and to a sentence boundary.
  `firstSentence` skips abbreviations ("St. Aethelgard") by requiring the preceding word to be
  longer than two letters.
- `Tide of Debt`'s protagonist row has a bio naming "Wren Alder" while the character is
  "Elara Vane". Pre-existing data, not a prompt bug, but it will confuse narration.

### Fixed during verification

- Base UI `Combobox` fires `onValueChange` on mount when the controlled value matches no item,
  which silently wrote a narrator voice nobody chose. Selections are now ignored unless the
  popup is open. One world had already taken a stray `af_v0nicole`; reset to null.
- The trigger rendered the full `Name — Accent, gender` label, crushing the row label to two
  lines at 390px. It now shows the bare name; accent, gender and grade live in the row blurb.

### Open

- Create-world dialog does not expose the narration fields. Defaults are correct for a new
  world, so it is edit-only by choice.
- `admin/fields.ts` still tells the operator that `prompt.recentFacts` controls "recalled
  memory from vector memory". That is false until Wave 9.
- Turn 1 of a world has nobody present, so the first ensemble turn is still single-voice; the cast
  populates from `presentAfter` once the narration introduces them.
- Choices stay three first-person protagonist actions. No "let Mira answer" option.
- Narrator prompt capped at 600 chars (`ensemble.narratorPromptChars`).
- A character can speak with their own voice without reaching the image. Unavoidable at cap 2.
- `resolveInteractingCharacters` substring-matches names against raw action text, so a character
  named "Will" or "May" false-positives on ordinary English. Fix in Wave 3.

## Wave 7F

- Assets are WebP, not PNG. `SaveAnimatedWEBP` at one frame, quality from `image.quality`
  (default 90). Measured on an 832x1216 render: PNG 1379 KB, WebP q90 134 KB, q82 81 KB.
  `SaveImageAdvanced`'s AVIF path validates but fails at execution — its V3 dynamic combo is not
  reachable through the plain `/prompt` API, so AVIF is not an option in this build.
- `nextVariant` matched `scene-(\d+)\.png`, which would have reset every regenerate to variant 1
  once the extension changed.
- TanStack Query owns every read path: `usePaginatedData` is `useInfiniteQuery`, `useImagePoll`
  is `refetchInterval`, and `useCharacterSheet`, `useWorldCast`, `useWorldLook`, `useSettings`,
  `useHealth`, `useAdmin` and the accounts screen are queries. Saves invalidate instead of
  remounting lists through `key` counters. The StrictMode guards those hooks needed are gone.
- Character and world forms grouped into labelled sections with one shared row primitive
  (`components/common/FormRow`).
- Portrait renders take unsaved form values, so changing pronouns or name and painting no longer
  uses the stored row.
- Compose dispatched only name and bio, so drafting an appearance overwrote the backstory.

### Open

- Adding a dependency mid-session leaves the Vite dev server serving a blank page until it is
  restarted. `bun app:clear` forces re-optimisation.

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
