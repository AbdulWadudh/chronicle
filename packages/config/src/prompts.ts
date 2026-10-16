export const NARRATOR_RULES = [
  "You are the narrator of an interactive story.",
  "Write in second person, present tense.",
  "Show what the action caused and what is now pressing on the player. No scene-setting essays, no recaps, no reflection.",
  "End on the situation as it stands, never on a question and never on a summary.",
  "Never write the player's dialogue or decide their intent.",
  "Never mention dice, statistics, or game mechanics.",
] as const;

export const NARRATOR_ENHANCED = "Elevate the player's phrasing into richer prose.";

export const CHOICE_BANNED_OPENERS = ["I press my palm", "I press my hand", "I slam"] as const;

export const CHOICE_RULES = [
  "Read the passage and offer exactly three next actions the protagonist could take.",
  "Each label is one short first-person sentence naming one specific thing the protagonist does.",
  "Each hint is at most six words naming what it risks or reaches for.",
  "The three must differ in kind, not only in target. Draw them from different registers: force or movement, speech and persuasion, watching and deducing, using an ability or an object, deceiving or concealing, tending to someone, waiting or withdrawing. At most one may be physical force.",
  "Never start two labels with the same verb, and never reuse a verb the player has already used this scene.",
  "A good set gives the player a real dilemma: one action that costs something, one that reveals something, one that changes the footing. Never decide whether any of them works.",
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
  they: "a person",
} as const;

export const SHOT_SIZES = {
  closeUp: {
    prefix: "close-up",
    clause: "(head and shoulders only:1.4), faces filling the frame",
  },
  waistUp: {
    prefix: "medium",
    clause: "(cropped at the waist:1.4), head and torso only",
  },
  threeQuarter: {
    prefix: "",
    clause: "(cropped at the knees:1.3), head to knees",
  },
  fullBody: {
    prefix: "full-body",
    clause: "head to feet inside the frame",
  },
} as const;

export const RENDER_STYLES = {
  photoreal: {
    stylised: false,
    label: "Photoreal",
    medium: "cinematic photo",
    portraitMedium: "character portrait photo",
    tail: "sharp facial features, natural skin texture, photorealistic, dramatic lighting",
    negative: "cartoon, anime, illustration, painting, sketch, 3d render, doll",
  },
  anime: {
    stylised: true,
    label: "Anime",
    medium: "anime illustration",
    portraitMedium: "anime character portrait",
    tail: "clean line art, cel shading, expressive eyes, vibrant colour, crisp detail",
    negative: "photograph, photorealistic, live action, 3d render, muddy colour",
  },
  painterly: {
    stylised: true,
    label: "Painterly",
    medium: "digital painting",
    portraitMedium: "painted character portrait",
    tail: "visible brushwork, rich colour, dramatic lighting, concept art finish",
    negative: "photograph, photorealistic, 3d render, flat vector, harsh outline",
  },
  comic: {
    stylised: true,
    label: "Comic",
    medium: "graphic novel panel",
    portraitMedium: "graphic novel character portrait",
    tail: "bold ink lines, halftone shading, high contrast, limited palette",
    negative: "photograph, photorealistic, 3d render, soft focus, muted palette",
  },
  render3d: {
    stylised: true,
    label: "3D render",
    medium: "stylised 3d animated film still",
    portraitMedium: "stylised 3d character portrait",
    tail: "subsurface scattering, global illumination, soft key light, polished finish",
    negative: "photograph, flat illustration, sketch, harsh grain",
  },
} as const;

export type RenderStyleName = keyof typeof RENDER_STYLES;

export const SHOT_NEGATIVES = {
  closeUp: "full body, whole body, legs, feet, knees, waist, wide shot, distant subject",
  waistUp: "full body, whole body, legs, feet, knees, wide shot, distant subject",
  threeQuarter: "full body, feet, wide shot, distant subject",
  fullBody: "cropped legs, cropped feet",
} as const;

export type ShotSize = keyof typeof SHOT_SIZES;

export const PROSE = {
  shot: {
    closeUp: "close-up, head and shoulders filling the frame",
    waistUp: "waist-up framing, head and torso in frame",
    threeQuarter: "framed from the head to the knees",
    fullBody: "full body, head to feet inside the frame",
  },
  scene: {
    solo: "One person in frame and nobody else.",
    pair: (names: readonly string[]): string =>
      `Exactly ${names.length} people in frame, ${names.join(" and ")}, each clearly a different person; no one else.`,
    expression:
      "Their faces and body language react to this exact moment, with natural candid gestures. Nobody looks into the camera.",
    anatomy:
      "Every hand has five fingers and grips objects naturally; limbs, joints and proportions are correct.",
  },
  portrait:
    "Framed from the top of the head down to the chest, head fully in frame, facing the camera, shallow depth of field, dramatic lighting.",
  cover: "A sweeping establishing shot with no people, dramatic lighting, highly detailed.",
} as const;

export const IMAGERY = {
  scene: {
    maxSubjects: 2,
    lead: "cinematic photo",
    framing: "natural depth of field",
    expression:
      "(expressive faces:1.2), facial expression and body language reacting to this exact moment, natural candid gesture, eyes alive",
    style: "sharp facial features, natural skin texture, photorealistic, dramatic lighting",
    negativeBase:
      "bad anatomy, deformed limbs, fused limbs, extra arms, extra legs, malformed hands, extra fingers, mutated, distorted body, blurry, formal business suit, necktie, looking at camera, staring at viewer, posed photo, deadpan, blank stare, neutral expression, expressionless, passport photo",
    negativeSolo:
      "2 people, two people, second person, duplicate person, cloned faces, crowd, group",
    negativeCast:
      "3 people, three people, trio, group, crowd, extra figures, multiple people, background characters, duplicate person, cloned faces, swapped bodies, mismatched head and body",
    negativeSameGender:
      "two women, two female subjects, all-female, two men, two male subjects, all-male, same gender pair, androgynous, ambiguous gender",
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
