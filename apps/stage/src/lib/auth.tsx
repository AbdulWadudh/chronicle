import { API } from "@chronicle/shared";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { directorOrigin } from "./api";
import { clearToken, readToken, writeToken } from "./session";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: AuthUser | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (value === null) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

interface AuthResponse {
  token?: string;
  user?: AuthUser;
}

async function authRequest(path: string, body: unknown): Promise<AuthResponse> {
  const response = await fetch(`${directorOrigin()}${API.auth}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as AuthResponse & { message?: string };
  if (!response.ok)
    throw new Error(payload.message ?? `Authentication failed (${response.status})`);
  return payload;
}

async function fetchCurrentUser(token: string): Promise<AuthUser | null> {
  const response = await fetch(`${directorOrigin()}${API.auth}/get-session`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const payload = (await response.json().catch(() => null)) as { user?: AuthUser } | null;
  return payload?.user ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = await readToken();
      const restored = token === null ? null : await fetchCurrentUser(token);
      if (cancelled) return;
      if (restored === null) await clearToken();
      setUser(restored);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const adopt = useCallback(async (payload: AuthResponse) => {
    if (payload.token === undefined || payload.user === undefined) {
      throw new Error("Authentication response was incomplete.");
    }
    await writeToken(payload.token);
    setUser(payload.user);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      await adopt(await authRequest("/sign-in/email", { email, password }));
    },
    [adopt],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      await adopt(await authRequest("/sign-up/email", { name, email, password }));
    },
    [adopt],
  );

  const signOut = useCallback(async () => {
    await clearToken();
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, ready, signIn, signUp, signOut }),
    [ready, signIn, signOut, signUp, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
