import { API } from "@chronicle/config";
import type { AdminHealthReport } from "@chronicle/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, get } from "~/lib/api";

const POLL_MS = 15_000;

export type HealthPhase = "loading" | "ready" | "denied" | "unreachable";

export interface HealthController {
  phase: HealthPhase;
  report: AdminHealthReport | null;
  refreshing: boolean;
  reload: () => void;
}

export function useHealth(): HealthController {
  const [phase, setPhase] = useState<HealthPhase>("loading");
  const [report, setReport] = useState<AdminHealthReport | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const generation = useRef(0);
  const reportRef = useRef<AdminHealthReport | null>(null);
  reportRef.current = report;

  const load = useCallback(async (initial: boolean): Promise<void> => {
    const ticket = ++generation.current;
    if (!initial) setRefreshing(true);
    try {
      const next = await get<AdminHealthReport>(`${API.admin}/health`);
      if (ticket !== generation.current) return;
      setReport(next);
      setPhase("ready");
    } catch (cause) {
      if (ticket !== generation.current) return;
      if (cause instanceof ApiError && (cause.status === 401 || cause.status === 403)) {
        setPhase("denied");
      } else if (reportRef.current === null) {
        setPhase("unreachable");
      }
    } finally {
      if (ticket === generation.current) setRefreshing(false);
    }
  }, []);

  const reload = useCallback((): void => {
    void load(false);
  }, [load]);

  useEffect(() => {
    void load(true);
    const interval = setInterval(() => void load(false), POLL_MS);
    return () => {
      clearInterval(interval);
      generation.current += 1;
    };
  }, [load]);

  return { phase, report, refreshing, reload };
}
