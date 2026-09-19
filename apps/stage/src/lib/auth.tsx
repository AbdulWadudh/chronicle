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

type RestoredSession =
  | { outcome: "signed-in"; user: AuthUser }
  | { outcome: "rejected" }
  | { outcome: "unreachable" };

async function restoreSession(token: string): Promise<RestoredSession> {
  let response: Response;
  try {
    response = await fetch(`${directorOrigin()}${API.auth}/get-session`, {
      headers: { authorization: `Bearer ${token}` },
    });
  } catch {
    return { outcome: "unreachable" };
  }

  if (response.status === 401 || response.status === 403) return { outcome: "rejected" };
  if (!response.ok) return { outcome: "unreachable" };

  const payload = (await response.json().catch(() => null)) as { user?: AuthUser } | null;
  if (payload?.user === undefined) return { outcome: "rejected" };
  return { outcome: "signed-in", user: payload.user };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const token = readToken();

    if (token === null) {
      setReady(true);
      return;
    }

    restoreSession(token)
      .then((restored) => {
        if (cancelled) return;
        if (restored.outcome === "rejected") clearToken();
        setUser(restored.outcome === "signed-in" ? restored.user : null);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const adopt = useCallback((payload: AuthResponse) => {
    if (payload.token === undefined || payload.user === undefined) {
      throw new Error("Authentication response was incomplete.");
    }
    writeToken(payload.token);
    setUser(payload.user);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      adopt(await authRequest("/sign-in/email", { email, password }));
    },
    [adopt],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      adopt(await authRequest("/sign-up/email", { name, email, password }));
    },
    [adopt],
  );

  const signOut = useCallback(async () => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, ready, signIn, signUp, signOut }),
    [ready, signIn, signOut, signUp, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
