import { API } from "@chronicle/config";
import { useEffect, useState } from "react";
import { ApiError, get } from "~/lib/api";
import { useAuth } from "~/lib/auth";

export type AdminState = "checking" | "admin" | "denied" | "unreachable";

interface AdminResponse {
  role: "user" | "admin";
  email: string;
  name: string;
}

let cached: { userId: string; state: AdminState } | null = null;

function settled(userId: string | null): AdminState | null {
  if (userId === null || cached === null || cached.userId !== userId) return null;
  return cached.state === "unreachable" ? null : cached.state;
}

export function useAdmin(): AdminState {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState<AdminState>(settled(userId) ?? "checking");

  useEffect(() => {
    if (userId === null) {
      setState("denied");
      return;
    }

    const known = settled(userId);
    if (known !== null) {
      setState(known);
      return;
    }

    let abandoned = false;
    setState("checking");

    get<AdminResponse>(API.admin)
      .then((body) => {
        const next: AdminState = body.role === "admin" ? "admin" : "denied";
        cached = { userId, state: next };
        if (!abandoned) setState(next);
      })
      .catch((cause: unknown) => {
        const denied = cause instanceof ApiError && (cause.status === 403 || cause.status === 401);
        const next: AdminState = denied ? "denied" : "unreachable";
        cached = { userId, state: next };
        if (!abandoned) setState(next);
      });

    return () => {
      abandoned = true;
    };
  }, [userId]);

  return state;
}
