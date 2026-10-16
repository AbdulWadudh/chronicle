export const API = {
  auth: "/api/v1/auth",
  worlds: "/api/v1/worlds",
  characters: "/api/v1/characters",
  turns: "/api/v1/turns",
  settings: "/api/v1/settings",
  account: "/api/v1/account",
  admin: "/api/v1/admin",
  themes: "/api/v1/themes",
  compose: "/api/v1/compose",
  assets: "/api/v1/assets",
  voices: "/api/v1/voices",
  ws: "/api/v1/ws",
  health: "/health",
} as const;

export const DIRECTOR = {
  defaultHost: "127.0.0.1",
  defaultPort: 3000,
} as const;

export const BASE_URL = `http://${DIRECTOR.defaultHost}:${DIRECTOR.defaultPort}`;
