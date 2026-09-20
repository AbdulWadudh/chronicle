import { db, schema } from "@chronicle/db";
import {
  type DiffusionJob,
  diffusionJobSchema,
  imageChannel,
  SCENE_CONTENT_TYPE,
  sceneKey,
} from "@chronicle/utils";
import type { Job } from "bullmq";
import { eq } from "drizzle-orm";
import {
  fetchImage,
  resolveCheckpoint,
  submit,
  waitForImages,
} from "~/processors/diffusion/client";
import { buildWorkflow } from "~/processors/diffusion/workflow";
import { publisher } from "~/redis";
import { upload } from "~/storage";

const CLIENT_ID = "chronicle-crew";

export async function renderScene(job: Job<DiffusionJob>): Promise<string> {
  const payload = diffusionJobSchema.parse(job.data);

  const checkpoint = await resolveCheckpoint(payload.checkpoint);
  const promptId = await submit(buildWorkflow({ ...payload, checkpoint }), CLIENT_ID);
  const images = await waitForImages(promptId);
  const first = images[0];
  if (first === undefined) throw new Error(`ComfyUI produced no image for turn ${payload.turnId}`);

  const bytes = await fetchImage(first);
  const imageUrl = await upload(
    sceneKey(payload.worldId, payload.characterId, payload.turnId, payload.variant),
    bytes,
    SCENE_CONTENT_TYPE,
  );

  await db
    .update(schema.turns)
    .set({ sceneImageUrl: imageUrl })
    .where(eq(schema.turns.id, payload.turnId));

  await publisher().publish(
    imageChannel(payload.turnId),
    JSON.stringify({ turnId: payload.turnId, imageUrl }),
  );
  return imageUrl;
}

export { buildWorkflow } from "~/processors/diffusion/workflow";
