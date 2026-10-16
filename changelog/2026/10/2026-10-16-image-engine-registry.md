# Wave 11 — Image engine registry, Klein scenes, prose prompts

**Commit:** `228dafe` — 2026-10-16
**Scope:** 39 files changed, 1372 insertions, 438 deletions

## Why

The SDXL Lightning pipeline was the only image engine and every setting was a flat key on
`image.*`. Wave 11 in `LLM_STATE.md` introduced FLUX.2 Klein as a scene engine — fewer steps,
reference-based identity (no PuLID), prose prompts instead of weighted tags. Making it
switchable without config rewrites needed a registry, a discriminated render type, and a
separate ComfyUI workflow.

The client also lacked speaker attribution in the narrative stream — all text rendered the same,
and `Name:` prefixes appeared raw. The audio queue had a stale-closure bug that let clips play
under held narration.

## What was built

### Image engine registry (`packages/config/src/imageEngines.ts`)

A new file owns `IMAGE_ENGINES`, `IMAGE_ENGINE_IDS`, `KLEIN_BOUNDS`, `SDXL_BOUNDS`,
`kleinSettingsSchema`, `sdxlSettingsSchema`, and `checkpointSchema` (moved from `settings.ts`).
Each engine has an `id`, `label`, `blurb`, `identity` strategy (`reference` vs `pulid`), a
`prose` flag, and its bounds.

### Settings restructure (`packages/config/src/settings.ts`)

The flat `image.*` schema was replaced with:

```ts
image: {
  engine: "klein" | "sdxl",       // default "klein"
  portraitEngine: "klein" | "sdxl", // default "sdxl"
  quality: number,
  klein: KleinSettings,
  sdxl: SdxlSettings,
}
```

`SETTING_BOUNDS.image` was slimmed to just `quality`. The patch schema uses an explicit
`imagePatchSchema` with `patchOf(kleinSettingsSchema)` and `patchOf(sdxlSettingsSchema)` for
deep merge support — `patchOf(imageSchema)` could not deep-merge nested engine objects.

### Render params (`packages/utils/src/jobs.ts`)

`RenderParams` is now a discriminated union on `engine`:

- `klein`: `model`, `textEncoder`, `vae`, `steps` (no cfg, no negative, no upscale)
- `sdxl`: `checkpoint`, `steps`, `cfg`, `sampler`, `scheduler`, `upscale`, `upscaleDenoise`,
  `negativePrompt`, `identity`

Diffusion jobs carry `render: RenderParams` instead of flat image params.

### Prose prompt builder (`apps/director/src/engine/prompt/prose.ts`)

For Klein's text encoder (Qwen3 4B), prompts are plain English sentences:

> "The man in image 1 is Kaelen Thorne, lean, dark hair, wearing worn leather jacket."

No parenthesised weights, no BREAK tokens, no negative prompt. `PROSE` constants in
`@chronicle/config/prompts` define shot framing, anatomy rules, and head-count constraints.

`buildProseScenePrompt`, `buildProsePortraitPrompt`, and `buildProseCoverPrompt` parallel the
existing tag builders. `imagery.ts` now builds both `prompt.tags` and `prompt.prose`, passing
whichever the engine needs.

Tested in `prose.test.ts` — reference indexing, pronoun substitution, and unreferenced cast
descriptions.

### Klein ComfyUI workflow (`apps/crew/src/processors/diffusion/workflows/klein.ts`)

A 73-line graph builder that wires:

- `UNETLoader` → Klein 4B fp8
- `CLIPLoader type=flux2` → Qwen3 4B encoder
- `VAELoader` → flux2-vae
- `EmptyFlux2LatentImage` at `render.width × render.height`
- `Flux2Scheduler` for sigma schedule
- Per-portrait: `LoadImage → ImageScaleToTotalPixels → VAEEncode → ReferenceLatent`, chained
  into the conditioning
- `CFGGuider cfg=1`, `ConditioningZeroOut` as the negative
- `SamplerCustomAdvanced` → `VAEDecode` → `SaveAnimatedWEBP`

### Workflow dispatcher (`apps/crew/src/processors/diffusion/workflows/index.ts`)

`buildWorkflow(render, prefix, portraits)` dispatches to `buildKleinWorkflow` or
`buildSdxlWorkflow` based on `render.engine`. Old `workflow.ts` renamed to `workflows/sdxl.ts`
with the same logic, plus a shared `saveNode` extracted to `workflows/save.ts`.

### Passage component (`apps/stage/src/components/story/Passage.tsx`)

Groups consecutive sentences by `speakerId` into runs. Narration renders as `<p>` elements;
a spoken run gets:

- A `SpeakerChip` with a 20 px avatar and the character name in small caps
- A primary-tinted 2 px left border
- Italic text

`NarrativeStream` delegates to `Passage` and no longer owns its own `motion.p` loop.

`CastProvider` (React context) supplies the world cast from `useCharacterSheet` so `Passage`
can resolve `speakerId → CharacterSummary` without prop drilling.

### Admin image group (`apps/stage/src/routes/admin/ImageGroup.tsx`)

Two `EnginePicker` cards (scenes+covers, portraits) with `aria-pressed` toggle buttons.
A shared quality slider. Then per-engine tunable fields rendered under an uppercase heading,
only for engines currently in use. SDXL shows its `DiffusionPresets` above its fields.

Field metadata split to `imageFields.ts` with separate `klein` and `sdxl` sections, keyed
as `image.klein` and `image.sdxl` in the `FIELD_META` lookup.

### Audio queue improvements (`apps/stage/src/hooks/useAudioQueue.ts`)

- **`playingSentenceSeconds`**: reads `player.duration` from the `loadedmetadata` event and
  exposes it for progress display.
- **Stale hold fix**: the drain loop now reads `heldRef.current` (a ref) instead of closing
  over the `held` prop, which went stale across re-renders.
- **Interrupted clip re-queue**: if `releaseVoice` interrupts a playing clip (e.g. hold toggles
  on), the settle callback receives `finished: false` and the clip URL is put back into the
  pending map instead of being dropped.

### Replay reveal delay (`apps/stage/src/hooks/useCinematic.ts`)

`replayRevealing` is true for 1600 ms after `markReplay` fires. While true, `holdNarration`
is set, which pauses the audio queue so the scene image has time to appear before narration
starts.

## What was rejected

- An AVIF save path through `SaveImageAdvanced`: the V3 node's dynamic combo is unreachable
  via the plain `/prompt` API, so WebP stays the only format.
- A second sampling pass (latent hires fix) on Klein: latent upsampling at low denoise only
  interpolates, it doesn't add detail. Native resolution at `renderScale: 1.5` is sharper.

## Measurements

See `LLM_STATE.md` Wave 11 for the full benchmark table. Key numbers:

| Render (832×1216) | Wall | Peak VRAM |
| --- | --- | --- |
| Two portraits, 4 steps | 6.7–8.8 s | 14.7 GB |
| Text only, 4 steps | 2.5 s | 14.6 GB |
| 1248×1824 native, 4 steps | 9.1 s | 13.8 GB |
