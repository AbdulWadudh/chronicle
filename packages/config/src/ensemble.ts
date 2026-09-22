import { z } from "zod";

export const ENSEMBLE_BOUNDS = {
  maxSpeakers: { min: 1, max: 4, step: 1 },
  maxLinesPerSpeaker: { min: 1, max: 4, step: 1 },
  speakChance: { min: 0, max: 1, step: 0.05 },
} as const;

export const ensembleSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  maxSpeakers: z
    .number()
    .int()
    .min(ENSEMBLE_BOUNDS.maxSpeakers.min)
    .max(ENSEMBLE_BOUNDS.maxSpeakers.max)
    .default(2),
  maxLinesPerSpeaker: z
    .number()
    .int()
    .min(ENSEMBLE_BOUNDS.maxLinesPerSpeaker.min)
    .max(ENSEMBLE_BOUNDS.maxLinesPerSpeaker.max)
    .default(2),
  speakChance: z
    .number()
    .min(ENSEMBLE_BOUNDS.speakChance.min)
    .max(ENSEMBLE_BOUNDS.speakChance.max)
    .default(0.6),
});

export type EnsembleSettings = z.infer<typeof ensembleSettingsSchema>;

export interface BondBand {
  id: string;
  atLeast: number;
  phrase: string;
  delivery: string;
}

export const ENSEMBLE = {
  narratorPromptMaxChars: 600,
  presenceSeed: 4,
  personalityMaxChars: 240,

  narrator: [
    "You are the narrator of an interactive story with a speaking cast.",
    "Narration is second person, present tense, addressed to the player.",
    "Show what the action caused and what is now pressing on the player.",
    "End on the situation as it stands, never on a question and never on a summary.",
    "Never write the player's dialogue or decide their intent.",
    "Never mention dice, statistics, or game mechanics.",
  ],

  attribution: {
    speech:
      "A spoken line begins with the speaker's exact name, then a colon and a space, then what they say. Write no quotation marks around a spoken line.",
    narration:
      "A line with no name in front of it is narration. Put each spoken line and each stretch of narration on its own line.",
    discipline:
      "Never put a name in front of a line unless that name is in the speaking list. Never write a line for the player.",
  },

  turnTaking: [
    "Every turn is narration plus spoken lines. A turn with no spoken line in it is wrong.",
    "Only the characters in the speaking list may speak this turn, and they speak in the order given.",
    "A character who is present but absent from that list stays silent. Their silence is allowed to be noticeable.",
    "Every character in the list must say something in their own voice, not a summary of their position.",
    "They address each other as well as the player. Let them interrupt, agree, and talk past one another the way people do.",
    "When the player speaks to someone by name, that character answers what was actually asked before anything else happens.",
  ],

  persona: {
    lead: "Speaking cast for this turn:",
    likes: "warms to",
    dislikes: "bristles at",
    style: "speaks",
    absent:
      "Addressed by the player but not in this scene. They cannot hear it and they do not answer. Show what the player's words meet instead: silence, distance, an empty channel.",
    rule: "Each character's likes, dislikes and manner of speech govern their word choice, their patience and what they refuse to say. Two characters must never be interchangeable.",
  },

  bonds: {
    range: { min: -100, max: 100 },
    maxDelta: 2,
    lead: "How the cast feel about each other:",
    rule: "These feelings govern how a line is delivered: who each character addresses, who they cut off, who they back up and what they leave unsaid. A feeling changes delivery, never what the narration reports as fact.",
    bands: [
      {
        id: "hostile",
        atLeast: -100,
        phrase: "is hostile toward",
        delivery: "contradicts them, talks over them, avoids using their name",
      },
      {
        id: "cold",
        atLeast: -60,
        phrase: "is cold toward",
        delivery: "answers them in as few words as possible, never volunteers anything",
      },
      {
        id: "wary",
        atLeast: -30,
        phrase: "is wary of",
        delivery: "hedges around them, checks their reaction before committing",
      },
      {
        id: "neutral",
        atLeast: -10,
        phrase: "is neutral toward",
        delivery: "speaks to them plainly, with no particular warmth or edge",
      },
      {
        id: "warm",
        atLeast: 11,
        phrase: "is warm toward",
        delivery: "agrees with them readily, picks up their thread",
      },
      {
        id: "close",
        atLeast: 31,
        phrase: "is close to",
        delivery: "teases them, finishes their sentences, speaks in shorthand only they share",
      },
      {
        id: "devoted",
        atLeast: 61,
        phrase: "is devoted to",
        delivery: "defends them before they ask, takes their side against the room",
      },
    ] as readonly BondBand[],
  },

  choice: [
    "Read the passage and offer exactly three next actions the player's own character could take.",
    "Every label is an action the player takes. Never offer an action performed by a member of the cast, and never offer waiting for one of them to act.",
    "Each label is one short first-person sentence naming one specific thing the player does.",
    "Each hint is at most six words naming what it risks or reaches for.",
    "The three must differ in kind. Draw them from different registers: speaking to one named character, speaking to the room, acting physically, watching and deducing, withholding or withdrawing. At most one may be physical force.",
    "When several characters just spoke, at least one option answers a specific one of them by name.",
    "Never start two labels with the same verb.",
    "Also pick the frame for this moment's illustration: portrait for a single figure, a face, a doorway or anything tall; landscape for a vista, a crowd, a room or travel; square when neither dominates.",
  ],
} as const;
