import type { RuntimeSettings, RuntimeSettingsGroup } from "@chronicle/config";
import {
  DiceFaces05Icon,
  FlashIcon,
  Image02Icon,
  Layers01Icon,
  QuillWrite02Icon,
  SourceCodeIcon,
  VolumeHighIcon,
} from "@hugeicons/core-free-icons";
import type { GroupMeta } from "~/components/common/SettingsGroup";

export interface FieldMeta {
  label: string;
  hint: string;
  unit?: string;
  multiline?: boolean;
  mono?: boolean;
  options?: readonly string[];
}

type FieldMetaFor<G extends RuntimeSettingsGroup> = Record<
  keyof RuntimeSettings[G] & string,
  FieldMeta
>;

export const GROUP_META: Record<RuntimeSettingsGroup, GroupMeta> = {
  narrative: {
    title: "Narrative",
    blurb: "How the storyteller writes, and how long it is allowed to think first.",
    icon: QuillWrite02Icon,
  },
  structured: {
    title: "Structured output",
    blurb: "The colder second pass that returns JSON — dice calls and state changes.",
    icon: SourceCodeIcon,
  },
  prompt: {
    title: "Prompt assembly",
    blurb: "How much history and recalled memory goes into every request.",
    icon: Layers01Icon,
  },
  turn: {
    title: "Turn streaming",
    blurb: "Buffering between the model and your screen.",
    icon: FlashIcon,
  },
  image: {
    title: "Illustration",
    blurb: "The diffusion model that draws each scene.",
    icon: Image02Icon,
  },
  tts: {
    title: "Voice",
    blurb: "Narration playback in Cinema Mode.",
    icon: VolumeHighIcon,
  },
  dice: {
    title: "Dice",
    blurb: "Server-authoritative checks. The client never decides an outcome.",
    icon: DiceFaces05Icon,
  },
};

const narrative: FieldMetaFor<"narrative"> = {
  temperature: {
    label: "Creativity",
    hint: "Higher wanders further from the obvious. Past about 1.2 it starts losing the thread.",
  },
  maxTokens: {
    label: "Response length",
    unit: "tokens",
    hint: "Hard ceiling for one narrative turn. Roughly three tokens to a word.",
  },
  thinking: {
    label: "Reasoning pass",
    hint: "Let the model reason before it writes. Costs latency, and nothing streams while it does.",
  },
  thinkingBudget: {
    label: "Reasoning budget",
    unit: "tokens",
    hint: "Extra tokens allowed for that reasoning. Only spent when the pass above is on.",
  },
};

const structured: FieldMetaFor<"structured"> = {
  temperature: {
    label: "Creativity",
    hint: "Keep this low. This pass returns JSON, not prose, and drifts into invalid output when warm.",
  },
  maxTokens: {
    label: "Response length",
    unit: "tokens",
    hint: "Ceiling for one structured reply. These are small; it rarely needs raising.",
  },
};

const prompt: FieldMetaFor<"prompt"> = {
  sentences: {
    label: "Narration length",
    unit: "sentences",
    hint: "How long each reply runs. Two keeps play moving; raise it only if you want prose over pace.",
  },
  historyDepth: {
    label: "Turns of history",
    unit: "turns",
    hint: "How many past turns are replayed into each prompt. More coherence, more context spent.",
  },
  recentFacts: {
    label: "Recalled facts",
    unit: "facts",
    hint: "How many remembered details are retrieved from vector memory per turn.",
  },
  sceneChars: {
    label: "Scene summary",
    unit: "characters",
    hint: "How much of the scene is handed to the image model when it draws.",
  },
};

const turn: FieldMetaFor<"turn"> = {
  bufferSize: {
    label: "Stream buffer",
    unit: "tokens",
    hint: "Tokens held back before flushing. Larger reads smoother, smaller feels faster.",
  },
};

const image: FieldMetaFor<"image"> = {
  checkpoint: {
    label: "Checkpoint",
    mono: true,
    hint: "Model filename, relative to the ComfyUI checkpoints folder. No absolute paths.",
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
  negativePrompt: {
    label: "Negative prompt",
    multiline: true,
    hint: "What to keep out of every image.",
  },
};

const tts: FieldMetaFor<"tts"> = {
  voice: { label: "Voice", mono: true, hint: "A Kokoro voice id, such as af_heart." },
  speed: { label: "Speed", unit: "x", hint: "Playback rate for narrated sentences." },
};

const dice: FieldMetaFor<"dice"> = {
  defaultDifficulty: {
    label: "Default DC",
    hint: "Target number when the director sets none. A d20 plus modifiers must meet or beat it.",
  },
};

const FIELD_META: Record<string, Record<string, FieldMeta>> = {
  narrative,
  structured,
  prompt,
  turn,
  image,
  tts,
  dice,
};

export function fieldMeta(group: string, field: string): FieldMeta {
  return FIELD_META[group]?.[field] ?? { label: field, hint: "" };
}
