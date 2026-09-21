import type { ImageParams } from "@chronicle/utils";

export const NODE_SAVE = "9";

const NODE_BASE_SAMPLER = "5";
const NODE_UPSCALE_LATENT = "6";
export const NODE_HIRES_SAMPLER = "7";

function roundToEight(value: number): number {
  return Math.round(value / 8) * 8;
}

export function buildWorkflow(job: ImageParams, prefix: string): Record<string, unknown> {
  const sampler = {
    seed: job.seed,
    steps: job.steps,
    cfg: job.cfg,
    sampler_name: job.sampler,
    scheduler: job.scheduler,
    model: ["1", 0],
    positive: ["2", 0],
    negative: ["3", 0],
  };

  const hires = job.upscale > 1;

  const graph: Record<string, unknown> = {
    "1": {
      class_type: "CheckpointLoaderSimple",
      inputs: { ckpt_name: job.checkpoint },
    },
    "2": {
      class_type: "CLIPTextEncode",
      inputs: { text: job.prompt, clip: ["1", 1] },
    },
    "3": {
      class_type: "CLIPTextEncode",
      inputs: { text: job.negativePrompt, clip: ["1", 1] },
    },
    "4": {
      class_type: "EmptyLatentImage",
      inputs: { width: job.width, height: job.height, batch_size: 1 },
    },
    [NODE_BASE_SAMPLER]: {
      class_type: "KSampler",
      inputs: { ...sampler, denoise: 1, latent_image: ["4", 0] },
    },
    "8": {
      class_type: "VAEDecode",
      inputs: { samples: [hires ? NODE_HIRES_SAMPLER : NODE_BASE_SAMPLER, 0], vae: ["1", 2] },
    },
    [NODE_SAVE]: {
      class_type: "SaveImage",
      inputs: { filename_prefix: `chronicle/${prefix}`, images: ["8", 0] },
    },
  };

  if (!hires) return graph;

  graph[NODE_UPSCALE_LATENT] = {
    class_type: "LatentUpscale",
    inputs: {
      samples: [NODE_BASE_SAMPLER, 0],
      upscale_method: "bislerp",
      width: roundToEight(job.width * job.upscale),
      height: roundToEight(job.height * job.upscale),
      crop: "disabled",
    },
  };
  graph[NODE_HIRES_SAMPLER] = {
    class_type: "KSampler",
    inputs: {
      ...sampler,
      denoise: job.upscaleDenoise,
      latent_image: [NODE_UPSCALE_LATENT, 0],
    },
  };

  return graph;
}
