import { API } from "@chronicle/config";
import type { ComposeContext, ComposeMode, ComposeTarget } from "@chronicle/utils";
import { useCallback, useState } from "react";
import { post } from "~/lib/api";

interface Pending {
  target: ComposeTarget;
  mode: ComposeMode;
}

export interface Compose {
  run: (
    target: ComposeTarget,
    mode: ComposeMode,
    context: Partial<ComposeContext>,
    worldId?: string | null,
  ) => Promise<string | null>;
  modeFor: (target: ComposeTarget) => ComposeMode | null;
  error: string | null;
  clearError: () => void;
}

export function useCompose(): Compose {
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (
      target: ComposeTarget,
      mode: ComposeMode,
      context: Partial<ComposeContext>,
      worldId: string | null = null,
    ): Promise<string | null> => {
      setPending({ target, mode });
      setError(null);
      try {
        const result = await post<{ value: string }>(API.compose, {
          target,
          mode,
          worldId,
          context,
        });
        return result.value;
      } catch (cause) {
        setError(
          cause instanceof Error && cause.message.length > 0
            ? cause.message
            : "The game master did not answer.",
        );
        return null;
      } finally {
        setPending(null);
      }
    },
    [],
  );

  const modeFor = useCallback(
    (target: ComposeTarget): ComposeMode | null =>
      pending !== null && pending.target === target ? pending.mode : null,
    [pending],
  );

  return { run, modeFor, error, clearError: () => setError(null) };
}
