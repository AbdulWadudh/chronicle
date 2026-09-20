import { env } from "@chronicle/config/env";
import { fetchBytes, fetchJson } from "@chronicle/utils";

const POLL_INTERVAL_MS = 400;
const POLL_TIMEOUT_MS = 180_000;

export interface ComfyImage {
  filename: string;
  subfolder: string;
  type: string;
}

interface HistoryEntry {
  outputs?: Record<string, { images?: ComfyImage[] }>;
}

interface ObjectInfo {
  CheckpointLoaderSimple?: { input?: { required?: { ckpt_name?: unknown[] } } };
}

export async function submit(workflow: Record<string, unknown>, clientId: string): Promise<string> {
  const body = await fetchJson<{ prompt_id?: string }>(`${env().DIFFUSION_ENDPOINT}/prompt`, {
    body: { prompt: workflow, client_id: clientId },
  });
  if (body.prompt_id === undefined) throw new Error("ComfyUI returned no prompt_id");
  return body.prompt_id;
}

export async function waitForImages(promptId: string): Promise<ComfyImage[]> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const history = await fetchJson<Record<string, HistoryEntry>>(
      `${env().DIFFUSION_ENDPOINT}/history/${promptId}`,
    );
    const images = collectImages(history[promptId]);
    if (images.length > 0) return images;
    await Bun.sleep(POLL_INTERVAL_MS);
  }
  throw new Error(`ComfyUI timed out after ${POLL_TIMEOUT_MS}ms for prompt ${promptId}`);
}

function collectImages(entry: HistoryEntry | undefined): ComfyImage[] {
  if (entry?.outputs === undefined) return [];
  return Object.values(entry.outputs).flatMap((output) => output.images ?? []);
}

export function fetchImage(image: ComfyImage): Promise<Uint8Array> {
  const query = new URLSearchParams({
    filename: image.filename,
    subfolder: image.subfolder,
    type: image.type,
  });
  return fetchBytes(`${env().DIFFUSION_ENDPOINT}/view?${query.toString()}`);
}

export async function listCheckpoints(): Promise<string[]> {
  const info = await fetchJson<ObjectInfo>(
    `${env().DIFFUSION_ENDPOINT}/object_info/CheckpointLoaderSimple`,
  );
  const names = info.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0];
  return Array.isArray(names) ? names.map(String) : [];
}

function basename(value: string): string {
  return value.split("/").pop() ?? value;
}

export async function resolveCheckpoint(requested: string): Promise<string> {
  const available = await listCheckpoints();
  if (available.length === 0) throw new Error("ComfyUI reports no checkpoints installed");

  const normalized = requested.replaceAll("\\", "/");
  const exact = available.find((name) => name.replaceAll("\\", "/") === normalized);
  if (exact !== undefined) return exact;

  const wanted = basename(normalized).toLowerCase();
  const matches = available.filter(
    (name) => basename(name.replaceAll("\\", "/")).toLowerCase() === wanted,
  );
  if (matches.length === 1 && matches[0] !== undefined) return matches[0];
  if (matches.length > 1) {
    throw new Error(`Checkpoint "${requested}" is ambiguous: ${matches.join(", ")}`);
  }
  throw new Error(`Checkpoint "${requested}" not found. Available: ${available.join(", ")}`);
}
