# Theming rules

Tier rules are global in `~/.claude/rules/config.md`; motion is in `ui-animations.md`.
Tokens are defined in `packages/config` (`theme.ts`) and emitted as CSS variables by
`apps/stage/src/theme/tokens.ts`.

## Every value comes from a token

- No hardcoded radius, colour or border width in a screen or a `components/ui` primitive.
  `rounded-(--radius-card)` for surfaces, `rounded-(--radius-control)` for controls.
- `rounded-full` survives only where the shape is circular by function: the spinner, status dots,
  the alpha-checkerboard swatch. A switch, slider thumb and scrollbar all follow the token.
- `--radius-control` is `round(radius * 0.6)` with **no floor**. A floor makes `radius: 0` a lie.
- Ambient shadows go through `--shadow-overlay`, never a literal `rgb(0 0 0 / …)`.
- A token that nothing reads is a bug: check `@theme` in `global.css` and the kebab-cased name
  `toCssVariables` emits actually match, or the slider moves and nothing happens.

## Sizes follow the text scale

`html` carries `font-size: calc(100% * var(--font-scale))`, so anything sized in rem tracks the
Text size setting and anything sized in px does not.

- Use Tailwind's spacing scale (`w-31`, `min-h-11`) for box sizes, so a control grows with the text
  inside it. A hardcoded `w-[124px]` clips its own label at Text size 1.3.
- Class syntax rules are global, in `~/.claude/rules/code.md`.

## Hard shadow

- `shadowColor` derives from the scheme's `textPrimary` in `expand()` unless a palette sets it,
  so every palette gets a visible hard shadow rather than an invisible `#00000000`.
- `shadowOffset: 0` means soft: `--shadow-overlay` becomes an ambient blur and the press scales.

## Overlays stay readable

Dialogs, selects, popovers and toasts sit over content, so legibility beats the token.

- `--glass-opacity-overlay` floors `glassOpacity` at 0.5.
- Toast tone tints are opaque `color-mix(... var(--color-card))`, never `bg-success/10`, which
  leaves the toast see-through.
- Blur and glass only affect floating surfaces. Nothing flat reads them — the live preview ships
  an "Overlay" button so the sliders can be judged.

## Layout

- A settings row is `PANEL` + `SPLIT` from `routes/settings/appearance/styles.ts`. `SPLIT` is a
  grid at **every** width; a control never stacks left under its label on mobile.
- A sticky element must not paint `bg-canvas`. `GlowBackdrop` adds two radial orbs, so a flat
  canvas patch reads as a lighter band. Let the opaque card be the sticky element.

## Palettes

- Built-in palettes are JSON in `packages/config/src/palettes/`, assembled by
  `packages/utils/src/presets/index.ts`, upserted at director startup by id.
- A saved theme is a `theme_palettes` row with `builtIn: false` and a UUID id; built-ins keep
  their slug. The client tells them apart with that, so no extra column is needed.
- `/api/v1/themes` is GET list, POST save (faker names it when the field is blank),
  PATCH `{ name?, overrides? }`, DELETE. Every write refuses a built-in row.
- Saved themes have **no owner column** — they are visible to every account on the installation.
