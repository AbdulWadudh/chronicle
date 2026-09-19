export const API = {
  auth: "/api/v1/auth",
  worlds: "/api/v1/worlds",
  characters: "/api/v1/characters",
  turns: "/api/v1/turns",
  settings: "/api/v1/settings",
  admin: "/api/v1/admin",
  ws: "/api/v1/ws",
  health: "/health",
} as const;

export const DIRECTOR = {
  defaultHost: "127.0.0.1",
  defaultPort: 3000,
} as const;

export const BASE_URL = `http://${DIRECTOR.defaultHost}:${DIRECTOR.defaultPort}`;

export function websocketPath(token: string, characterId: string | null): string {
  const query = new URLSearchParams({ token });
  if (characterId !== null) query.set("characterId", characterId);
  return `${API.ws}?${query.toString()}`;
}
