# Changelog

Short, user-facing summary. The long form — why, what was measured, what was rejected — lives in
`changelog/<year>/<month>/`.

## Unreleased

### Added

- Image engine registry: `IMAGE_ENGINES` in `@chronicle/config` with one config object per model, switchable without config rewrites. Klein is the default scene engine; SDXL stays the default portrait engine.
- FLUX.2 Klein 4B workflow in crew: `workflows/klein.ts` builds a ComfyUI graph with `EmptyFlux2LatentImage`, `Flux2Scheduler`, `ReferenceLatent` for portrait conditioning, and `CFGGuider` at cfg 1.
- Prose prompt dialect for Klein: `engine/prompt/prose.ts` builds plain-sentence prompts ("The man in image 1 is Kaelen Thorne, …") with no SDXL-style weights or negatives. Tested in `prose.test.ts`.
- Prose prompt constants (`PROSE`) in `@chronicle/config/prompts` — shot framing, anatomy, expression, and count constraints for the prose builder.
- `Passage` component groups consecutive sentences by speaker: narration renders as paragraphs; spoken runs get a portrait chip with the name in small caps, a primary-tinted left rule, and italic text.
- `CastProvider` context supplies the world cast to `Passage` and the play screen.
- Admin `ImageGroup` component: two engine pickers (scenes+covers, portraits), shared quality slider, then per-engine tunable fields under their own headings.
- Per-engine field metadata split into `imageFields.ts` (klein and sdxl sections with dedicated labels, hints, and units).
- `RenderParams` discriminated union on `engine` in `packages/utils/src/jobs.ts`; diffusion jobs now carry a typed `render` object instead of flat image params.
- Native `renderScale` (default 1.5×) on Klein; dimensions rounded to the 16-px latent grid.
- `summaryMaxTokens` (900) added to `MEMORY` config to prevent the summariser from overrunning `structured.maxTokens`.
- Audio queue now tracks `playingSentenceSeconds` (clip duration from `loadedmetadata`).
- Replay overlay reveal delay (`replayRevealing` state, 1600 ms) holds narration audio until the scene image has time to appear.

### Changed

- `runtimeSettingsPatchSchema` uses an explicit `imagePatchSchema` with deep-merge support for per-engine settings, replacing the old flat `patchOf(imageSchema)`.
- Image settings schema restructured: top-level `image.engine`, `image.portraitEngine`, and `image.quality`; per-engine tunables nested under `image.klein` and `image.sdxl`. Old flat `image.*` checkpoint/steps/cfg fields removed.
- `SETTING_BOUNDS.image` slimmed to only `quality`; engine-specific bounds live in `KLEIN_BOUNDS` and `SDXL_BOUNDS` inside `imageEngines.ts`.
- `checkpointSchema` moved from `settings.ts` to `imageEngines.ts` (single ownership).
- Director's `imagery.ts` refactored to `buildRender()` which assembles a typed `RenderParams` object, dispatching prompt and negative based on engine. `enqueuePortrait` and `enqueueScene` now build both tag and prose prompts.
- Crew's diffusion pipeline dispatches through `workflows/index.ts` to `klein.ts` or `sdxl.ts` based on `render.engine`. Old `workflow.ts` renamed to `workflows/sdxl.ts`.
- `NarrativeStream` delegates sentence rendering to `Passage`, removing its own inline `motion.p` loop.
- Audio queue holds narration when `heldRef.current` is true (checked inside the drain loop), and re-queues a sentence if playback is interrupted mid-clip.
- Admin Runtime screen renders `ImageGroup` for the `image` section instead of generic `SettingRow` fields.

### Fixed

- Summariser no longer overruns `structured.maxTokens` (was 400, now governed by `MEMORY.summaryMaxTokens` at 900).
- Audio queue drain loop no longer closes over a stale `held` value; uses a ref to check current hold state on every iteration.

---

## Wave 6 — Theme studio, saved themes, admin (2026-09-20)

### Added

- Theme studio: ten built-in palettes, a live preview, and per-section merging from any preset.
- Save, rename, update and delete your own themes. Leave the name blank and one is invented.
- A diff of unsaved token edits, shown before saving or overwriting, each row droppable on its own.
- Component motion and scrollbar controls, plus a toast corner setting with live testers.
- Role-based admin with an Accounts screen that refuses to demote the last admin.
- Account endpoints for display name and avatar.

### Changed

- `packages/shared` renamed to `packages/utils`; values live in `@chronicle/config`.
- Every corner, border and shadow now reads a theme token, so `radius: 0` is genuinely square.
- Settings sections collapse by default and controls sit right at every width.
- Sign-in is a single centred column.

### Fixed

- The saved theme no longer resets on reload.
- Raising the hard shadow on any palette now shows a shadow; it defaulted to fully transparent.
- Hover no longer pushes full-width rows under their container.
- Saving a theme no longer fails with "the director refused it".
- The admin gate no longer reads a field the API stopped returning.
