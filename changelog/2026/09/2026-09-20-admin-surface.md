# Role-based admin surface

**Date:** 2026-09-20
**Scope:** apps/stage, apps/director, packages/db

## What changed

Admin stopped being "the owner's email from an env var" and became a role on the account.

- `users.role` is `"user" | "admin"`, guarded by `requireAdmin` in `apps/director/src/auth.ts`.
  The first account ever created is promoted at startup when no admin exists.
- `/admin/accounts` lists every account and promotes or demotes one. `setRole` refuses to demote
  the last remaining admin and the client surfaces that reason as a toast rather than failing
  silently.
- Role changes confirm first, with distinct copy for promote, demote and self-demote.
- An admin entry appears in the home header — now inside an avatar menu — and only for admins.
- Runtime and Health groups collapse by default, so the admin screens open as an index.

## Why

`GET /api/v1/admin` had already been changed to return `{ role, email, name }`, but
`useOwner.ts` still parsed `{ isOwner, email, name }`. The gate was reading a field that no
longer existed, and the denied-state copy still told the user to "Set AUTH_OWNER_EMAIL on the
director" — a variable that no longer did anything. That line is gone from `.env.example`.

A second defect surfaced during verification. `useAdmin` cached its answer in a module-level
variable with no key. `AuthGate` renders `Worlds` once before its redirect effect runs, so on a
cold load the probe fired before the token existed, took a 401, and pinned `denied` for the life
of the page — the Admin entry never appeared until a manual reload. The cache is now keyed on the
signed-in user id.

## Evidence

- Denied state reproduced without touching the database, by intercepting `/api/v1/admin` to
  return `role: "user"`. The screen renders "Not an admin account" and the home header drops the
  Admin entry.
- Promotion exercised end to end against `%APPDATA%/chronicle/data.db` with approval, then
  reverted. Before and after both read
  `admin abdul@gmail.com` / `user vite-migration@chronicle.test`.
- Last-admin guard: demoting the only admin returns 409 and the toast reads
  "This is the last admin. Promote another account before stepping down."

## Follow-ups

- `/admin/queues`, `/admin/storage`, `/admin/worlds` and `/admin/audit` are still tiles marked
  Soon.
