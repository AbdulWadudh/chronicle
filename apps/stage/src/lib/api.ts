import { API, BASE_URL, DIRECTOR, websocketPath } from "@chronicle/shared";
import Constants from "expo-constants";
import { readToken } from "./session";

export { API };

export function directorOrigin(): string {
  const configured = process.env.EXPO_PUBLIC_DIRECTOR_URL;
  if (typeof configured === "string" && configured.length > 0) return configured;
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  return host === undefined ? BASE_URL : `http://${host}:${DIRECTOR.defaultPort}`;
}

export function websocketUrl(token: string, characterId: string | null): string {
  return `${directorOrigin().replace(/^http/u, "ws")}${websocketPath(token, characterId)}`;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const token = await readToken();
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  if (token !== null) headers.set("authorization", `Bearer ${token}`);

  const response = await fetch(`${directorOrigin()}${path}`, { ...init, headers });
  if (!response.ok) throw new ApiError(response.status, await response.text());
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function patch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

export function remove(path: string): Promise<void> {
  return request<void>(path, { method: "DELETE" });
}
