import type { KleinRender } from "@chronicle/utils";
import { NODE_SAVE, saveNode } from "./save";

export function buildKleinWorkflow(
  render: KleinRender,
  prefix: string,
  portraitFilenames: readonly string[] = [],
): Record<string, unknown> {
  const graph: Record<string, unknown> = {
    unet: {
      class_type: "UNETLoader",
      inputs: { unet_name: render.model, weight_dtype: "default" },
    },
    clip: {
      class_type: "CLIPLoader",
      inputs: { clip_name: render.textEncoder, type: "flux2", device: "default" },
    },
    vae: { class_type: "VAELoader", inputs: { vae_name: render.vae } },
    latent: {
      class_type: "EmptyFlux2LatentImage",
      inputs: { width: render.width, height: render.height, batch_size: 1 },
    },
    sigmas: {
      class_type: "Flux2Scheduler",
      inputs: { steps: render.steps, width: render.width, height: render.height },
    },
    positive: { class_type: "CLIPTextEncode", inputs: { text: render.prompt, clip: ["clip", 0] } },
    negative: { class_type: "ConditioningZeroOut", inputs: { conditioning: ["positive", 0] } },
    sampler: { class_type: "KSamplerSelect", inputs: { sampler_name: "euler" } },
    noise: { class_type: "RandomNoise", inputs: { noise_seed: render.seed } },
    decode: { class_type: "VAEDecode", inputs: { samples: ["run", 0], vae: ["vae", 0] } },
    [NODE_SAVE]: saveNode(prefix, render.quality, ["decode", 0]),
  };

  let conditioning: [string, number] = ["positive", 0];
  portraitFilenames.forEach((filename, index) => {
    graph[`portrait_${index}`] = { class_type: "LoadImage", inputs: { image: filename } };
    graph[`portrait_scaled_${index}`] = {
      class_type: "ImageScaleToTotalPixels",
      inputs: {
        image: [`portrait_${index}`, 0],
        upscale_method: "nearest-exact",
        megapixels: 1,
        resolution_steps: 1,
      },
    };
    graph[`portrait_latent_${index}`] = {
      class_type: "VAEEncode",
      inputs: { pixels: [`portrait_scaled_${index}`, 0], vae: ["vae", 0] },
    };
    graph[`reference_${index}`] = {
      class_type: "ReferenceLatent",
      inputs: { conditioning, latent: [`portrait_latent_${index}`, 0] },
    };
    conditioning = [`reference_${index}`, 0];
  });

  graph.guider = {
    class_type: "CFGGuider",
    inputs: { model: ["unet", 0], positive: conditioning, negative: ["negative", 0], cfg: 1 },
  };
  graph.run = {
    class_type: "SamplerCustomAdvanced",
    inputs: {
      noise: ["noise", 0],
      guider: ["guider", 0],
      sampler: ["sampler", 0],
      sigmas: ["sigmas", 0],
      latent_image: ["latent", 0],
    },
  };
  return graph;
}
