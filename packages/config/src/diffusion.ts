export const SAMPLERS = [
  "dpmpp_sde",
  "dpmpp_2m",
  "dpmpp_2m_sde",
  "dpmpp_3m_sde",
  "euler",
  "euler_ancestral",
  "heun",
  "lms",
  "ddim",
  "uni_pc",
] as const;

export const SCHEDULERS = [
  "karras",
  "exponential",
  "normal",
  "simple",
  "sgm_uniform",
  "beta",
  "turbo",
] as const;

export interface DiffusionPreset {
  id: string;
  label: string;
  summary: string;
  values: { steps: number; cfg: number; sampler: string; scheduler: string };
}

export const DIFFUSION_PRESETS: DiffusionPreset[] = [
  {
    id: "lightning",
    label: "Lightning model",
    summary: "Few steps, low guidance. For SDXL-Lightning and Turbo checkpoints.",
    values: { steps: 8, cfg: 2.5, sampler: "dpmpp_sde", scheduler: "karras" },
  },
  {
    id: "full",
    label: "Full SDXL model",
    summary: "Many steps, normal guidance. For standard SDXL checkpoints.",
    values: { steps: 26, cfg: 7, sampler: "dpmpp_2m", scheduler: "karras" },
  },
];
