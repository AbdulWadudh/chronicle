import { IMAGE_SHAPES, IMAGERY, JOB_PRIORITY, RENDER_STYLES } from "@chronicle/config";
import { loadSettings } from "@chronicle/db";
import type { Character, ImageShape, RenderParams, World } from "@chronicle/utils";
import { ensureCastLooks, ensureLook } from "~/engine/appearance";
import {
  buildCoverPrompt,
  buildPortraitPrompt,
  buildProseCoverPrompt,
  buildProsePortraitPrompt,
  buildProseScenePrompt,
  buildSceneNegativePrompt,
  buildScenePrompt,
} from "~/engine/prompt";
import { ensureWorldStyle } from "~/engine/worldStyle";
import { diffusionQueue } from "~/queue";

const MAX_SEED = 2_147_483_647;
const LATENT_GRID = 16;

interface Shape {
  width: number;
  height: number;
}

interface RenderRequest {
  kind: "scene" | "portrait" | "cover";
  prompt: { tags: string; prose: string };
  shape: Shape;
  artStyle: World["artStyle"];
  negativeExtra?: string;
  portraitUrls?: string[];
}

function combineNegative(base: string, extra?: string): string {
  if (extra === undefined || extra.length === 0) return base;
  const tokens = [...base.split(","), ...extra.split(",")]
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  return [...new Set(tokens)].join(", ");
}

function scaled(size: number, scale: number): number {
  return Math.round((size * scale) / LATENT_GRID) * LATENT_GRID;
}

async function buildRender(request: RenderRequest): Promise<RenderParams> {
  const { image } = await loadSettings();
  const engine = request.kind === "portrait" ? image.portraitEngine : image.engine;
  const base = {
    seed: Math.floor(Math.random() * MAX_SEED),
    quality: image.quality,
    portraitUrls: request.portraitUrls ?? [],
  };

  if (engine === "klein") {
    const { klein } = image;
    return {
      ...base,
      engine: "klein",
      prompt: request.prompt.prose,
      width: scaled(request.shape.width, klein.renderScale),
      height: scaled(request.shape.height, klein.renderScale),
      model: klein.model,
      textEncoder: klein.textEncoder,
      vae: klein.vae,
      steps: klein.steps,
    };
  }

  const { sdxl } = image;
  return {
    ...base,
    engine: "sdxl",
    prompt: request.prompt.tags,
    negativePrompt: combineNegative(sdxl.negativePrompt, request.negativeExtra),
    checkpoint: RENDER_STYLES[request.artStyle].stylised
      ? sdxl.stylisedCheckpoint
      : sdxl.checkpoint,
    width: request.shape.width,
    height: request.shape.height,
    steps: sdxl.steps,
    cfg: sdxl.cfg,
    sampler: sdxl.sampler,
    scheduler: sdxl.scheduler,
    upscale: sdxl.upscale,
    upscaleDenoise: sdxl.upscaleDenoise,
    identity: {
      method: sdxl.identityMethod,
      weight: sdxl.identityWeight,
      castWeight: sdxl.identityCastWeight,
      startAt: sdxl.identityStart,
      endAt: sdxl.identityEnd,
    },
  };
}

function portraitUrlsOf(cast: readonly Character[]): { urls: string[]; ids: string[] } {
  const urls: string[] = [];
  const ids: string[] = [];
  for (const actor of cast) {
    const url = actor.portraitUrl;
    if (typeof url !== "string" || url.length === 0 || urls.includes(url)) continue;
    urls.push(url);
    ids.push(actor.id);
  }
  return { urls, ids };
}

export async function enqueueCover(world: World, override?: string): Promise<void> {
  const { prompt } = await loadSettings();
  const worldStyle = await ensureWorldStyle(world);
  const render = await buildRender({
    kind: "cover",
    prompt: {
      tags: override ?? buildCoverPrompt(world, prompt.sceneChars, worldStyle),
      prose: override ?? buildProseCoverPrompt(world, prompt.sceneChars, worldStyle),
    },
    shape: IMAGE_SHAPES.landscape,
    artStyle: world.artStyle,
  });
  await diffusionQueue.add(
    "cover",
    { kind: "cover", worldId: world.id, render },
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
  const render = await buildRender({
    kind: "portrait",
    prompt: {
      tags: override ?? buildPortraitPrompt(world, character, prompt.sceneChars, look, worldStyle),
      prose:
        override ?? buildProsePortraitPrompt(world, character, prompt.sceneChars, look, worldStyle),
    },
    shape: IMAGE_SHAPES.portrait,
    artStyle: world.artStyle,
  });
  await diffusionQueue.add(
    "portrait",
    { kind: "portrait", worldId: world.id, characterId: character.id, draft, render },
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
  const cast = interactingCharacters.slice(0, IMAGERY.scene.maxSubjects - 1);
  const portraits = portraitUrlsOf([character, ...cast]);
  const request = {
    world,
    character,
    visual: subject ?? narrative,
    maxChars: prompt.sceneChars,
    interacting: cast,
    looks: await ensureCastLooks(world, [character, ...cast]),
    shape,
    worldStyle: await ensureWorldStyle(world),
  };

  const render = await buildRender({
    kind: "scene",
    prompt: {
      tags: buildScenePrompt(request),
      prose: buildProseScenePrompt(request, portraits.ids),
    },
    shape: IMAGE_SHAPES[shape],
    artStyle: world.artStyle,
    negativeExtra: buildSceneNegativePrompt(character, cast, world.shotSize, world.artStyle),
    portraitUrls: portraits.urls,
  });
  await diffusionQueue.add(
    "scene",
    { kind: "scene", worldId: world.id, characterId: character.id, turnId, variant, render },
    { priority: JOB_PRIORITY.scene },
  );
}
