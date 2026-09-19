import { type ChronicleAuth, createAuth, database } from "@chronicle/db";
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
