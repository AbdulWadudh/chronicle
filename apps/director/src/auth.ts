import { env } from "@chronicle/config";
import { type ChronicleAuth, createAuth, database, schema } from "@chronicle/db";
import { asc } from "drizzle-orm";
import type { Context, Next } from "hono";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthEnv {
  Variables: {
    user: AuthenticatedUser;
    sessionId: string;
  };
}

let auth: ChronicleAuth | null = null;

export async function getAuth(): Promise<ChronicleAuth> {
  if (auth === null) auth = createAuth(await database());
  return auth;
}

export interface VerifiedSession {
  user: AuthenticatedUser;
  sessionId: string;
}

export async function verifyHeaders(headers: Headers): Promise<VerifiedSession | null> {
  const instance = await getAuth();
  const result = await instance.api.getSession({ headers });
  if (result === null) return null;
  return {
    user: { id: result.user.id, email: result.user.email, name: result.user.name },
    sessionId: result.session.id,
  };
}

export async function verifyToken(token: string): Promise<VerifiedSession | null> {
  const headers = new Headers({ authorization: `Bearer ${token}` });
  return verifyHeaders(headers);
}

export async function requireSession(
  context: Context<AuthEnv>,
  next: Next,
): Promise<Response | undefined> {
  const session = await verifyHeaders(context.req.raw.headers);
  if (session === null) return context.json({ error: "Unauthorized." }, 401);
  context.set("user", session.user);
  context.set("sessionId", session.sessionId);
  await next();
}

let ownerEmail: string | null = null;

async function resolveOwnerEmail(): Promise<string | null> {
  if (ownerEmail !== null) return ownerEmail;
  const configured = env().AUTH_OWNER_EMAIL;
  if (configured !== undefined) {
    ownerEmail = configured.toLowerCase();
    return ownerEmail;
  }
  const db = await database();
  const first = await db
    .select({ email: schema.users.email })
    .from(schema.users)
    .orderBy(asc(schema.users.createdAt))
    .limit(1)
    .get();
  ownerEmail = first?.email.toLowerCase() ?? null;
  return ownerEmail;
}

export async function isOwner(user: AuthenticatedUser): Promise<boolean> {
  const owner = await resolveOwnerEmail();
  return owner !== null && user.email.toLowerCase() === owner;
}

export async function requireOwner(
  context: Context<AuthEnv>,
  next: Next,
): Promise<Response | undefined> {
  const user = context.get("user");
  if (!(await isOwner(user))) {
    return context.json({ error: "This account is not the owner of this installation." }, 403);
  }
  await next();
}
