import { API } from "@chronicle/shared";
import { useEffect, useState } from "react";
import { ApiError, get } from "~/lib/api";

export type OwnerState = "checking" | "owner" | "denied" | "unreachable";

interface OwnerResponse {
  isOwner: boolean;
  email: string;
  name: string;
}

let cached: OwnerState | null = null;

export function useOwner(): OwnerState {
  const [state, setState] = useState<OwnerState>(cached ?? "checking");

  useEffect(() => {
    if (cached === "owner" || cached === "denied") return;
    let abandoned = false;

    get<OwnerResponse>(API.admin)
      .then(() => {
        cached = "owner";
        if (!abandoned) setState("owner");
      })
      .catch((cause: unknown) => {
        const denied = cause instanceof ApiError && (cause.status === 403 || cause.status === 401);
        cached = denied ? "denied" : null;
        if (!abandoned) setState(denied ? "denied" : "unreachable");
      });

    return () => {
      abandoned = true;
    };
  }, []);

  return state;
}
