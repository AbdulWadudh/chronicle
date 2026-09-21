# World and character authoring

**Date:** 2026-09-20
**Scope:** apps/stage, apps/director, apps/crew, packages/db, packages/utils, packages/config

## What changed

A new account could reach the Community tab and nothing else. `POST /api/v1/worlds` worked but no
screen called it. Both authoring flows now exist, and both produce generated imagery.

- **World creation.** `routes/worlds/` holds the list, a create dialog, a stat-definition editor
  and the draft hook. A premise of eight characters or more can be sent to `POST
  /api/v1/worlds/assist`, which returns a title, genre, description, opening situation and four
  to six abilities through `response_format: json_schema`. Everything it returns stays editable.
- **Character creation.** `routes/characters/` collects a name, a point-buy build and a
  **backstory**, which `CharacterSelect` never captured — it posted `{worldId, name, stats}` and
  the server defaulted `bio` to `""`, so the list rendered an always-empty line.
  `POST /api/v1/characters/assist` writes a backstory from the world and the abilities at rank 3
  or above.
- **Cover and portrait.** Creating a world or character enqueues a diffusion job at
  `JOB_PRIORITY.cover` / `.portrait`, below `.scene`, so authoring never stalls an in-play render
  on the concurrency-1 queue. `diffusionJobSchema` became a discriminated union on `kind`.
  Cards poll their own row through `useImagePoll` and swap a pulsing placeholder for the image.
- **Crew stopped writing SQLite.** `renderImage` publishes to a new `ASSET_CHANNEL` and the
  director's `startAssetWriter` performs the write. This also fixes a pre-existing violation:
  `processors/diffusion/index.ts` used to `db.update(schema.turns)` directly from crew, against
  the single-writer rule in `architecture.md`.
- **`LazyBoundary`** wraps the dice roller and the story map. A failed lazy chunk now degrades —
  the dice fall back to `DiceResult`, which renders the same roll the server already sent.
- `PaginatedList` lost the dead `numColumns` prop (zero call sites) and gained `listClassName`,
  so the world list is a responsive grid. Its scroll container reserves
  `pr-[calc(var(--shadow-offset)+0.25rem)]` per `ui-animations.md`.

## Why

Two real defects were found by running it, not by reading it.

**The assist returned 500 intermittently.** `completeStructured` used
`settings.structured.maxTokens`, which is 400 — sized for the check-proposal schema, not a world
draft. Responses measured 1449–2186 characters, so longer drafts were truncated mid-object and
`JSON.parse` threw a bare `SyntaxError` that surfaced as "Internal Server Error". `draftWorld`
now asks for 1400 tokens and `draftBackstory` for 400, and `completeStructured` reports the
character count and names `maxTokens` instead of letting the parse error escape unlabelled.

**One failed lazy chunk unmounted the whole application.** During verification the dice chunk
returned `504 Outdated Optimize Dep` for `@react-three_fiber.js`. With no error boundary anywhere
in the tree, React unmounted to an empty `#root` mid-story — the screen went black with the turn
still streaming. The 504 itself was environmental, but a CDN blip or a stale chunk after a deploy
would do the same thing in production. The dice are decoration over a result the server has
already sent, so the fallback loses nothing.

## Evidence

Verified against the live stack: llama.cpp on 8080, ComfyUI on 8188, Kokoro on 8880, Dragonfly on
6379, RustFS on 9000.

- **Kokoro is installed and healthy**, contradicting `CLAUDE.md`, `LLM_STATE.md` and the brief.
  `GET /health` returns `{"status":"healthy"}`; `POST /v1/audio/speech` returned a 47,660-byte
  mp3 in 1.52 s. Audio is missing because nothing persists the URLs, not because the service is
  absent.
- **Assist**, 5 consecutive calls: 5/5 HTTP 200 in 4.4 s, 5.1 s, 5.8 s, 5.9 s, 7.1 s; payloads
  1449–2186 characters; 4 abilities each, all premise-specific (`debt-balance`,
  `tide-resistance`, `ledger-clarity`, `silt-stability`), none generic.
- **Cover** landed 20 s after create (5 polls at 5 s) at exactly
  `worlds/<worldId>/cover.png`, 1,425,506 bytes, `image/png`, 1024×1024, fetchable anonymously.
- **Portrait** landed inside the first 5 s poll at
  `worlds/<worldId>/characters/<characterId>/portrait.png`, 1,440,073 bytes.
- **Point-buy**: ranks 3/2/3/1/1 cost 2+1+2 = 5, and the readout showed `15 / 20 points left`.
- **The backstory reaches the narrator.** The generated bio gave Wren Alder debt-sight and debt
  negotiation; the first turn's narration came back with "the shimmering numbers swirl into a
  perfect, crimson spiral" and "no longer merely a broker walking among the dead". Neither phrase
  is in the prompt template.
- **The D20 was seen rendering for the first time** — `aria-label="Twenty-sided die showing 11"`,
  gold icosahedron, on `echo-voice · DC 12`. `LLM_STATE.md` had it open as never observed.
- Dice resolved server-side across four turns: `ledger-call` DC 12 rolls 15, 19, 15; `echo-voice`
  DC 12 roll 11. `total` and `succeeded` correct in every row.
- `bunx turbo run typecheck` 6/6 · `bun run lint` clean · `bun run audit` clean.
- Rendered at 375 px and 1440 px: worlds empty, create dialog empty, create dialog filled,
  abilities and budget, characters empty, characters filled, play empty, dice mid-turn, desktop
  split with the scene panel.

## Follow-ups

- `choices_json` is still `[]` on every turn and `buildChoicePrompt` still has no caller.
- `audio_urls_json` is still `[]`. Kokoro synthesises and uploads; nothing writes the URLs back.
- `loader.ts` still passes `world.initialState` as the world state, so nothing accumulates.
- Submitting the identical action twice makes the model copy its previous answer verbatim — three
  turns came back byte-identical at 571 characters. Choices in Wave B are the fix.
- `DICE_CHECK_REQUIRED` shows the stat **id** (`ECHO-VOICE`) rather than its label.
- Narration streams while the die is still tumbling, so the text spoils the roll.
- The scene panel shows the "No scene yet" empty state for the whole render instead of a skeleton.

---

## Follow-up: per-field composition, pronouns, and the modal shell

**Added after review.** The first pass shipped one bulk "draft the whole world" button and one
backstory button. The ask was per-field controls, so every text field now carries **Generate** and
**Enhance** inline.

- `POST /api/v1/compose` — one route, eight targets (`world.premise`, `.title`, `.genre`,
  `.description`, `.opening`, `.ability`, `character.name`, `.bio`), two modes. The contract lives
  in `packages/utils/src/compose.ts`; the prompts stay director-side.
- `ComposableField` + `FieldActions` render the pair inside the control: vertically centred for a
  single-line input, in a footer strip for a textarea so text never runs underneath.
- `characters.pronouns` (`he | she | they`, default `they`) — migration
  `0004_careless_carmella_unuscione.sql`, one additive `ALTER TABLE`. It flows into the compose
  context, `buildContext`, and `buildPortraitPrompt`.
- `AppModal` rebuilt to a fixed shell: sticky header (icon badge, title, optional subtitle,
  highlighted close), scrolling body, sticky footer with actions floated right.
- `PointBuyStepper` rows show the full ability description and rank pips. They were `truncate`d,
  so the player could not read what they were ranking.
- `WorldBrief` on character select — cover, genre, description, the opening passage and every
  ability with what it tests. The screen previously showed only a title.

### Why

**Generation was deterministic and looked broken.** Regenerating a name returned `Silas Vane`
four times running. Two causes: the field's own value was included in its own prompt material, so
the model echoed it; and `completeStructured` ran at `structured.temperature` = 0.2, tuned for the
dice-check schema. `SELF_FIELD` now omits the target from its own context and compose samples at
0.95. Measured after the fix: `Marrow Crowle`, `Elias Thorne`, `Alistair Vane`, `Silas Vane` on
four identical requests.

The first attempt at that fix silently did nothing — the edit anchored on a string Biome had
already reformatted, so `temperature` never reached the file while the constant sat unused above
it. Every subsequent edit asserts its anchor.

**The modal footer rendered off-screen.** `max-h-[inherit]` on the inner wrapper resolved against
an auto-height `<dialog>`, so nothing constrained the flex column: measured `footerBottom: 1671`
against `dialogBottom: 812`, with `bodyScrollable: false`. The dialog is now the flex column at
`max-h-[88dvh]` and the body carries `min-h-0 flex-1`.

### Evidence

- Compose, measured live: premise generated from an empty form; **Enhance** kept every element
  (night watchman, lighthouse, iceberg, inward beam) and only sharpened wording; a title generated
  from that premise returned `The Inward Beacon`.
- Pronouns end to end: a `he` character was created (201, `"pronouns":"he"` persisted), and the
  narration came back with "the debt **he** refused to pay" and "not the man".
- Modal after the fix: `bodyScrollable: true`, body scrolled 849 px, header top **98 px before and
  after** scrolling, `footerBottom: 811` in an 812 px viewport.
- Segmented controls measured at 375 px: `scrollWidth === clientWidth` on every option, so no
  label clips. Visibility 177 px wide, pronouns 216 px, both inside the 355 px content box.
- `bun run check` green throughout: audit PASS, lint clean, typecheck 6/6.

### Second pass: regeneration variety and field readability

`character.name` still converged — four regenerations returned `Vesper Hallowgate`, `Sylas Vane`,
`Seraphina Vane`, `Silas Vane`, with the surname collapsing to "Vane" in three of four. Omitting
the field from its own context stopped the verbatim echo but gave the model nothing to steer away
from. On `generate`, the current value is now an explicit negative constraint
("Already rejected. Avoid it, and avoid reusing any part of it"). Chained five deep, each
rejecting the previous: `Nyx Morwenna`, `Vesper Corvinius`, `Elara Vane`, `Silas Marrow`,
`Caspian Vesper`.

- Textarea actions moved out of the full-width footer strip into the field's bottom padding
  (`pb-9` plus a blurred chip), so they no longer consume a row and the last line clears them.
- `WorldCard` puts the genre in a chip beside the title and gives the description
  `leading-relaxed` over three lines; it was a washed-out two-line clamp.

### Third pass: the invisible modal, and one mapping instead of two

**Every screen was unclickable.** Adding `flex flex-col` to the `<dialog>` element (to constrain
the column so the footer stopped rendering off-screen) set `display: flex`, which overrides the
user-agent `display: none` a closed `<dialog>` relies on. The Create-a-world modal was therefore
laid out over every route, invisible but hit-testable, swallowing clicks. Measured at 375 px:
`elementFromPoint` at the world card's centre returned the modal's `TEXTAREA`, not the card. The
class is now `hidden ... open:flex`, so the flex column applies only while the dialog is open.

An a11y snapshot had listed "Create a world" and "Close" on the worlds route two passes earlier.
That was the symptom, and it was dismissed as an artefact rather than investigated.

The reported "delay in every action" was the same defect: clicks landed on the overlay and did
nothing. Measured after the fix, a card click reaches the new route in **1 ms**, and the worlds
page loads in 92 ms.

`currentValue` in `packages/utils/src/compose.ts` was an eight-case switch mapping a target to a
context key — and `SELF_FIELD` in the director engine was the *same mapping written a second
time*, used one line apart from it. Both are gone, replaced by one exported `COMPOSE_FIELD`
record; call sites read `context[COMPOSE_FIELD[target]]` directly.

`LazyBoundary` is now `ErrorBoundary` and also wraps the application root, with `AppCrash` as the
fallback. Two crashes in this session (a 504 on the dice chunk, a throw in `ThemeEngine`) blanked
the whole app to an empty `#root`; the root boundary turns that into a recoverable screen.

### Follow-ups

- The shell layer mangles backslash escapes inside heredocs, which corrupted a template literal in
  `compose.ts` and produced an unterminated string. Edits touching `\n` go through the editor, not
  a heredoc, and every structural edit asserts its anchor before writing.
- Vite twice cached an **empty** module because its watcher fired on the heredoc truncate
  mid-write. Writes are now atomic (`mv` into place). If a screen goes blank after an edit, check
  the served module size before believing the code is wrong.
- `/api/v1/worlds/assist` (bulk draft) remains; `/api/v1/characters/assist` was deleted because
  `character.bio` compose replaces it exactly.

---

## Fourth pass: a cast to play, one play screen, editable characters

- **Every world is cast.** Creating a world drafts three protagonists in one structured call
  (`engine/cast.ts`), inserts them owned by the creator, and enqueues a portrait each. No schema
  change was needed — they are ordinary characters, so playing, editing and deleting them already
  worked. The model returns an `emphasis` of one or two ability ids and the **director allocates
  the points**, so a build can never exceed the budget.
- **Characters are editable.** `PATCH` and `DELETE /api/v1/characters/:id`, both scoped to the
  owner, with a confirm dialog on delete. `CharacterDialog` serves create and edit from one
  `CharacterForm`.
- **Portrait control.** A `character.portrait` compose target writes an image prompt, and
  `POST /characters/:id/portrait` accepts `{ prompt }` to override `buildPortraitPrompt`.
- **Play is one screen.** The split view is gone. Illustrations render inline above the narration
  they belong to (`TurnEntry` + `SceneFrame`), the story map moved into a modal behind a header
  button, and `ScenePanel` was deleted. The composer's Scratch/Enhance mode chips were replaced by
  inline Generate/Enhance on the action itself, through the same `FieldActions` used everywhere.

### Why

The first allocation attempt spent every point: with 4 abilities and a budget of 20, all three of
the cast came back 5/5/3/5 — valid, but identical to play. Emphasis caps now run 5 then 4, other
abilities stop at 3, and leftovers stay unspent. Measured: `5/4/3/3` at budget 20 spending 14, and
`5/4/1/1` at budget 10 spending exactly 10.

A scene illustration never attached to its turn in the new layout. `TURN_COMMITTED` carries
`sceneImageUrl: null` because the render finishes later, and `SCENE_IMAGE_READY` only updated the
streaming slot — so the picture arrived after the turn had already moved into the transcript and
was dropped. The handler now patches the committed turn by id.

### Evidence

- Cast landed **15 s** after world creation: Sister Mercy O'Malley (she), Silas Vane (he), The
  Glass-Kin (they), each with a distinct backstory and its own generated portrait.
- `character.portrait` generate returned "Silas Vane, late thirties, lean build, dark hair
  streaked with ash, wearing a leather coat and duster, standing amidst fused glass ruins".
- `turn.action` generate returned a usable first-person action, and the turn streamed on one
  screen with the composer docked.
- `bun run check` green: audit PASS, lint clean, typecheck 6/6.

### Follow-ups

- **Repaint cannot detect completion.** Portraits overwrite one key (`portrait.png`), so polling
  for a non-null URL cannot tell a new image from the old one, and the browser serves its cache.
  The display is cache-busted with `?v=<timestamp>` on repaint, which refreshes it but is not tied
  to the job finishing. A correct fix is either `characters.updatedAt` (a migration) or numbered
  portrait variants like `REGENERATE` uses for scenes (an asset-layout change). Both are gated.
- HugeIcons' free package ships stroke-only icons; there are no solid variants to switch to. The
  action icons use semantic colour and a heavier stroke instead.

---

## Fifth pass: image preview, download, and two mislabelled states

- `ImageViewer` opens any generated image full size with **Open original** and **Download**.
  Portraits and scene illustrations are both click-to-preview.
- `GET /api/v1/assets?url=` proxies the download through the director.

### Why

**The portrait button lied twice.** `painting` was defined as `settled === null` — "this character
has no portrait" — not "a job is running". Any character whose portrait never rendered showed a
disabled "Painting…" forever with no way to trigger one. Then, once corrected, it read "Repaint"
on a portrait the player had never painted themselves. The tense was inferred from state that does
not describe the action, so the label is now unconditional: **Paint portrait**, and `painting`
means only "a paint was requested this session and nothing has arrived yet".

**The download could not have worked.** RustFS sends no CORS headers, so the browser fetch failed
with `TypeError: Failed to fetch` — measured, not assumed. The director now proxies it, which also
keeps the object storage off the client's origin.

The proxy validates the requested URL against `${STORAGE_ENDPOINT}/${STORAGE_BUCKET_ASSETS}/` and
rejects `..`, so it cannot be turned into an open proxy onto the other local services.

### Evidence

- Proxy, measured: a real asset returns **200**, 1,358,325 bytes,
  `content-disposition: attachment; filename="portrait.png"`; a URL pointing at the LLM server on
  8080 returns **403**; an unauthenticated request returns **401**.
- Download exercised from inside the viewer: 200, 1,440,073 bytes, attachment disposition.
- `bun run check` green: audit PASS, lint clean, typecheck 6/6.

---

## Sixth pass: icon actions, and one preview component

A new global rule in `~/.claude/rules/ui-craft.md`: **actions on a thing are icons, not labelled
buttons.** Download, open, edit, delete, copy, regenerate, preview — anything acting on an item
already on screen — is an icon button with a tooltip and an `aria-label`. Only a button that
commits or abandons a flow keeps a text label.

- `ImageViewer` is a bare centred lightbox, not a modal card: the image on a scrim, outlined
  overlay actions revealed on hover, Escape and backdrop-click to close.
- Zoom: wheel over the image, or the zoom action. Continuous, clamped 1x-4x, and the listener is
  registered with `{ passive: false }` so the page never scrolls instead.
- `PreviewableImage` replaced five hand-wired preview blocks — world cover, world brief cover,
  character card portrait, portrait panel, and the scene illustration.
- `WorldCard` became an `<article>`: the cover previews, the body navigates. A preview button
  could not be nested inside the old whole-card `<button>`.

### Why

Two mistakes worth recording. The wheel listener silently did nothing because the edit that added
`ref={frame}` anchored on a className string that had already changed, so the ref never reached
the container — the same class of failed-anchor edit as the `temperature` one, caught this time by
measuring the transform rather than trusting the diff.

The overlay actions looked permanently visible: native `showModal` autofocuses the first focusable
child, which matched `group-focus-within`. Reveal now keys on `group-hover` and
`has-[:focus-visible]`, so keyboard users still get them and programmatic focus does not.

### Evidence

- Wheel zoom measured: `scale(1)` → `scale(1.405)` after three wheel-ups, exactly 1.12³, with
  `window.scrollY` unchanged at 0.
- Preview affordance measured: `cursor: pointer`, image `filter: none`, eye overlay opacity 1 on
  hover and 0 otherwise.
- Asset proxy unchanged and still correct: 200 with attachment disposition, 403 on a non-asset
  URL, 401 unauthenticated.
- `bun run check` green: audit PASS, lint clean, typecheck 6/6.

---

## Seventh pass: pan and zoom, sheets, composer layout

- `usePanZoom` moved from `components/canvas/flowchart/` to `hooks/`. It already did drag-pan,
  pinch and **zoom toward the cursor** for the story map, so the image viewer reuses it rather
  than growing a second implementation. It gained `minScale`/`maxScale` options, a `reset`, an
  exposed `zoomBy`, and an optional `clamp`.
- The image viewer pans and zooms: wheel over the image zooms toward the pointer, drag pans, and
  the clamp keeps the image covering its frame so it cannot be dragged into the void.
- `components/ui/sheet.tsx` — a resizable side panel: docked right above 640 px, a bottom sheet
  below it, with a drag handle and the size remembered per panel in `localStorage`. The Director's
  Console and the story map now use it instead of a centred modal.
- The composer is one surface: the textarea, then an action row with generate/enhance on the left
  and send on the right, rather than icons inside the box and a tall square outside it.
- Overlay actions carry distinct tones — accent for open and download, danger for close.

### Why

Dragging "snapped" because `minScale` is 1 but panning was never gated on being zoomed, so at 1x
the image could be dragged clean out of its frame with nothing to pull it back. The clamp bounds
the offset to `frameSize * (1 - scale)`, which pins it exactly at 1x and keeps it covering the
frame when zoomed.

`onPointerDown` called `setPointerCapture` **before** registering the pointer. Capture throws
`NotFoundError` for any pointer id the browser does not own, and the throw aborted the handler, so
the pointer was never recorded and panning silently died. Registration now happens first.

The eye overlay went through three rounds — chip, then bare icon, then removed entirely in favour
of a plain pointer cursor — and the portrait action went from label to icon and back. The rule in
`ui-craft.md` now names the dividing line: secondary and repeated verbs are icons, while a
panel's single primary action keeps its label.

### Evidence

- Pan measured: a pointer delta of +80/+60 moved the image exactly `[80, 60]`, 1:1, at scale 2.46.
- Clamp measured: the same drag at scale 1 moved the image `[0, 0]`.
- Wheel zoom measured: `scale(1)` → `scale(1.405)` over three wheel-ups, `window.scrollY` still 0.
- Sheet measured: docked at `right: 1440` of a 1440 px viewport, 900 px tall, dragged from 480 px
  to **663 px**, and `chronicle.sheet.director-console.width` reads `663`.
- `bun run check` green: audit PASS, lint clean, typecheck 6/6.

### Follow-ups

- Three separate measurements read as "broken" only because they sampled the DOM synchronously,
  before React had re-rendered. Measure pan and zoom after a wait, or the transform is stale.

## Eighth pass: the playable loop — choices, short narration, scene control

### What changed

- **Three choices plus free text.** `engine/choices.ts` drafts exactly three next actions with a
  one-line hint each, and the turn commits with them in `choices_json` — the column had been `[]`
  since Wave 3 and `buildChoicePrompt` was never called. `SELECT_CHOICE` now loads the stored
  label and plays *that*, rather than the placeholder string `Choice 1`.
- **Narration is short.** The narrator prompt said "three to five sentences of vivid prose". It is
  now `prompt.sentences` (default **2**), a runtime setting with an admin field, and the
  instruction is to show what the action caused and what is now pressing — no recaps, no essays.
- **The scene frame no longer pops.** `SceneFrame` reserves the exact aspect ratio the renderer is
  configured for, read once from `GET /api/v1/settings`, and holds that box across placeholder →
  painting → image. The image cross-fades in; nothing reflows.
- **A scene is controllable.** Hovering the art reveals a repaint action that opens a card with the
  prompt in a `ComposableField` — generate, enhance, or type it. `POST /api/v1/turns/:turnId/scene`
  enqueues the job at the next numbered variant.
- **Director's whisper reached the model.** It sat in the console sheet and was dropped on the
  floor. It is now an inline action in the composer with its own generate/enhance card, and the
  trigger lights accent when armed with the direction in its tooltip.
- **The scene image is the backdrop.** `SceneBackdrop` cross-fades the latest scene behind the
  whole screen, blurred and slowly drifting, under the existing glow orbs and a legibility scrim.
- **Scenes know who the protagonist is.** `buildScenePrompt` now takes the `Character` and leads
  with name, pronoun subject and a 160-character slice of the bio.
- **Assets resolve on the LAN.** `lib/assets.ts` swaps a loopback asset host for the page's own
  hostname, so a phone on the same network loads images and audio that were written with
  `STORAGE_ENDPOINT=http://127.0.0.1:9000`.
- Turn action icons carry distinct tones: replay success, rewrite accent, re-voice warning.
- The story map canvas measures its container with a `ResizeObserver`, so it grows with the sheet.
- `TurnEntry` is two columns from `md`: narration left, scene art right.

### Why

`useSentenceReveal` dripped one sentence every 1400 ms from a `setInterval`, which the project's
own animation rules ban and which the stream outruns immediately — so "Tap to reveal the rest"
appeared on every turn and dumped the whole passage at once. Reveal is now gated only in Cinema
Mode, on the sentence's audio, which is the only place the gate means anything. The timer, the
constant and the effect are gone.

The scene repaint went in as a REST route rather than a field on `REGENERATE` because the WS
protocol shape is gated — the route reuses `loadTurnContext` for ownership and `socketFor` to
register the socket so `SCENE_IMAGE_READY` still pushes to the open client.

### Evidence

- Live turn over the socket: **4.3 s**, narration **2 sentences / 331 chars**, **3 choices** each
  with a hint.
- `POST /api/v1/turns/:id/scene` → **202** authenticated, **401** unauthenticated, **404** for
  another account's turn. Storage then held `scene-1.png` *and* `scene-2.png`, both 1024×1024 —
  the repaint wrote a new variant rather than overwriting.
- Portrait orientation confirmed live: `portrait.png` is **832×1216**, 1,325,189 bytes.
- Whisper generate returned through the LLM in the browser: *"The wind shifts, carrying the scent
  of brine and blood toward the locked door."*
- Scene-prompt generate returned a comma-separated image prompt, and pressing Paint put exactly
  one "Painting this scene…" badge on screen.
- Asset rewrite checked on four hosts: loopback page untouched, `172.23.160.1` and
  `chronicle.local` rewritten, a non-loopback CDN URL left alone. RustFS answers **200** on
  `172.23.160.1:9000`.
- `bun run check` green: audit PASS, zero comments PASS, lint clean, typecheck 6/6.
- Rendered at 390×844 and 1440×900.

### Follow-ups

- Image fidelity is a settings change, not a code change: `image.checkpoint` is still
  `DreamShaperXL_Lightning` at 6 steps / cfg 2, which is why output reads soft. The full-SDXL
  preset (epicrealismXL, 26 steps, cfg 7, `dpmpp_2m`) is already selectable in admin.
- Face consistency is now prompt-level only. True consistency needs an IP-Adapter reference pass
  in the ComfyUI workflow.
- `SUBMIT_ACTION` still carries no `directorWhisper`, so the composer's whisper is set but not yet
  sent. That field is a WS protocol change and is waiting on approval.

## Ninth pass: render quality, the LAN, and the wait

### What changed

- **A hires pass.** `buildWorkflow` grew a conditional `LatentUpscale` + second `KSampler`
  chain, driven by two new runtime settings: `image.upscale` (default **1.5**) and
  `image.upscaleDenoise` (default **0.4**). At 1 the graph is exactly what it was.
- **RealVisXL is the default checkpoint.** Base steps 6 → 8. The negative prompt went from
  three words to a real one covering anatomy, artefacts and flat lighting.
- **The wait is a scene now.** `ScenePainting` replaces the static "Painting this scene…" chip:
  a sheen sweeps the frame, a shimmer runs the progress rail, and three stage captions cycle —
  Composing the frame / Laying in the light / Finishing the detail. All CSS keyframes on
  `transform` and `opacity`, all switched off under `data-motion="off"` and reduced motion.
- **Assets resolve wherever the page is served from.** `lib/assets.ts` rewrites a loopback asset
  host at render time. On a LAN address it swaps the hostname and keeps the port. Behind a
  port-as-subdomain reverse proxy it swaps the whole shape: on `https://8082.k79.quest` an asset
  at `http://127.0.0.1:9000/...` becomes `https://9000.k79.quest/...` — the port moves into the
  first label, the page's scheme is adopted, and the explicit port is dropped.

### Why

`epicrealismXL_pureFix` — which `architecture.md` listed as installed and which the previous
pass recommended — **is not on the machine**. ComfyUI reports two checkpoints, both Lightning.
The doc has been corrected and now says to ask ComfyUI before naming one. With no full-step
model available, the quality levers were the better Lightning checkpoint, a couple more steps, a
real negative prompt, and a second sampler pass at higher resolution.

The asset fix is a client-side origin rewrite rather than a `STORAGE_PUBLIC_URL` env var because
URLs are persisted at write time: an env var fixes new rows and leaves every existing one broken,
while the rewrite fixes both and needs no configuration.

### Evidence

- Render measured: **1536x1536, 3,192,375 bytes, 21 s**, no OOM with the LLM and Kokoro resident.
  The previous default produced 1024x1024 at ~1.45 MB. Face, hands and wood grain all hold at
  100%.
- ComfyUI checkpoint list read live: `DreamShaperXL_Lightning.safetensors`,
  `RealVisXL_V5.0_Lightning_fp16.safetensors`. Nothing else.
- LAN verified on the real address, not the WSL adapter: `ipconfig` gives `192.168.1.39` on
  Ethernet, with `172.18.64.1` (Hyper-V) and `172.23.160.1` (WSL) as decoys. Loading
  `http://192.168.1.39:3000/play/...` rewrote **4 of 4** asset images to `192.168.1.39:9000`,
  all four with `naturalWidth > 0`.
- Rewrite checked across **10 origins**: tunnel https and http, a deeper `3000.apps.k79.quest`,
  an audio URL, a LAN IPv4, a plain hostname, both loopbacks, a remote CDN URL and a relative
  path. The IPv4 guard matters — `192.168.1.39` has a numeric first label and would otherwise
  have been mangled into `9000.168.1.39`.
- `bun run check` green: audit PASS, zero comments PASS, lint clean, typecheck 6/6.

### Follow-ups

- The stage captions are decorative, not real progress — ComfyUI reports node-level progress but
  surfacing it needs a new server message, which is a gated protocol change.
- Face consistency is still prompt-level. An IP-Adapter reference pass keyed on the character
  portrait is the real fix.

## Tenth pass: scene framing, a derived backdrop, and the cycling captions

### What changed

- **Scenes are scenes again, not character cards.** `buildScenePrompt` leads with the moment and
  demotes the character to a clause after it, with a 90-character bio slice rather than 160, and
  adds `wide shot, subject off-centre and turned into the action, candid unposed moment,
  environmental storytelling, depth of field`. Scene jobs also carry their own negative suffix —
  `portrait, character sheet, centered subject, symmetrical composition, posed, looking at
  viewer, studio backdrop, full body reference` — which the cover and portrait jobs do not.
- **The backdrop is a gradient derived from the scene, not the scene.** `useScenePalette` pulls
  the image through the director's asset proxy, downsamples it to 12x12 on an `OffscreenCanvas`,
  and reads three colours: the average of the top band, the average of the bottom band, and the
  most saturated pixel. `SceneBackdrop` renders them as three large radial orbs that cross-fade
  when the scene changes. No image, no solid fill.
- **The stage captions stopped stacking.** All three painted at once.

### Why

Putting the character description *first* in the scene prompt was the cause of the centred,
staring, symmetrical portraits — SDXL weights early tokens hardest, so it rendered a character
sheet and treated the narrative as wallpaper. The character still needs to be in there for face
continuity, so the fix is ordering and weight, not removal.

`animation-delay` leaves an element at its **base** style until the delay elapses, and
`animation-fill-mode: backwards` would not have helped because the 0% keyframe is `opacity: 1`.
The lines now sit at `opacity: 0` in CSS and the keyframes raise them, so only one is ever lit.
The captions also moved into a bordered `bg-card/90` pill — as bare text on a near-white
placeholder in a light theme they were unreadable.

Pixel extraction goes through `/api/v1/assets` rather than reading the displayed `<img>`, because
RustFS sends no `Access-Control-Allow-Origin` — verified with an `Origin` header, the response
carries none — so a canvas drawn from the storage URL is tainted and `getImageData` throws. The
proxy is same-origin and already authenticated. Results are cached per URL.

### Evidence

- Reframed render measured: **16 s**, subject off-centre, turned down into the ledger, sea and
  pier carrying the background, natural depth of field. The same turn under the old prompt was a
  centred figure staring at camera.
- Palette measured live on the play screen: three `radial-gradient` layers on `.scene-drift`,
  colours pulled from the render — sand, sea and a warm accent — at alpha 0.24 / 0.20 / 0.16.
- First tuning attempt read acid green: the saturation **floor** of 0.42 pushed a muted sea-teal
  into a vivid green, and the top orb at `6%` tinted the header. Clamped to a 0.22–0.50 band and
  the orbs moved inward; re-shot at 390x844.
- `bun run check` green: audit PASS, zero comments PASS, lint clean, typecheck 6/6.

### Follow-ups

- The palette costs one extra fetch of the full image per new scene, cached per URL. A thumbnail
  endpoint would make it free, but the images are local.

## Eleventh pass: medium shots, quieter waiting, one button style

### What changed

- **Medium shot, not wide.** The previous pass swung too far: `wide shot` made the figure small,
  and SDXL renders small faces badly — the result was a gaunt, haggard face in a generic
  seascape that ignored the action. Now `medium shot from the waist up, subject off-centre and
  turned into what is happening, detailed expressive face`.
- **The bio is out of the scene prompt.** A 90-character slice of backstory carries no visual
  information and actively competed with the narrative — "the ocean chose her when her own debts
  became too heavy" pulled every render toward a melancholy woman by the sea. Scenes now carry
  only the pronoun subject for continuity.
- **Guidance 2 → 3.** At cfg 2 the model was ignoring the action in the passage.
- The scene negative gained `distant tiny figure, gaunt sunken cheeks, elongated face, ugly face,
  deformed face`.
- **`FieldActions` uses the `Button` primitive.** It was rendering a raw `<button>` with its own
  border, background and hover, so generate and enhance did not match the whisper trigger beside
  them. Both are now `variant="outline" size="iconSm"`.
- **The painting state stopped looking like a progress dialog.** The pill, border and progress
  rail are gone. What is left is the sheen, a soft bottom scrim, and one quiet italic line
  cycling through *The scene is forming* / *Light finds the edges* / *The last details settle*.

### Why

Two of the three image problems were self-inflicted in the previous two passes — leading with
the character description produced portraits, and over-correcting to a wide shot produced bad
faces. The stable point is a medium shot with the moment first and the character reduced to a
pronoun subject.

`FieldActions` predates the rule that screens are built from the component library. It was the
only remaining raw `<button>` in the composer, which is exactly why it looked different.

### Evidence

- Re-rendered the same turn across three prompt shapes: character-first gave a centred portrait;
  wide shot gave a small gaunt figure on a generic beach; medium shot gave a clean, expressive
  face at the harbourmaster's desk with the ledger, the town and the sea behind. **21 s**.
- `bun run check` green: audit PASS, zero comments PASS, lint clean, typecheck 6/6.

### Follow-ups

- Desktop still centres a 680 px column in a 2560 px window. Layout options are open.

## Twelfth pass: a settings patch was wiping its own group

### What changed

- `runtimeSettingsPatchSchema` no longer applies defaults. It is now built by `patchOf`, which
  walks each group's shape and unwraps `ZodDefault` **and** `ZodPrefault` before making the field
  optional.
- The scene hires pass upscales with `bislerp` instead of `nearest-exact`.
- Base steps 8 → 10, `image.upscaleDenoise` 0.4 → 0.5.

### Why

In Zod 4, `.partial()` marks fields optional but **still applies `.default()` to absent keys**, so
`PATCH /api/v1/settings {"image":{"steps":10}}` parsed into a *complete* image object and
`mergeRuntimeSettings` faithfully wrote every sibling back to its default. Two fields sent, ten
fields overwritten.

The practical effect: a `cfg: 3` patch landed, then a later `steps` patch silently reverted the
checkpoint from `RealVisXL_V5.0_Lightning_fp16` to `DreamShaperXL_Lightning` and cfg to 2. Renders
that were supposed to be on the better model were not. The admin UI patches one group at a time,
so every slider move there was doing the same thing.

`checkpoint` uses `.prefault()` rather than `.default()`, which is a different Zod class — the
first version of the fix unwrapped only `ZodDefault` and the checkpoint still leaked through.

### Evidence

- Eight assertions on the merge: a `{steps: 10}` patch now carries **only** `["steps"]`, the
  checkpoint and cfg survive, other groups are untouched, and out-of-range values and `..`
  traversal in a checkpoint path are still rejected.
- Live against the director: set checkpoint + cfg + denoise, then patch `steps` alone, then read
  back — `RealVisXL_V5.0_Lightning_fp16.safetensors | cfg 3 | steps 10 | denoise 0.5`.
- Render with the settings that actually stuck: **1536x1536, 24 s**, photographic contrast, real
  skin and hair detail, crisp wood grain.
- `bun run check` green: audit PASS, zero comments PASS, lint clean, typecheck 6/6.

### Follow-ups

- `bun --watch` on the director did **not** reload when only a workspace package changed; the
  fix appeared dead until `apps/director/src/index.ts` was touched. Same for crew.
- Three ESRGAN upscalers sit in `Data/Models/ESRGAN` (`4x-UltraMix_*`) but ComfyUI reports zero
  upscale models — its `upscale_models` path is not mapped in `extra_model_paths.yaml`. Wiring it
  would allow decode → ESRGAN → re-encode, which beats any latent upscale.
- Both installed checkpoints are Lightning (speed-distilled). That is the remaining ceiling on
  fine detail; a full-step SDXL is a ~6.5 GB download.

## Thirteenth pass: real progress, the whisper lands, and the dice leave the flow

### What changed

- **`SCENE_PROGRESS { turnId, value, max }`** — a new server message. Crew holds one ComfyUI
  WebSocket on its existing `client_id`, maps `prompt_id → turnId`, and republishes step progress
  on a new `stream:progress:<turnId>` channel; the director relays it. The painting pill shows a
  real percentage and falls back to elapsed seconds when no progress has arrived.
- **`directorWhisper`** — additive, defaulted to `null`, on `SUBMIT_ACTION` and `SELECT_CHOICE`.
  The composer's whisper card now reaches `buildNarrativePrompt`, and clears after it is spent.
- **The dice left the document.** `DiceOverlay` is `fixed inset-0 z-40`, rendered outside the
  scroll container, entering on a spring and exiting on a fade. It no longer inserts and removes
  a 180px block mid-transcript.
- **`@property --bloom` was inside `@layer components`, so it never registered.** That made
  `calc(var(--bloom) * 0.44)` invalid, the whole `mask-image` was dropped, and every dot painted
  at full strength — the "static dots". Hoisted to the top of the file.
- **The bloom is a pulse, not a sweep.** It fades in and out at both ends so the loop boundary is
  invisible, and a second layer runs at `animation-delay: -1.6s` so pulses overlap continuously.
- **The streaming passage no longer sits in a card.** `NarrativeStream` had `bg-card` + border
  while a committed turn is bare text, so every commit visibly swapped a white panel for plain
  text. Both are now bare.
- Scene prompts ask for `single subject in sharp focus, shallow depth of field with the
  background softly blurred`, and the negative rejects `crowd of sharp background faces,
  deformed background figures, malformed distant faces, fused limbs`.

### Why

Progress needed a protocol message because ComfyUI only sends per-step `progress` events to the
WebSocket holding the same `client_id` that submitted the prompt — a probe with a fresh id sees
queue `status` and nothing else. Crew already submits with `chronicle-crew`, so one socket covers
every render. Progress is deliberately **not** recorded into the replay buffer; at roughly twenty
events a render it would evict the sentence messages the buffer exists for.

Deformed background figures are what SDXL does with small faces. The fix is not a better negative
alone — it is telling the model to throw the background out of focus, so what would have been
mangled reads as depth instead.

### Evidence

- Live in the browser mid-render: `.dot-bloom` present, `animationName: "dot-bloom"`,
  `--bloom: 140.315%` — an interpolated value, which only exists if `@property` registered and
  the animation is running — `maskImage` contains the radial gradient, and the pill read **83%**.
  That is the full chain: ComfyUI → crew → Dragonfly → director → socket → pill.
- Render with the new framing: clean face, clean hands, one soft distant figure, no mangled
  extras. 1536x1536.
- `bun run check` green: audit PASS, zero comments PASS, lint clean, typecheck 6/6.

### Follow-ups

- The cinema-split desktop layout is approved but **not built**. `useCharacterSheet` now exposes
  `worldTitle` for the header; nothing else has moved.
- The dice overlay has not been seen on screen — it is structurally out of flow (`fixed`, outside
  the scroll container) but no dice check has fired since the change.

## Fourteenth pass: the cinema split, and a refresh no longer orphans a render

### What changed

- **Desktop is a split.** From `lg`, the play screen is
  `grid-cols-[minmax(0,1fr)_minmax(24rem,38%)]`: the script and composer on the left, a `SceneStage`
  on the right holding the current scene large with its action card and a caption. Below `lg`
  nothing changes — the stacked mobile layout is untouched.
- **Turns have hierarchy.** `TurnEntry` takes `focal`. The current turn reads at `1.0625rem` in
  `text-secondary` with a solid accent rule; past turns recede to `0.9375rem` in `text-muted` with
  a 40% rule. On `lg` the focal turn hides its own art — the stage owns it — while past turns keep
  an 8rem thumbnail so history is not lost.
- **The header carries content, not state.** World title and character name, with the connection
  state demoted to a dot with a tooltip. It used to read "Live" and nothing else.
- `PlayScript` extracted from `index.tsx`, which had crossed the 250-line warning.

### A refresh no longer breaks a render

Media ownership was keyed to the **socket object**. A refresh closed it, `disownSocket` dropped
the entry, and when the image landed the director had nobody to send `SCENE_IMAGE_READY` to — the
scene sat on "No scene for this moment yet" for the rest of the session even though the bytes were
in storage and the row was written.

Ownership is now `{ userId, characterId }` and the listener is resolved at delivery time through
`socketFor`, so the reconnected socket receives it. `disownSocket` is gone.

The client also could not tell "nothing is running" from "a render is in flight" after a reload,
because `paintingTurnIds` starts empty. On history load the latest turn is marked painting when it
has no image, and unmarked after `RENDER_TIMEOUT_MS` (180 s, matching crew's poll timeout) so a
dead render cannot pin the UI.

### Evidence

- Rendered at 1440x900: header reads *Glasswright Reach · Silas Vane*, past turn muted with an
  8rem thumbnail, current turn at full weight, choices and composer docked left, scene art large
  on the right with its caption.
- Rendered at 390x844: unchanged from before — full-width art, action line, narration, choices,
  composer.
- `bun run check` green: audit PASS, zero comments PASS, lint clean, typecheck 6/6.
  `index.tsx` 259 → 196 lines.

### Follow-ups

- `motion.css` is at 253 lines and will need splitting by concern soon.
- The dice overlay still has not been seen firing on screen.

## Fifteenth pass: layout reverted, portrait framing, and a portrait that actually refreshes

### What changed

- **The cinema split is reverted.** `SceneStage` is deleted and the play screen is a single
  centred column again, art per turn. Kept from that pass: the header showing world and
  character, the focal/receded turn weighting, and the dot-pulse and progress work.
- **Portrait framing follows the description.** Head to chest by default; head to waist when the
  bio mentions something below it (`waist`, `belt`, `hip`, `holster`, `satchel`, `sash`, `apron`,
  `thigh`, `scabbard`, `full body`). Word-bounded, so "hipster" does not trigger it.
- **Prompt text moved to `packages/config/src/prompts.ts`** — narrator rules, choice rules, check
  rules, the pronoun subject map and every imagery fragment including the scene negative. The
  director composes them; it no longer owns the words.
- **Prompts stop cutting mid-word.** `clip()` trims to the last sentence, then the last word. The
  portrait prompt was ending "...He keeps a m," and burning tokens on backstory.

### Portrait generation: three faults, one root

`characters.portraitUrl` is a single key that a repaint overwrites, so the stored string never
changed. That broke three things at once:

- `useImagePoll` resolved as soon as the URL was non-null. On a repaint it already is, so the
  hook returned the **old** URL immediately and never saw the new one.
- `painting` was `repaintedAt !== null && settled === null`, which for any character that already
  had a portrait is permanently `false` — no spinner, ever.
- Even a correct detection would have shown stale bytes, because the browser had the identical
  URL cached. The old client-side `?v=` made that worse: it busted the cache *at request time*
  and re-cached the **old** image under the new URL.

The asset writer now stores `portrait.png?v=<ms>` (and the same for covers), so the value changes
the moment the render lands. `useImagePoll` takes the previously known URL and resolves on
*change*, and returns `{ url, pending }` so the panel can drive its own spinner.

### Evidence

- Live repaint: stored URL went from `.../portrait.png` to `.../portrait.png?v=1789892657509` in
  **12 s**. That is the change the poll watches and the browser refetches.
- The versioned URL still passes the download proxy guard: **200**.
- Framing rule checked over seven bios: plain, chest-only and "hipster" stay head-and-chest;
  belt, waist, holster and "full body" switch to waist.
- `bun run check` green: audit PASS, zero comments PASS, lint clean, typecheck 6/6.

### Follow-ups

- Face identity still does not persist. ComfyUI has **no IPAdapter, InstantID, PuLID or ReActor**
  — checked against all 1037 registered nodes, only stock ControlNet. Without one of those, the
  best available fix is a stored `characters.appearance` line injected verbatim into every
  portrait and scene prompt, which needs a migration.
- `image.steps` and `cfg` currently read 6 and 2 — the Lightning preset, applied from admin. That
  undoes the 10 / 3 measured as better.

## Sixteenth pass: nested dialogs, portrait upload, uniform cards, no more close-ups

### What changed

- **Closing one dialog no longer closes its ancestors.** React propagates synthetic `onClose` up
  its own tree even though the DOM `close` event does not bubble, so dismissing the image viewer
  from inside a modal or sheet fired the parent's handler too. All three native dialogs
  (`AppModal`, `Sheet`, `ImageViewer`) now guard on `event.target === ref.current`.
- **Portraits can be uploaded.** `PUT /api/v1/characters/:id/portrait` takes raw image bytes,
  accepts PNG/JPEG/WebP only, rejects empty bodies and anything over 8 MB, writes to the same
  portrait key through a new `apps/director/src/storage.ts`, and stores a versioned URL. The
  panel gets an upload icon beside Paint, with its own spinner.
- **Character cards are uniform.** The portrait was `self-stretch`, so its height followed the
  bio and every card ended a different height. It is now a fixed `aspect-[2/3] w-20` box, the
  card is `h-full`, and the action row is pinned with `mt-auto`.
- **A hover card on the portrait** shows the full bio, pronouns and every stat rank, built on
  Base UI's `preview-card` added to `components/ui`.
- **Choices collapse on mobile.** Below `md` the three suggestions are hidden behind an icon in
  the composer's action row; above `md` they are always visible and the toggle is not rendered.
- **Scenes no longer produce extreme close-ups.** `detailed expressive face` was pulling the
  camera onto the face until it filled the frame with the crown of the head cropped. The framing
  is now `medium wide shot, the whole head and torso inside the frame with clear space above the
  head, the place around them clearly visible`, and the negative rejects `extreme close-up, face
  filling the frame, headshot, beauty shot, macro portrait, cropped head, top of head cut off`.

### Evidence

- Mobile 390x844: three choice rows present, **0 visible**, toggle present. After tapping it,
  **3 visible**. At 1280 wide: **3 visible** and the toggle is not rendered.
- Portrait upload route validated by type, size and ownership; the versioned URL it returns still
  passes the download proxy guard.
- Re-render after the framing change: head fully in frame with space above it, torso and room
  visible, nothing cropped. 16 s.
- `bun run check` green: audit PASS, zero comments PASS, lint clean, typecheck 6/6.

### Follow-ups

- The upload writes to object storage from the director rather than through crew. Everything else
  goes through the queue, but a user upload is request-scoped and queueing it would only add
  latency and a failure mode.

## Seventeenth pass: the dot bloom was a disc, not a ring

`mask-image` was `radial-gradient(#000 0%, #000 calc(--bloom * 0.44), transparent --bloom)` — a
filled disc whose edge ran to 145% of the gradient ray. Two layers offset by half a cycle meant
at least one was near-fully open at almost every moment, so their union lit every dot and the
effect read as static.

The mask is now an expanding annulus: transparent inside `--bloom - 26%`, opaque from
`--bloom - 9%` to `--bloom`, transparent again by `--bloom + 11%`. Travel caps at 128% and starts
at 0% so the ring emerges from the centre. The unlit dot layer dropped from 25% to 15% opacity so
the lit band reads against it.

### Evidence

Two screenshots 0.9 s apart during one render: the lit ring sits as an outer band with a dark
centre at **33%**, then has collapsed inward and downward at **67%**. Previously the same capture
showed every dot lit identically.

The earlier "verified" reading — `--bloom: 140.315%`, `maskImage` containing a radial gradient —
was accurate about the mechanism and useless about the outcome. Computed values confirm a rule
applies; only a screenshot confirms it looks like anything.

## Eighteenth pass: a second client was being starved

Keying media ownership to `{ userId, characterId }` fixed the refresh case but introduced a
worse one: `socketFor` returned the **first** matching socket, so with two clients open on the
same story only one received `SCENE_PROGRESS` and `SCENE_IMAGE_READY`. The other sat on the
painting state until its timeout — the reported symptom was a phone showing the finished image
while a desktop counted up to 93 s.

`socketsFor` now returns every matching socket and the relay sends to all of them, for progress,
scene images and sentence audio alike.

The client also only expired the painting mark it seeded at load. A repaint or a narrative
rewrite could pin the state forever if its message never arrived. `startPainting` and
`stopPainting` are now the single way in and out, and every mark expires after
`RENDER_TIMEOUT_MS`.

### Evidence

Two sockets on one account and character, one repaint: **client A 12 progress, 1 ready; client B
12 progress, 1 ready**. Before the fix the second client received nothing.

`bun run check` green: audit PASS, zero comments PASS, lint clean, typecheck 6/6.

## Nineteenth pass: the first scene was not really full screen

Infinite Worlds promises that each scene "opens full screen, types its opening line, then folds
into a card". It opened across the whole column, and the column is not the screen: the composer
is docked below it and the header above it, so the input box stayed lit under the art for the
entire opening. A replay of that same scene does read as full screen, because `ReplayOverlay`
renders its `SceneStage` inside `fixed inset-0 z-50 bg-canvas`, while the opening rendered one
inline with `relative -mx-4 min-h-full`.

The cinematic branch of `SceneStage` now uses that shell itself: `fixed inset-0 z-30
overflow-hidden bg-canvas`. One presentation, two ways in. The section is still the element
`useElementSize` measures and it still carries no padding, so `contentRect` and the cover maths
that centre the art against the viewport stay exact.

`z-30` rather than the replay's `z-50`, because the ladder in this client is 10 / 20 (sticky) /
40 (dice) / 50 (dialogs, popups, replay) and the scene view has to sit under the dice. A check is
adjudicated before the narrative streams — `turnSession.ts` sends `DICE_CHECK_REQUIRED` on its way
into `streamNarrative` — so the D20 lands while the opening is still cinematic. At `z-50` the roll
would have been behind the shell.

The shell is a class swap on the element that was already there, not a second `SceneStage`, so
the sentence reveal, the audio gate, the single `layoutId` and the `layout` animation that folds
the art into its card at `endCinematic` are the ones that were there before.

- **The caption moved to the viewport edge**, so it carries `pb-[max(1.5rem,var(--safe-bottom))]`
  — the `AppModal` pattern — because `index.html` is `viewport-fit=cover` and the strip no longer
  sits inside the root's safe-area padding.
- **The transcript cannot scroll out from under the fold.** While cinematic the column is
  `overflow-hidden`, not `overflow-y-auto`: a wheel over the overlay chains to it, and scrolling
  there would unpin `useFollowScroll`, so the fold would land off screen.
- **Replay moved with it.** `ReplayOverlay` passes `phase="cinematic"`, so its art bleeds to the
  viewport edges too. The two are finally the same picture.

### Evidence

- `bun run check` green: audit PASS, zero comments PASS, lint clean, typecheck 6/6.
- `bun run --filter @chronicle/stage build` green, and the emitted stylesheet carries the new
  rule `.pb-[max(1.5rem,var(--safe-bottom))]{padding-bottom:max(1.5rem, var(--safe-bottom))}`
  alongside the shell's `.fixed` and `.z-30`.
- **No browser render yet.** The opening has not been watched at 390x844 or 1440x900; that needs
  the director, crew and a model up.

### Follow-ups

- The covered column is not inert: focus stays in the composer's textarea through the opening and
  a keystroke still reaches it. `inert` on the transcript and composer while cinematic is the fix
  if that reads badly in the hand.

## Twentieth pass: the loader told every node the same story

The dot matrix over a painting frame ran one fixed loop whatever the render was doing: the only
per-node thing on the whole card was the number in the corner pill. The first cut of this pass
scaled that loop by the percent, and it failed the only test that matters — on screen the ripple
was still the same ripple, a little wider. A loader that tracks progress has to change *character*
when the render changes, not amplitude.

`ScenePainting` now takes the node's whole `SceneProgress` — percent *and* stage — instead of a
bare percent. The prop became `progress: SceneProgress | null` through `SceneFrame`, `TurnEntry`,
`PlayScript` and `SceneStage`, because percent alone is not enough: `progress.ts` maps ComfyUI's
`progress` message per sampler node, so the number runs 0 → 100 for the base sampler and
**restarts** at 0 for the hires sampler. `stage` is the field that tells them apart.

`ScenePainting` sets `data-stage` — `progress?.stage ?? "waiting"`, so no case falls through —
plus a unitless `--render-progress` and `--matrix-elapsed`. `styles/scene-painting.css` holds the
mapping, one rule per stage:

- **Sketch is one ripple, churning.** A coarse lattice closing from 18px to 10px, one ripple on a
  2.6s cycle.
- **Detail is two ripples, settling.** The `dot-bloom-offset` layer wakes up (`animation: none` in
  every other stage), so two ripples interleave at half-cycle offset on a 4.4s cycle, over a
  lattice that carries on closing from 10px to 7px.
- **The ripple's travel follows the pass.** 34% → 76% across the sketch, 62% → 128% across the
  detail, as `var(--matrix-reach, 128%)` on the keyframe endpoint. At 10% the light stays near the
  centre; at 95% it leaves the frame.
- **Still frame.** `--matrix-still` gives `Motion: off` and `prefers-reduced-motion` the same
  information without the travel: 17% → 38% across the sketch, 31% → 64% across the detail.
- **Silence still moves.** With no report the elapsed seconds drive the lattice and the reach —
  `clamp(9px, 14px - 0.06px * elapsed, 14px)` and `clamp(64%, 64% + 1% * elapsed, 112%)` — so a
  ComfyUI that publishes no step progress still gets a matrix that tightens, and the pill's `37s`
  means something.
- **10px on both sides** of the pass boundary, so the lattice never snaps back when the sampler
  restarts its counter.

`SceneFrame` passes the object straight through, so a repainted history turn and the full-screen
opening are driven by their own node's numbers, not by whichever render happened to be live.

The file split was forced, not planned: adding the mapping took `motion.css` to 312 lines against
the 300 ceiling and the audit failed the build. The dot matrix and the cycling captions left for
`styles/scene-painting.css`, which is where the painting placeholder's motion belongs. `motion.css`
is back to 175 lines and holds press, lift, drift and the disclosure panel.

### Evidence

- `bun run check` green: audit PASS (the line ceiling included), zero comments PASS, lint clean,
  typecheck 6/6.
- `bun run --filter @chronicle/stage build` green, and the minified sheet carries all three lanes:
  `[data-stage=waiting]{--matrix-pitch:clamp(9px, 14px - .06px * var(--matrix-elapsed,0), 14px);…}`,
  sketch's `calc(18px - 8px * …)` and `calc(34% + 42% * …)`, detail's `calc(10px - 3px * …)` and
  `calc(62% + 66% * …)`, the detail overrides (`animation-duration:4.4s`, and its offset twin on
  `-2.2s`), and `to{--bloom:var(--matrix-reach,128%);opacity:0}`.
- **No browser render yet**, which is exactly how the first cut of this pass got through: the
  numbers were right and the picture was wrong. The one-ripple sketch and the two-ripple detail
  state have not been watched.

### Follow-ups

- The keyframe endpoint is `var(--matrix-reach, 128%)` inside `@property --bloom` (`<percentage>`).
  Registered custom property plus `var()` in a keyframe is standard, but it has not been run on a
  real browser, and the symptom of it failing would be a ripple that never leaves the centre. The
  fallback keeps the sweep, so the way to test it is one repaint with progress coming in.
- The card variant's three captions still cycle on a fixed 7.5s `stage-cycle`, so "The last details
  settle" can appear while the sketch pass is still running. Only the cinematic caption reads the
  real stage, from `STAGE_LABEL`.
- The counter pill still names nothing when the server is silent — it shows `37s`. The matrix now
  tightens on those seconds but the text does not say what they are.

