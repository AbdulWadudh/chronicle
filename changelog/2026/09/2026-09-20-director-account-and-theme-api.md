# Director: theme, account and health endpoints

**Date:** 2026-09-20
**Scope:** apps/director, apps/crew

## What changed

- `/api/v1/themes` — GET list, POST save, PATCH `{ name?, overrides? }`, DELETE. Every write
  refuses a row with `builtIn: true`.
- `/api/v1/account` — PATCH name, POST avatar, DELETE avatar.
- `/api/v1/admin/accounts` — list and role change, behind `requireAdmin`.
- `/api/v1/admin/health` — reachability and latency for the LLM, diffusion, TTS, cache and
  storage.
- `apps/director/src/storage.ts` mirrors the crew helper so the director can write to the assets
  bucket.

## Why

Theme and profile data belong on the server so they survive a browser, and both are trust
boundaries: a theme patch becomes CSS and an avatar becomes a file path in another process.

Avatar upload validates at the boundary — PNG, JPEG or WebP only (415 otherwise) and a 2 MB cap
(413) — and writes to `users/<userId>/avatar.<ext>` through a new `avatarKey` builder in
`@chronicle/utils`, so no call site concatenates a key. The stored URL carries a `?v=` stamp
because the bucket is public-read and a browser would otherwise serve the previous avatar.

`@faker-js/faker` is a director dependency only. It names a saved theme when the field is blank;
putting it in the stage bundle would have cost megabytes of locale data for one cosmetic default.

## Evidence

- Saving with no name produced "Lavender Serene Gecko" — real words, not a slug.
- `PATCH /api/v1/themes/neobrutalism` returns **404** and leaves the row named `Neobrutalism`,
  so the built-in guard is enforced server-side rather than only hidden in the UI.
- Zod 4's `z.record` with an enum key is exhaustive and rejected every partial patch. Replaced
  with `z.partialRecord`, which accepts a partial and still rejects unknown keys.

## Follow-ups

- `theme_palettes` has no owner column, so a saved theme is visible to every account.
- Password change will go through Better Auth's own `/api/v1/auth/change-password` rather than a
  hand-rolled route. The profile screen that calls it is not built yet.
