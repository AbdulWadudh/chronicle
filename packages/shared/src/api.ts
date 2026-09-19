export const API_VERSION = 1;
export const API_PREFIX = `/api/v${API_VERSION}` as const;
export const AUTH_PREFIX = `${API_PREFIX}/auth` as const;
export const WS_PATH = `${API_PREFIX}/ws` as const;
export const HEALTH_PATH = "/health" as const;

export const DEFAULT_DIRECTOR_PORT = 3000;
export const DEFAULT_DIRECTOR_HOST = "127.0.0.1";

export function directorUrl(host: string, port: number): string {
  return `http://${host}:${port}`;
}

export function websocketPath(token: string, characterId: string | null): string {
  const query = new URLSearchParams({ token });
  if (characterId !== null) query.set("characterId", characterId);
  return `${WS_PATH}?${query.toString()}`;
}
