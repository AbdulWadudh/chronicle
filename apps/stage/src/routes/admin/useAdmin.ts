import { API } from "@chronicle/config";
import { useQuery } from "@tanstack/react-query";
import { ApiError, get } from "~/lib/api";
import { useAuth } from "~/lib/auth";
import { queryKeys } from "~/lib/queryKeys";

export type AdminState = "checking" | "admin" | "denied" | "unreachable";

interface AdminResponse {
  role: "user" | "admin";
  email: string;
  name: string;
}

export function useAdmin(): AdminState {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const query = useQuery({
    queryKey: queryKeys.admin(),
    queryFn: () => get<AdminResponse>(API.admin),
    enabled: userId !== null,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  if (userId === null) return "denied";
  if (query.error instanceof ApiError) {
    return query.error.status === 401 || query.error.status === 403 ? "denied" : "unreachable";
  }
  if (query.error !== null) return "unreachable";
  if (query.data === undefined) return "checking";
  return query.data.role === "admin" ? "admin" : "denied";
}
