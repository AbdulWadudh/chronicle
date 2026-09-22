import { API } from "@chronicle/config";
import type { AdminHealthReport } from "@chronicle/utils";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { ApiError, get } from "~/lib/api";
import { queryKeys } from "~/lib/queryKeys";

const POLL_MS = 15_000;

export type HealthPhase = "loading" | "ready" | "denied" | "unreachable";

export interface HealthController {
  phase: HealthPhase;
  report: AdminHealthReport | null;
  refreshing: boolean;
  reload: () => void;
}

function phaseOf(
  report: AdminHealthReport | undefined,
  error: Error | null,
  pending: boolean,
): HealthPhase {
  if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return "denied";
  if (report !== undefined) return "ready";
  if (pending) return "loading";
  return "unreachable";
}

export function useHealth(): HealthController {
  const query = useQuery({
    queryKey: queryKeys.health(),
    queryFn: () => get<AdminHealthReport>(`${API.admin}/health`),
    refetchInterval: POLL_MS,
    retry: false,
  });

  const reload = useCallback(() => {
    void query.refetch();
  }, [query]);

  return {
    phase: phaseOf(query.data, query.error, query.isPending),
    report: query.data ?? null,
    refreshing: query.isFetching && query.data !== undefined,
    reload,
  };
}
