import { and, asc, count, eq, ne } from "drizzle-orm";
import { db } from "./db";
import { users } from "./schema/auth";

export type UserRole = "user" | "admin";

export interface AccountRow {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  image?: string | null;
}

export async function listAccounts(): Promise<AccountRow[]> {
  return db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.createdAt))
    .all();
}

export async function roleOf(userId: string): Promise<UserRole | null> {
  const row = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .get();
  return row?.role ?? null;
}

async function countAdminsExcept(userId: string): Promise<number> {
  const row = await db
    .select({ total: count() })
    .from(users)
    .where(and(eq(users.role, "admin"), ne(users.id, userId)))
    .get();
  return row?.total ?? 0;
}

export type RoleChange = { ok: true; role: UserRole } | { ok: false; reason: string };

export async function setRole(userId: string, role: UserRole): Promise<RoleChange> {
  const current = await roleOf(userId);
  if (current === null) return { ok: false, reason: "That account no longer exists." };
  if (current === role) return { ok: true, role };
  if (role === "user" && (await countAdminsExcept(userId)) === 0) {
    return {
      ok: false,
      reason: "This is the last admin. Promote another account before stepping down.",
    };
  }
  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));
  return { ok: true, role };
}

export async function promoteFirstAccount(): Promise<string | null> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"))
    .limit(1)
    .get();
  if (existing !== undefined) return null;

  const first = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .orderBy(asc(users.createdAt))
    .limit(1)
    .get();
  if (first === undefined) return null;

  await db
    .update(users)
    .set({ role: "admin", updatedAt: new Date() })
    .where(eq(users.id, first.id));
  return first.email;
}

export interface ProfilePatch {
  name?: string;
  image?: string | null;
}

export async function updateProfile(
  userId: string,
  patch: ProfilePatch,
): Promise<AccountRow | null> {
  await db
    .update(users)
    .set({
      ...(patch.name === undefined ? {} : { name: patch.name }),
      ...(patch.image === undefined ? {} : { image: patch.image }),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  const row = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  return row ?? null;
}
