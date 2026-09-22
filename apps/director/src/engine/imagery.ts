import { IMAGE_SHAPES, JOB_PRIORITY, RENDER_STYLES } from "@chronicle/config";
import { loadSettings } from "@chronicle/db";
import type { Character, ImageParams, ImageShape, World } from "@chronicle/utils";
import { ensureCastLooks, ensureLook } from "~/engine/appearance";
import {
  buildCoverPrompt,
  buildPortraitPrompt,
  buildSceneNegativePrompt,
  buildScenePrompt,
} from "~/engine/prompt";
import { ensureWorldStyle } from "~/engine/worldStyle";
import { diffusionQueue } from "~/queue";

const MAX_SEED = 2_147_483_647;

interface Shape {
  width: number;
  height: number;
}

function combineNegative(base: string, extra?: string): string {
  if (extra === undefined || extra.length === 0) return base;
  const tokens = [...base.split(","), ...extra.split(",")]
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  return [...new Set(tokens)].join(", ");
}

async function imageParams(
  prompt: string,
  shape: Shape,
  artStyle: World["artStyle"],
  negativeExtra?: string,
  portraitUrls: string[] = [],
): Promise<ImageParams> {
  const { image } = await loadSettings();
  return {
    prompt,
    negativePrompt: combineNegative(image.negativePrompt, negativeExtra),
    seed: Math.floor(Math.random() * MAX_SEED),
    checkpoint: RENDER_STYLES[artStyle].stylised ? image.stylisedCheckpoint : image.checkpoint,
    width: shape.width,
    height: shape.height,
    steps: image.steps,
    cfg: image.cfg,
    sampler: image.sampler,
    scheduler: image.scheduler,
    quality: image.quality,
    upscale: image.upscale,
    upscaleDenoise: image.upscaleDenoise,
    identity: {
      method: image.identityMethod,
      weight: image.identityWeight,
      castWeight: image.identityCastWeight,
      startAt: image.identityStart,
      endAt: image.identityEnd,
    },
    portraitUrls,
  };
}

export async function enqueueCover(world: World, override?: string): Promise<void> {
  const { prompt } = await loadSettings();
  const params = await imageParams(
    override ?? buildCoverPrompt(world, prompt.sceneChars, await ensureWorldStyle(world)),
    IMAGE_SHAPES.landscape,
    world.artStyle,
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
  draft = false,
): Promise<void> {
  const { prompt } = await loadSettings();
  const look = await ensureLook(world, character);
  const worldStyle = await ensureWorldStyle(world);
  const params = await imageParams(
    override ?? buildPortraitPrompt(world, character, prompt.sceneChars, look, worldStyle),
    IMAGE_SHAPES.portrait,
    world.artStyle,
  );
  await diffusionQueue.add(
    "portrait",
    { ...params, kind: "portrait", worldId: world.id, characterId: character.id, draft },
    { priority: JOB_PRIORITY.portrait },
  );
}

export async function enqueueScene(
  world: World,
  character: Character,
  turnId: string,
  narrative: string,
  shape: ImageShape,
  variant: number,
  subject?: string,
  interactingCharacters: readonly Character[] = [],
): Promise<void> {
  const { prompt } = await loadSettings();
  const negative = buildSceneNegativePrompt(
    character,
    interactingCharacters,
    world.shotSize,
    world.artStyle,
  );

  const portraits: string[] = [];
  if (typeof character.portraitUrl === "string" && character.portraitUrl.length > 0) {
    portraits.push(character.portraitUrl);
  }
  for (const actor of interactingCharacters) {
    if (
      typeof actor.portraitUrl === "string" &&
      actor.portraitUrl.length > 0 &&
      !portraits.includes(actor.portraitUrl)
    ) {
      portraits.push(actor.portraitUrl);
    }
  }

  const params = await imageParams(
    buildScenePrompt({
      world,
      character,
      visual: subject ?? narrative,
      maxChars: prompt.sceneChars,
      interacting: interactingCharacters,
      looks: await ensureCastLooks(world, [character, ...interactingCharacters]),
      shape,
      worldStyle: await ensureWorldStyle(world),
    }),
    IMAGE_SHAPES[shape],
    world.artStyle,
    negative,
    portraits,
  );
  await diffusionQueue.add(
    "scene",
    { ...params, kind: "scene", worldId: world.id, characterId: character.id, turnId, variant },
    { priority: JOB_PRIORITY.scene },
  );
}
