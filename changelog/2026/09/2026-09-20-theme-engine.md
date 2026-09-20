# Theme engine, motion levels and scrollbar control

**Date:** 2026-09-20
**Scope:** apps/stage

## What changed

- `theme/tokens.ts` emits the CSS variables every surface reads, including new
  `--shadow-overlay`, `--hover-lift`, `--press-scale`, `--glass-opacity-overlay` and
  `--scrollbar-width`.
- Motion rules moved out of `global.css` into `styles/motion.css`; scrollbar rules into
  `styles/scrollbar.css`.
- `data-motion` on `<html>` is `off | subtle | full`, gating `.pressable`, `.raise` and
  `rise-in`. `prefers-reduced-motion` is honoured separately and always wins.
- `data-scrollbar` is `full | thin | hidden`. Hidden removes the bar without removing scrolling.
- `ThemeEngine` now fetches the palette list at app start, guarded on a signed-in user.

## Why

Three defects, each of which made the theme look broken rather than merely plain.

**The theme reset on every reload.** `paletteId` was persisted but the palette list was not, and
the only `GET /api/v1/themes` call lived inside a Settings component. On boot the saved theme's
UUID resolved against ten bundled built-ins, found nothing, and fell back to the default — then
snapped in the moment Settings was opened. Palette loading belongs to the app, not a screen, and
the list is now persisted too so the first frame paints correctly.

**Hover grew elements past their container.** `--hover-scale: 1.02` is invisible on a button and
**+20px on a 1036px row** — 10px past the edge on each side, so full-width rows slid underneath
their scroll container. Scaling outward is never safe at arbitrary widths. Hover now translates
into the shadow, with a 2px lift at `shadowOffset: 0`; press still scales, but inward only.

**Sticky elements painted a visible band.** `GlowBackdrop` paints canvas *plus two radial orbs*,
so a sticky wrapper with a flat `bg-canvas` read as a lighter patch. The opaque card is the
sticky element now; the wrapper paints nothing.

## Evidence

- Reload verified on the home screen without visiting Settings: `paletteId` resolves, 12 palettes
  persisted, `canvas #060A14 / primary #3B82F6` correct on first paint.
- Hover geometry on the Runtime row measured before and after: left 200, right 1236, width 1036,
  clip 200–1240 — `overflows left? false right? false`.
- Motion off measured at `shadowOffset: 5`: rest, hover and press all report `transform: none`
  with the shadow intact, so colour and depth survive and only movement goes.

## Follow-ups

- `overlayVignette` is emitted and editable but nothing reads it.
