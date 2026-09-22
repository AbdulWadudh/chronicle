import { API } from "@chronicle/config";
import { readToken } from "~/lib/session";

let current: HTMLAudioElement | null = null;
let currentUrl: string | null = null;

function release(): void {
  current?.pause();
  current = null;
  if (currentUrl !== null) URL.revokeObjectURL(currentUrl);
  currentUrl = null;
}

export async function previewVoice(voiceId: string): Promise<void> {
  release();
  const token = readToken();
  const response = await fetch(`${API.voices}/${encodeURIComponent(voiceId)}/preview`, {
    headers: token === null ? {} : { authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("That voice could not be previewed.");

  currentUrl = URL.createObjectURL(await response.blob());
  const player = new Audio(currentUrl);
  current = player;
  await new Promise<void>((resolve) => {
    player.addEventListener("ended", () => resolve(), { once: true });
    player.addEventListener("error", () => resolve(), { once: true });
    void player.play().catch(() => resolve());
  });
}
