# Governance: theming rules and the changelog directory

**Date:** 2026-09-20
**Scope:** CLAUDE.md, .claude/rules, changelog

## What changed

- New `.claude/rules/theming.md` — token discipline, hard-shadow derivation, overlay legibility,
  the sticky/`bg-canvas` trap, row layout, and the built-in vs saved palette contract.
- `.claude/rules/ui-animations.md` gains *Press and lift* and *Motion levels*.
- `~/.claude/rules/code.md` gains a Tailwind section; `~/.claude/rules/ui-craft.md` gains
  "Controls sit right".
- `changelog/<year>/<month>/` created, with `CHANGELOG.md` at the root as the short summary.
- `AUTH_OWNER_EMAIL` removed from `.env.example`.

## Why

Several of this session's fixes were for traps that look like style choices and are not, so a
future pass would undo them without a written reason:

- `rise-in` must use `backwards`, never `both`, or the filled `to` keyframe kills hover and press.
- Hover must seat into the shadow rather than scale, because 2% of a full-width row escapes its
  container.
- A hardcoded px length opts out of `--font-scale`, so a box stops growing with its own text.
- An off-scale number can be deliberate — the 17px switch thumb inside a 44px track must move
  with the track, not with a text setting.

The rules also caught themselves: `theming.md` was teaching the old `rounded-[var(--radius-card)]`
bracket syntax in its own example after the codebase had moved to parentheses.

## Evidence

- `bun run audit` passes with no warnings for the first time; `global.css` went 265 → 197 lines
  and `appearance/index.tsx` 255 → a 5-line barrel over four files.

## Follow-ups

- No `bun run release` script exists yet, so changelog entries are written by hand.
