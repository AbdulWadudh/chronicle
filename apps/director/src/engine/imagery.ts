import { IMAGE_SHAPES, IMAGERY, JOB_PRIORITY } from "@chronicle/config";
import { loadSettings } from "@chronicle/db";
import type { Character, ImageParams, World } from "@chronicle/utils";
import { buildCoverPrompt, buildPortraitPrompt, buildScenePrompt } from "~/engine/prompt";
import { diffusionQueue } from "~/queue";

const MAX_SEED = 2_147_483_647;

interface Shape {
  width: number;
  height: number;
}

async function imageParams(
  prompt: string,
  shape?: Shape,
  negativeExtra?: string,
): Promise<ImageParams> {
  const { image } = await loadSettings();
  return {
    prompt,
    negativePrompt:
      negativeExtra === undefined
        ? image.negativePrompt
        : `${image.negativePrompt}, ${negativeExtra}`,
    seed: Math.floor(Math.random() * MAX_SEED),
    checkpoint: image.checkpoint,
    width: shape?.width ?? image.width,
    height: shape?.height ?? image.height,
    steps: image.steps,
    cfg: image.cfg,
    sampler: image.sampler,
    scheduler: image.scheduler,
    upscale: image.upscale,
    upscaleDenoise: image.upscaleDenoise,
  };
}

export async function enqueueCover(world: World): Promise<void> {
  const { prompt } = await loadSettings();
  const params = await imageParams(
    buildCoverPrompt(world, prompt.sceneChars),
    IMAGE_SHAPES.landscape,
  );
  await diffusionQueue.add(
    "cover",
    { ...params, kind: "cover", worldId: world.id },
    { priority: JOB_PRIORITY.cover },
  );
}

export async function enqueuePortrait(
  world: World,
  character: Character,
  override?: string,
): Promise<void> {
  const { prompt } = await loadSettings();
  const params = await imageParams(
    override ?? buildPortraitPrompt(world, character, prompt.sceneChars),
    IMAGE_SHAPES.portrait,
  );
  await diffusionQueue.add(
    "portrait",
    { ...params, kind: "portrait", worldId: world.id, characterId: character.id },
    { priority: JOB_PRIORITY.portrait },
  );
}

export async function enqueueScene(
  world: World,
  character: Character,
  turnId: string,
  narrative: string,
  variant: number,
  subject?: string,
): Promise<void> {
  const { prompt } = await loadSettings();
  const params = await imageParams(
    buildScenePrompt(world, character, subject ?? narrative, prompt.sceneChars),
    undefined,
    IMAGERY.scene.negative,
  );
  await diffusionQueue.add(
    "scene",
    { ...params, kind: "scene", worldId: world.id, characterId: character.id, turnId, variant },
    { priority: JOB_PRIORITY.scene },
  );
}
