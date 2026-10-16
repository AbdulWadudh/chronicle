import { createContext, type ReactNode, useContext } from "react";
import type { CharacterSummary } from "~/lib/entities";

const NO_CAST: readonly CharacterSummary[] = [];

const CastContext = createContext<readonly CharacterSummary[]>(NO_CAST);

export function CastProvider({
  cast,
  children,
}: {
  cast: readonly CharacterSummary[];
  children: ReactNode;
}) {
  return <CastContext.Provider value={cast}>{children}</CastContext.Provider>;
}

export function useCast(): readonly CharacterSummary[] {
  return useContext(CastContext);
}
