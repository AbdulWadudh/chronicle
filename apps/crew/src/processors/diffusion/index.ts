import { ASSET_CHANNEL } from "@chronicle/config";
import {
  type AssetReady,
  characterDraftPortraitKey,
  characterPortraitKey,
  type DiffusionJob,
  diffusionJobSchema,
  fetchBytes,
  imageChannel,
  PORTRAIT_CONTENT_TYPE,
  SCENE_CONTENT_TYPE,
  sceneKey,
  worldCoverKey,
} from "@chronicle/utils";
import type { Job } from "bullmq";
import {
  type ComfyImage,
  fetchImage,
  resolveCheckpoint,
  submit,
  uploadImage,
  waitForImages,
} from "~/processors/diffusion/client";
import { forgetPrompt, listenForProgress, watchPrompt } from "~/processors/diffusion/progress";
import { buildWorkflow } from "~/processors/diffusion/workflows";
import { publisher } from "~/redis";
import { upload } from "~/storage";

const CLIENT_ID = "chronicle-crew";

function destination(payload: DiffusionJob): { key: string; contentType: string } {
  if (payload.kind === "cover") {
    return { key: worldCoverKey(payload.worldId), contentType: PORTRAIT_CONTENT_TYPE };
  }
  if (payload.kind === "portrait") {
    const key = payload.draft
      ? characterDraftPortraitKey(payload.worldId, payload.characterId)
      : characterPortraitKey(payload.worldId, payload.characterId);
    return { key, contentType: PORTRAIT_CONTENT_TYPE };
  }
  return {
    key: sceneKey(payload.worldId, payload.characterId, payload.turnId, payload.variant),
    contentType: SCENE_CONTENT_TYPE,
  };
}

function announcement(payload: DiffusionJob, imageUrl: string): AssetReady {
  if (payload.kind === "cover") return { kind: "cover", worldId: payload.worldId, imageUrl };
  if (payload.kind === "portrait") {
    return { kind: "portrait", characterId: payload.characterId, imageUrl, draft: payload.draft };
  }
  return { kind: "scene", turnId: payload.turnId, imageUrl };
}

async function preparePortraits(urls: readonly string[]): Promise<string[]> {
  const filenames: string[] = [];
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    if (url === undefined) continue;
    try {
      const bytes = await fetchBytes(url);
      const extension = (url.split("?")[0] ?? url).split(".").pop() ?? "png";
      const filename = `portrait-${i}-${Date.now()}.${extension}`;
      const uploaded = await uploadImage(bytes, filename);
      filenames.push(uploaded);
    } catch (error) {
      console.error("[crew] failed to upload portrait to ComfyUI:", error);
    }
  }
  return filenames;
}

export async function renderImage(job: Job<DiffusionJob>): Promise<string> {
  const payload = diffusionJobSchema.parse(job.data);
  const label = payload.kind === "scene" ? payload.turnId : payload.worldId;

  const render =
    payload.render.engine === "sdxl"
      ? { ...payload.render, checkpoint: await resolveCheckpoint(payload.render.checkpoint) }
      : payload.render;
  const portraitFilenames =
    payload.render.portraitUrls.length > 0
      ? await preparePortraits(payload.render.portraitUrls)
      : [];

  listenForProgress(CLIENT_ID);
  const promptId = await submit(buildWorkflow(render, label, portraitFilenames), CLIENT_ID);
  if (payload.kind === "scene") watchPrompt(promptId, payload.turnId);

  let images: ComfyImage[];
  try {
    images = await waitForImages(promptId);
  } finally {
    forgetPrompt(promptId);
  }

  const first = images[0];
  if (first === undefined) {
    throw new Error(`ComfyUI produced no ${payload.kind} image for ${label}`);
  }

  const { key, contentType } = destination(payload);
  const imageUrl = await upload(key, await fetchImage(first), contentType);

  await publisher().publish(ASSET_CHANNEL, JSON.stringify(announcement(payload, imageUrl)));
  if (payload.kind === "scene") {
    await publisher().publish(
      imageChannel(payload.turnId),
      JSON.stringify({ turnId: payload.turnId, imageUrl }),
    );
  }
  return imageUrl;
}
