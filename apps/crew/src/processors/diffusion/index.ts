import { ASSET_CHANNEL } from "@chronicle/config";
import {
  type AssetReady,
  characterPortraitKey,
  type DiffusionJob,
  diffusionJobSchema,
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
  waitForImages,
} from "~/processors/diffusion/client";
import { forgetPrompt, listenForProgress, watchPrompt } from "~/processors/diffusion/progress";
import { buildWorkflow } from "~/processors/diffusion/workflow";
import { publisher } from "~/redis";
import { upload } from "~/storage";

const CLIENT_ID = "chronicle-crew";

function destination(payload: DiffusionJob): { key: string; contentType: string } {
  if (payload.kind === "cover") {
    return { key: worldCoverKey(payload.worldId), contentType: PORTRAIT_CONTENT_TYPE };
  }
  if (payload.kind === "portrait") {
    return {
      key: characterPortraitKey(payload.worldId, payload.characterId),
      contentType: PORTRAIT_CONTENT_TYPE,
    };
  }
  return {
    key: sceneKey(payload.worldId, payload.characterId, payload.turnId, payload.variant),
    contentType: SCENE_CONTENT_TYPE,
  };
}

function announcement(payload: DiffusionJob, imageUrl: string): AssetReady {
  if (payload.kind === "cover") return { kind: "cover", worldId: payload.worldId, imageUrl };
  if (payload.kind === "portrait") {
    return { kind: "portrait", characterId: payload.characterId, imageUrl };
  }
  return { kind: "scene", turnId: payload.turnId, imageUrl };
}

export async function renderImage(job: Job<DiffusionJob>): Promise<string> {
  const payload = diffusionJobSchema.parse(job.data);
  const label = payload.kind === "scene" ? payload.turnId : payload.worldId;

  const checkpoint = await resolveCheckpoint(payload.checkpoint);
  listenForProgress(CLIENT_ID);
  const promptId = await submit(buildWorkflow({ ...payload, checkpoint }, label), CLIENT_ID);
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

export { buildWorkflow } from "~/processors/diffusion/workflow";
