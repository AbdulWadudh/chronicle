import type { RuntimeSettings, RuntimeSettingsGroup } from "@chronicle/config";
import {
  BrainIcon,
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
import { image, klein, sdxl } from "./imageFields";

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
    blurb: "How much history and established fact goes into every request.",
    icon: Layers01Icon,
  },
  turn: {
    title: "Turn streaming",
    blurb: "Buffering between the model and your screen.",
    icon: FlashIcon,
  },
  image: {
    title: "Illustration",
    blurb: "Which image model draws each scene, and how that model is tuned.",
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
  memory: {
    title: "Memory",
    blurb: "What the story remembers once a turn has scrolled out of the prompt.",
    icon: BrainIcon,
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
    label: "Established facts",
    unit: "facts",
    hint: "How many of the most recent facts the summariser recorded are restated in every prompt.",
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

const memory: FieldMetaFor<"memory"> = {
  recallDepth: {
    label: "Recalled moments",
    unit: "turns",
    hint: "How many older turns, chosen by similarity to what you just did, are quoted back into the prompt. Zero switches recall off.",
  },
  summaryEvery: {
    label: "Summarise every",
    unit: "turns",
    hint: "How often the running summary is rewritten in the background. Lower keeps it current at the cost of one extra model call.",
  },
};

const FIELD_META: Record<string, Record<string, FieldMeta>> = {
  narrative,
  structured,
  prompt,
  turn,
  image,
  "image.klein": klein,
  "image.sdxl": sdxl,
  tts,
  dice,
  ensemble,
  memory,
};

export function fieldMeta(group: string, field: string): FieldMeta {
  return FIELD_META[group]?.[field] ?? { label: field, hint: "" };
}
