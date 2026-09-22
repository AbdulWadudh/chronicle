import { env } from "@chronicle/config/env";
import { type ImageStage, progressChannel } from "@chronicle/utils";
import { NODE_HIRES_SAMPLER } from "~/processors/diffusion/workflow";
import { publisher } from "~/redis";

interface ComfyProgress {
  type: string;
  data?: { prompt_id?: string; value?: number; max?: number; node?: string | null };
}

interface Tracked {
  turnId: string;
  value: number;
  max: number;
  stage: ImageStage;
  sentAt: number;
}

const PREVIEW_EVENT = 1;
const PREVIEW_THROTTLE_MS = 600;
const MIME_OF_TYPE: Record<number, string> = { 1: "image/jpeg", 2: "image/png" };

const tracked = new Map<string, Tracked>();

let socket: WebSocket | null = null;
let latest: Tracked | null = null;

function socketUrl(clientId: string): string {
  const base = env().DIFFUSION_ENDPOINT.replace(/^http/u, "ws");
  return `${base}/ws?clientId=${encodeURIComponent(clientId)}`;
}

function publish(entry: Tracked, preview: string | null): void {
  const { turnId, value, max, stage } = entry;
  void publisher().publish(
    progressChannel(turnId),
    JSON.stringify({ turnId, value, max, stage, preview }),
  );
}

function relay(raw: string): void {
  const message = JSON.parse(raw) as ComfyProgress;
  if (message.type !== "progress") return;

  const { prompt_id: promptId, value, max, node } = message.data ?? {};
  if (promptId === undefined || value === undefined || max === undefined || max <= 0) return;

  const turnId = tracked.get(promptId)?.turnId;
  if (turnId === undefined) return;

  const stage: ImageStage = node === NODE_HIRES_SAMPLER ? "detail" : "sketch";
  const entry: Tracked = { turnId, value, max, stage, sentAt: tracked.get(promptId)?.sentAt ?? 0 };
  tracked.set(promptId, entry);
  latest = entry;
  publish(entry, null);
}

function relayPreview(frame: ArrayBuffer): void {
  const entry = latest;
  if (entry === null) return;
  if (Date.now() - entry.sentAt < PREVIEW_THROTTLE_MS) return;

  const view = new DataView(frame);
  if (view.byteLength < 8 || view.getUint32(0, false) !== PREVIEW_EVENT) return;

  const mime = MIME_OF_TYPE[view.getUint32(4, false)];
  if (mime === undefined) return;

  const bytes = new Uint8Array(frame, 8);
  entry.sentAt = Date.now();
  publish(entry, `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`);
}

export function listenForProgress(clientId: string): void {
  if (socket !== null) return;

  const opened = new WebSocket(socketUrl(clientId));
  opened.binaryType = "arraybuffer";
  socket = opened;

  opened.onmessage = (event) => {
    try {
      if (typeof event.data === "string") relay(event.data);
      else if (event.data instanceof ArrayBuffer) relayPreview(event.data);
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
  tracked.set(promptId, { turnId, value: 0, max: 1, stage: "sketch", sentAt: 0 });
}

export function forgetPrompt(promptId: string): void {
  tracked.delete(promptId);
  if (latest !== null && tracked.size === 0) latest = null;
}
