export const queryKeys = {
  worlds: (scope: string) => ["worlds", scope] as const,
  world: (worldId: string | null) => ["world", worldId] as const,
  characters: (worldId: string | null) => ["characters", worldId] as const,
  character: (characterId: string | null) => ["character", characterId] as const,
  settings: () => ["settings"] as const,
  health: () => ["health"] as const,
  admin: () => ["admin"] as const,
  accounts: () => ["accounts"] as const,
  themes: () => ["themes"] as const,
} as const;
