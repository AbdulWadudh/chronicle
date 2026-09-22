import type { RuntimeSettings, RuntimeSettingsGroup } from "@chronicle/config";
import {
  BubbleChatIcon,
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
  ensemble: {
    title: "Ensemble",
    blurb: "How a world's cast talk among themselves, for worlds with the group scene turned on.",
    icon: BubbleChatIcon,
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
  scheduler: {
    label: "Scheduler",
    mono: true,
    hint: "How the noise level steps down across the run.",
  },
  quality: {
    label: "Image quality",
    hint: "WebP encode quality. 90 is visually lossless at about a tenth of a PNG's size; below 75 starts to soften skin and hair.",
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

const ensemble: FieldMetaFor<"ensemble"> = {
  enabled: {
    label: "Group scenes",
    hint: "The master switch. Off here, every world behaves as a single-character story regardless of its own setting.",
  },
  maxSpeakers: {
    label: "Speakers per turn",
    unit: "characters",
    hint: "How many of the present cast may talk in one turn. Above two, a scene starts reading as a roll call.",
  },
  maxLinesPerSpeaker: {
    label: "Lines each",
    unit: "lines",
    hint: "How much any one character may say before the turn moves on.",
  },
  speakChance: {
    label: "Chattiness",
    hint: "How readily a speaking slot gets filled at all. Lower leaves more silences, which makes the times they do speak land harder.",
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
  ensemble,
};

export function fieldMeta(group: string, field: string): FieldMeta {
  return FIELD_META[group]?.[field] ?? { label: field, hint: "" };
}
