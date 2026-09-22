import type { ImageParams } from "@chronicle/utils";

export const NODE_SAVE = "9";

const NODE_BASE_SAMPLER = "5";
const NODE_UPSCALE_LATENT = "6";
export const NODE_HIRES_SAMPLER = "7";

function roundToEight(value: number): number {
  return Math.round(value / 8) * 8;
}

export function buildWorkflow(
  job: ImageParams,
  prefix: string,
  portraitFilenames: string[] = [],
): Record<string, unknown> {
  const hires = job.upscale > 1 && job.upscaleDenoise > 0;

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
    "8": {
      class_type: "VAEDecode",
      inputs: { samples: [hires ? NODE_HIRES_SAMPLER : NODE_BASE_SAMPLER, 0], vae: ["1", 2] },
    },
    [NODE_SAVE]: {
      class_type: "SaveAnimatedWEBP",
      inputs: {
        filename_prefix: `chronicle/${prefix}`,
        images: ["8", 0],
        fps: 1,
        lossless: false,
        quality: job.quality,
        method: "default",
      },
    },
  };

  let currentModel: [string, number] = ["1", 0];

  if (portraitFilenames.length > 0) {
    graph.pulid_model = {
      class_type: "PulidModelLoader",
      inputs: { pulid_file: "ip-adapter_pulid_sdxl_fp16.safetensors" },
    };
    graph.pulid_eva = {
      class_type: "PulidEvaClipLoader",
      inputs: {},
    };
    graph.pulid_insightface = {
      class_type: "PulidInsightFaceLoader",
      inputs: { provider: "CUDA" },
    };

    if (portraitFilenames.length === 1) {
      const focalPortrait = portraitFilenames[0];
      if (focalPortrait !== undefined) {
        graph.pulid_image_0 = {
          class_type: "LoadImage",
          inputs: { image: focalPortrait },
        };
        graph.pulid_apply_0 = {
          class_type: "ApplyPulid",
          inputs: {
            model: currentModel,
            pulid: ["pulid_model", 0],
            eva_clip: ["pulid_eva", 0],
            face_analysis: ["pulid_insightface", 0],
            image: ["pulid_image_0", 0],
            method: job.identity.method,
            weight: job.identity.weight,
            start_at: job.identity.startAt,
            end_at: job.identity.endAt,
          },
        };
        currentModel = ["pulid_apply_0", 0];
      }
    } else {
      const halfWidth = Math.round(job.width * 0.55);
      const rightX = Math.round(job.width * 0.45);
      const featherPx = 60;

      graph.mask_base = {
        class_type: "SolidMask",
        inputs: { value: 0, width: job.width, height: job.height },
      };

      graph.mask_box_0 = {
        class_type: "SolidMask",
        inputs: { value: 1, width: halfWidth, height: job.height },
      };
      graph.mask_feather_0 = {
        class_type: "FeatherMask",
        inputs: { mask: ["mask_box_0", 0], left: 0, top: 0, right: featherPx, bottom: 0 },
      };
      graph.mask_0 = {
        class_type: "MaskComposite",
        inputs: {
          destination: ["mask_base", 0],
          source: ["mask_feather_0", 0],
          x: 0,
          y: 0,
          operation: "add",
        },
      };

      graph.mask_box_1 = {
        class_type: "SolidMask",
        inputs: { value: 1, width: halfWidth, height: job.height },
      };
      graph.mask_feather_1 = {
        class_type: "FeatherMask",
        inputs: { mask: ["mask_box_1", 0], left: featherPx, top: 0, right: 0, bottom: 0 },
      };
      graph.mask_1 = {
        class_type: "MaskComposite",
        inputs: {
          destination: ["mask_base", 0],
          source: ["mask_feather_1", 0],
          x: rightX,
          y: 0,
          operation: "add",
        },
      };

      const faces = Math.min(2, portraitFilenames.length);
      for (let step = 0; step < faces; step++) {
        const i = faces - 1 - step;
        const imageNode = `pulid_image_${i}`;
        const applyNode = `pulid_apply_${i}`;
        graph[imageNode] = {
          class_type: "LoadImage",
          inputs: { image: portraitFilenames[i] },
        };
        graph[applyNode] = {
          class_type: "ApplyPulid",
          inputs: {
            model: currentModel,
            pulid: ["pulid_model", 0],
            eva_clip: ["pulid_eva", 0],
            face_analysis: ["pulid_insightface", 0],
            image: [imageNode, 0],
            method: job.identity.method,
            weight: job.identity.castWeight,
            start_at: job.identity.startAt,
            end_at: job.identity.endAt,
            attn_mask: [`mask_${i}`, 0],
          },
        };
        currentModel = [applyNode, 0];
      }
    }
  }

  const sampler = {
    seed: job.seed,
    steps: job.steps,
    cfg: job.cfg,
    sampler_name: job.sampler,
    scheduler: job.scheduler,
    model: currentModel,
    positive: ["2", 0],
    negative: ["3", 0],
  };

  graph[NODE_BASE_SAMPLER] = {
    class_type: "KSampler",
    inputs: { ...sampler, denoise: 1, latent_image: ["4", 0] },
  };

  if (!hires) return graph;

  graph[NODE_UPSCALE_LATENT] = {
    class_type: "LatentUpscale",
    inputs: {
      samples: [NODE_BASE_SAMPLER, 0],
      upscale_method: "nearest-exact",
      width: roundToEight(job.width * job.upscale),
      height: roundToEight(job.height * job.upscale),
      crop: "disabled",
    },
  };
  graph[NODE_HIRES_SAMPLER] = {
    class_type: "KSampler",
    inputs: {
      ...sampler,
      steps: Math.ceil(job.steps / job.upscaleDenoise),
      denoise: job.upscaleDenoise,
      latent_image: [NODE_UPSCALE_LATENT, 0],
    },
  };

  return graph;
}
