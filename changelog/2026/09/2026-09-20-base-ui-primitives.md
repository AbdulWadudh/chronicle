# Base UI primitive layer and token discipline

**Date:** 2026-09-20
**Scope:** apps/stage

## What changed

Screens stopped hand-rolling controls. Missing primitives were added to `components/ui` first,
then used.

- New: `dialog` (composable parts), `alert-dialog`, `tooltip`, `menu`, `avatar`,
  `editable-number`.
- `segmented` rebuilt on Base UI `RadioGroup`/`Radio`, which removed a `role="radio"` on a
  `<button>` that `lint/a11y/useSemanticElements` had been failing on.
- `select` rebuilt on Base UI `Combobox`, so every select filters. Same props, so both call sites
  were untouched.
- The Worlds scope tabs were bare `<button role="tab">` elements carrying only a background.
  Replaced with `Segmented`.
- Native `title` tooltips replaced with the themed tooltip primitive.
- **~50 hardcoded radii across 24 files** routed through `--radius-card` / `--radius-control`.
  `rounded-full` survives only where the shape is circular by function.
- **204 bracketed CSS-variable classes across 53 files** converted to Tailwind v4 parentheses
  shorthand: `rounded-[var(--radius-card)]` → `rounded-(--radius-card)`.
- **13 arbitrary pixel lengths across 11 files** moved onto the rem spacing scale.

## Why

Two of these were correctness, not tidiness.

`z.record` with an enum key is **exhaustive** in Zod 4, so the theme save endpoint demanded all 39
tokens and every save returned "the director refused it". `z.partialRecord` accepts a partial
patch and still rejects unknown keys. The typecheck could not catch this; only clicking Save did.

The pixel conversion is a behaviour change, and the desirable kind. Tailwind's spacing scale is
rem and `html` carries `font-size: calc(100% * var(--font-scale))`, so a hardcoded `w-[124px]`
box kept its width while its own text grew with the Text size setting.

## Evidence

- Radius sweep verified at `radius: 0` — `card 0px, control 0px, button 0px, switch 0px`.
- Class rewrite verified in the browser rather than by typecheck, because a wrong class name
  emits no CSS and no error. After the rewrite: button radius 17px, card radius 28px, border 1px,
  shadow `rgb(232,238,249) 8px 8px` — the live token values.
- Spacing conversion measured at two text scales. `w-31` renders **124px** at scale 1.0,
  identical to the old `w-[124px]`, and **161px** at scale 1.3, where the old value stayed 124px.

## Follow-ups

- `Play`, `CharacterSelect` and `Composer` have not been swept for surfaces that opted out of the
  token system the way the Worlds tabs had.
