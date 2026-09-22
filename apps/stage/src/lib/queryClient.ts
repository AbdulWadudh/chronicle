import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "~/lib/api";

const STALE_MS = 30_000;
const RETRIES = 2;

function shouldRetry(failures: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failures < RETRIES;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_MS,
      refetchOnWindowFocus: false,
      retry: shouldRetry,
    },
    mutations: { retry: false },
  },
});
