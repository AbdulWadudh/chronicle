import type { FieldMeta } from "./fields";

export const image: Record<string, FieldMeta> = {
  quality: {
    label: "Image quality",
    hint: "WebP encode quality. 90 is visually lossless at about a tenth of a PNG's size; below 75 starts to soften skin and hair.",
  },
};

export const klein: Record<string, FieldMeta> = {
  model: {
    label: "Model",
    mono: true,
    hint: "Flux.2 klein weights, relative to the ComfyUI diffusion_models folder.",
  },
  textEncoder: {
    label: "Text encoder",
    mono: true,
    hint: "The Qwen3 encoder klein reads prompts with, in text_encoders. The 4B model needs qwen_3_4b.",
  },
  vae: { label: "VAE", mono: true, hint: "The Flux.2 VAE, in the vae folder." },
  steps: {
    label: "Steps",
    hint: "Distilled for 4. More re-lights the scene rather than sharpening it.",
  },
  renderScale: {
    label: "Render scale",
    unit: "×",
    hint: "Multiplies the base shape before rendering. 1.5 gives real skin and fabric detail for about three extra seconds; 2 is a hero shot at twice the time.",
  },
};

export const sdxl: Record<string, FieldMeta> = {
  checkpoint: {
    label: "Checkpoint",
    mono: true,
    hint: "Model filename, relative to the ComfyUI checkpoints folder. No absolute paths.",
  },
  stylisedCheckpoint: {
    label: "Stylised checkpoint",
    mono: true,
    hint: "Used instead of the checkpoint above when a world's art style is anime, painterly, comic or 3D. A photoreal model renders those styles badly.",
  },
  steps: {
    label: "Steps",
    hint: "Denoising passes. Lightning checkpoints want about 6; full SDXL wants about 26.",
  },
  cfg: {
    label: "Guidance",
    hint: "How hard to push toward the prompt. Lightning wants about 2; full SDXL about 7.",
  },
  sampler: { label: "Sampler", mono: true, hint: "The solver ComfyUI uses to denoise." },
  scheduler: {
    label: "Scheduler",
    mono: true,
    hint: "How the noise level steps down across the run.",
  },
  upscale: {
    label: "Detail pass",
    unit: "×",
    hint: "Renders again at this multiple of the base size to recover fine detail. 1 turns it off; 1.5 roughly doubles the time.",
  },
  upscaleDenoise: {
    label: "Detail strength",
    hint: "How much the detail pass is allowed to change. Low keeps the composition, high reinvents it.",
  },
  identityMethod: {
    label: "Face lock",
    mono: true,
    hint: "How hard a portrait pins the face: fidelity, style or neutral. Fidelity also copies the portrait's pose and expression, so style is the default.",
  },
  identityWeight: {
    label: "Face strength",
    hint: "How strongly the portrait steers the face. Above about 0.8 the scene's own expression stops coming through.",
  },
  identityCastWeight: {
    label: "Face strength, two people",
    hint: "Used when a scene has two portraits. Chained face locks bleed into each other, so this must stay well below the single-subject strength or one person's gender takes over both.",
  },
  identityStart: {
    label: "Face starts at",
    hint: "How far into denoising the face is injected. Later leaves the prompt free to set the pose first.",
  },
  identityEnd: {
    label: "Face ends at",
    hint: "When the portrait stops steering. Earlier lets the scene finish the expression.",
  },
  negativePrompt: {
    label: "Negative prompt",
    multiline: true,
    hint: "What to keep out of every image.",
  },
};
