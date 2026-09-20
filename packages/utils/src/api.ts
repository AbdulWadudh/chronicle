import { API } from "@chronicle/config";

export function websocketPath(token: string, characterId: string | null): string {
  const query = new URLSearchParams({ token });
  if (characterId !== null) query.set("characterId", characterId);
  return `${API.ws}?${query.toString()}`;
}
