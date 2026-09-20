# Changelog

Short, user-facing summary. The long form — why, what was measured, what was rejected — lives in
`changelog/<year>/<month>/`.

## Unreleased

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
