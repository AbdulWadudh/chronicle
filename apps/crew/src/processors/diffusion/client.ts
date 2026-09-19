import { env } from "@chronicle/config";

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

function base(): string {
  return env().DIFFUSION_ENDPOINT.replace(/\/+$/u, "");
}

export async function submit(workflow: Record<string, unknown>, clientId: string): Promise<string> {
  const response = await fetch(`${base()}/prompt`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt: workflow, client_id: clientId }),
  });
  if (!response.ok) {
    throw new Error(
      `ComfyUI rejected the prompt with ${response.status}: ${await response.text()}`,
    );
  }
  const body = (await response.json()) as { prompt_id?: string };
  if (body.prompt_id === undefined) throw new Error("ComfyUI returned no prompt_id");
  return body.prompt_id;
}

export async function waitForImages(promptId: string): Promise<ComfyImage[]> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const response = await fetch(`${base()}/history/${promptId}`);
    if (response.ok) {
      const history = (await response.json()) as Record<string, HistoryEntry>;
      const images = collectImages(history[promptId]);
      if (images.length > 0) return images;
    }
    await Bun.sleep(POLL_INTERVAL_MS);
  }
  throw new Error(`ComfyUI timed out after ${POLL_TIMEOUT_MS}ms for prompt ${promptId}`);
}

function collectImages(entry: HistoryEntry | undefined): ComfyImage[] {
  if (entry?.outputs === undefined) return [];
  return Object.values(entry.outputs).flatMap((output) => output.images ?? []);
}

export async function fetchImage(image: ComfyImage): Promise<Uint8Array> {
  const query = new URLSearchParams({
    filename: image.filename,
    subfolder: image.subfolder,
    type: image.type,
  });
  const response = await fetch(`${base()}/view?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`ComfyUI image fetch failed with ${response.status}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

interface ObjectInfo {
  CheckpointLoaderSimple?: { input?: { required?: { ckpt_name?: unknown[] } } };
}

export async function listCheckpoints(): Promise<string[]> {
  const response = await fetch(`${base()}/object_info/CheckpointLoaderSimple`);
  if (!response.ok) throw new Error(`ComfyUI object_info failed with ${response.status}`);
  const info = (await response.json()) as ObjectInfo;
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
