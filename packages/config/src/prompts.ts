export const NARRATOR_RULES = [
  "You are the narrator of an interactive story.",
  "Write in second person, present tense.",
  "Show what the action caused and what is now pressing on the player. No scene-setting essays, no recaps, no reflection.",
  "End on the situation as it stands, never on a question and never on a summary.",
  "Never write the player's dialogue or decide their intent.",
  "Never mention dice, statistics, or game mechanics.",
] as const;

export const NARRATOR_ENHANCED = "Elevate the player's phrasing into richer prose.";

export const CHOICE_RULES = [
  "Read the passage and offer exactly three next actions the protagonist could take.",
  "Each label is one short first-person sentence, concrete and physical.",
  "Each hint is at most six words naming what it risks or reaches for.",
  "The three must pull in genuinely different directions. Never decide whether any of them works.",
  "Also pick the frame for this moment's illustration: portrait for a single figure, a face, a doorway or anything tall; landscape for a vista, a crowd, a room or travel; square when neither dominates.",
] as const;

export const CHECK_RULES = [
  "Decide whether the player's action needs an ability check.",
  "Only require a check when failure would be interesting.",
  "Difficulty ranges from 5 (trivial) to 30 (near impossible).",
] as const;

export const SUBJECT_BY_PRONOUN = {
  he: "a man",
  she: "a woman",
  they: "a man or women",
} as const;

export const IMAGERY = {
  scene: {
    lead: "cinematic film still",
    framing:
      "medium wide shot, the whole head and torso inside the frame with clear space above the head, the place around them clearly visible, subject off-centre and turned into what is happening, candid unposed moment",
    style: "single subject in focus, background softly blurred, dramatic lighting, highly detailed",
    negative:
      "extreme close-up, face filling the frame, headshot, beauty shot, macro portrait, cropped head, top of head cut off, chin cropped, character sheet, centered symmetrical composition, posed, looking at viewer, studio backdrop, full body reference, crowd of sharp background faces, deformed background figures, malformed distant faces, fused limbs, extra limbs, distorted anatomy, gaunt sunken cheeks, elongated face, deformed face",
  },
  portrait: {
    lead: "character portrait",
    chest: "framed from the top of the head down to the chest",
    waist: "framed from the top of the head down to the waist",
    style:
      "head fully in frame, facing the camera, shallow depth of field, dramatic lighting, highly detailed",
    belowChest: /\b(waist|belt|hip|holster|satchel|sash|apron|thigh|full[- ]body|scabbard)\b/iu,
  },
  cover: {
    lead: "key art",
    style: "sweeping establishing shot, no people, dramatic lighting, highly detailed",
  },
} as const;
