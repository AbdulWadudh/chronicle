import type { DiffusionJob } from "@chronicle/utils";

export const NODE_SAVE = "9";

export function buildWorkflow(job: DiffusionJob): Record<string, unknown> {
  return {
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
    "5": {
      class_type: "KSampler",
      inputs: {
        seed: job.seed,
        steps: job.steps,
        cfg: job.cfg,
        sampler_name: job.sampler,
        scheduler: job.scheduler,
        denoise: 1,
        model: ["1", 0],
        positive: ["2", 0],
        negative: ["3", 0],
        latent_image: ["4", 0],
      },
    },
    "8": {
      class_type: "VAEDecode",
      inputs: { samples: ["5", 0], vae: ["1", 2] },
    },
    [NODE_SAVE]: {
      class_type: "SaveImage",
      inputs: { filename_prefix: `chronicle/${job.turnId}`, images: ["8", 0] },
    },
  };
}
