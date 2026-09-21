import { env } from "@chronicle/config/env";
import { type ImageStage, progressChannel } from "@chronicle/utils";
import { NODE_HIRES_SAMPLER } from "~/processors/diffusion/workflow";
import { publisher } from "~/redis";

interface ComfyProgress {
  type: string;
  data?: { prompt_id?: string; value?: number; max?: number; node?: string | null };
}

const turnOfPrompt = new Map<string, string>();

let socket: WebSocket | null = null;

function socketUrl(clientId: string): string {
  const base = env().DIFFUSION_ENDPOINT.replace(/^http/u, "ws");
  return `${base}/ws?clientId=${encodeURIComponent(clientId)}`;
}

function relay(raw: string): void {
  const message = JSON.parse(raw) as ComfyProgress;
  if (message.type !== "progress") return;

  const { prompt_id: promptId, value, max, node } = message.data ?? {};
  if (promptId === undefined || value === undefined || max === undefined || max <= 0) return;

  const turnId = turnOfPrompt.get(promptId);
  if (turnId === undefined) return;

  const stage: ImageStage = node === NODE_HIRES_SAMPLER ? "detail" : "sketch";
  void publisher().publish(progressChannel(turnId), JSON.stringify({ turnId, value, max, stage }));
}

export function listenForProgress(clientId: string): void {
  if (socket !== null) return;

  const opened = new WebSocket(socketUrl(clientId));
  socket = opened;

  opened.onmessage = (event) => {
    if (typeof event.data !== "string") return;
    try {
      relay(event.data);
    } catch (error) {
      console.error("[crew] could not relay render progress:", error);
    }
  };
  opened.onclose = () => {
    if (socket === opened) socket = null;
  };
  opened.onerror = () => {
    console.error("[crew] the ComfyUI progress socket failed");
  };
}

export function watchPrompt(promptId: string, turnId: string): void {
  turnOfPrompt.set(promptId, turnId);
}

export function forgetPrompt(promptId: string): void {
  turnOfPrompt.delete(promptId);
}
