# Theme studio

**Date:** 2026-09-20
**Scope:** apps/stage, apps/director, packages/config, packages/db, packages/utils

## What changed

Appearance settings became a theme studio. A live preview sits at the top of the screen, the
scheme switch is a standalone row above the presets, and every group below it collapses.

- Ten built-in palettes ship as JSON in `packages/config/src/palettes/`, assembled by
  `packages/utils/src/presets/index.ts` and upserted at director startup by id.
- A palette can be applied whole, or **merged** — a dialog picks which sections to lift
  (surfaces, elevation, text, brand, status, shape, fonts) and leaves the rest alone.
- Themes can be **saved, renamed, updated and deleted** through `/api/v1/themes`. A saved theme
  is a `theme_palettes` row with `builtIn: false` and a UUID id; built-ins keep their slug, which
  is how the client tells them apart without an extra column.
- `@faker-js/faker` runs in the director only and names a theme when the field is left blank —
  "Lavender Serene Gecko", not a slug.
- Every numeric token has preset chips plus a click-to-edit value. Out-of-range values are
  allowed and flagged with an amber badge rather than clamped.
- Unsaved edits are listed as `before → after` per token and per scheme, inside both the save
  dialog and the overwrite confirmation, each row droppable on its own.

## Why

The original complaint was that theme changes were not visible. `ThemePreview` and
`ThemePalettes` existed but nothing rendered them, so editing a token changed numbers on a screen
that showed none of them.

Four token bugs made the system look broken even once it was visible:

- `shadowColor` defaulted to `#00000000`. Every palette except neobrutalism inherited a fully
  transparent hard shadow, so raising the Hard shadow slider produced `5px 5px 0 0 #00000000` —
  nothing. It now derives from the scheme's `textPrimary` in `expand()`, which reproduces
  neobrutalism's own values exactly and gives every other palette a visible shadow.
- `--radius-control` was `Math.max(6, round(radius * 0.6))`. The floor meant `radius: 0` still
  rendered 6px corners. Removed.
- `--color-audio-pill` in `@theme` did not match `--color-audio-pill-bg` emitted by
  `toCssVariables`, so that token never reached the UI at all.
- `.rise-in` used `animation-fill-mode: both`, which leaves `transform: none` filled forever and
  silently suppressed every hover and press on the element.

## Evidence

- Press measured over CDP at `shadowOffset: 5` — rest `none` / `5px 5px #FFF`, hover
  `translate(5,5)` with shadow `none`, press adds `scale(0.98)`. At `shadowOffset: 0` the same
  rule yields `scale(1.02)` hover and `scale(0.97)` press.
- `radius: 0` now resolves `card 0px, control 0px, button 0px, switch 0px`.
- Overwrite verified against SQLite: a theme holding `{dark:{}, light:{}}` became **31 tokens per
  scheme** after confirming — `radius: 5`, `primary: #88AAEE`, `shadowOffset: 5`,
  `light.canvas: #DFE5F2`.
- Renaming a built-in is refused at the API, not just hidden in the UI:
  `PATCH /api/v1/themes/neobrutalism` returns **404** and the row still reads `Neobrutalism`.

## Follow-ups

- Saved themes have no owner column, so they are visible to every account on the installation.
  Adding `userId` needs a migration.
- The control-to-card radius ratio is a fixed `0.6` for every palette. neobrutalism.dev uses 1:1.
  Making the ratio a token would let a palette choose.
