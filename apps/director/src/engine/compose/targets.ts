import type { ComposeTarget } from "@chronicle/utils";

export interface TargetSpec {
  noun: string;
  instruction: string;
  maxTokens: number;
}

export const TARGETS: Record<ComposeTarget, TargetSpec> = {
  "world.premise": {
    noun: "premise",
    instruction:
      "One or two sentences naming a place, what is wrong with it, and the pressure the protagonist is under. Concrete and strange, never a genre label.",
    maxTokens: 160,
  },
  "world.title": {
    noun: "title",
    instruction: "Two to four words. Evocative, not descriptive. No subtitle and no article.",
    maxTokens: 60,
  },
  "world.genre": {
    noun: "genre",
    instruction: "One or two words naming the genre, in title case.",
    maxTokens: 40,
  },
  "world.description": {
    noun: "description",
    instruction:
      "Two or three sentences on what kind of place this is and what is wrong with it. Second person for the protagonist's role.",
    maxTokens: 400,
  },
  "world.opening": {
    noun: "opening situation",
    instruction:
      "Two or three sentences in second person, present tense, placing the protagonist in their first moment. End on a pressure, not a question.",
    maxTokens: 400,
  },
  "world.ability": {
    noun: "ability description",
    instruction:
      "One sentence saying when this ability is tested. Specific to this setting, never a generic attribute gloss.",
    maxTokens: 120,
  },
  "world.visualStyle": {
    noun: "art direction",
    instruction:
      "Comma-separated fragments naming the era, architecture, recurring materials, dominant palette, characteristic light and usual weather. Every illustration of this world reuses it. No people, no events, no camera terms.",
    maxTokens: 200,
  },
  "world.cover": {
    noun: "cover prompt",
    instruction:
      "A comma-separated image prompt for this world's key art. Describe only what is visible: the place, the structures, the light, the weather, the mood. No people, no faces, no story, no camera brand or lens terms.",
    maxTokens: 200,
  },
  "character.name": {
    noun: "character name",
    instruction: "A given name and a surname that suit the setting. Nothing else.",
    maxTokens: 40,
  },
  "character.portrait": {
    noun: "portrait prompt",
    instruction:
      "A comma-separated image prompt describing only what is visible: face, age, build, hair, clothing, bearing and setting. No sentences, no story, no camera or lighting directions.",
    maxTokens: 200,
  },
  "turn.scene": {
    noun: "scene prompt",
    instruction:
      "A comma-separated image prompt describing only what is visible in this moment: the place, the light, the weather, what is happening in frame. No sentences, no names, no dialogue.",
    maxTokens: 200,
  },
  "turn.whisper": {
    noun: "director's whisper",
    instruction:
      "One sentence of hidden stage direction for the game master: a pressure, an arrival, a turn of the weather, a cost coming due. Never address the player and never narrate the outcome.",
    maxTokens: 120,
  },
  "turn.action": {
    noun: "action",
    instruction:
      "One sentence in first person describing what the protagonist does next. Concrete and physical. Never decide whether it works, and never write the world's reply. If interacting with another character referenced with '@Name', keep their exact '@Name' notation.",
    maxTokens: 140,
  },
  "character.appearance": {
    noun: "appearance",
    instruction:
      "At most eight comma-separated fragments naming only the body: apparent age, build, height, skin, hair colour and length, facial hair, distinguishing marks. Under twelve words, no full stops. Never clothing, never a place, never an activity.",
    maxTokens: 120,
  },
  "character.outfit": {
    noun: "outfit",
    instruction:
      "At most six comma-separated fragments naming only worn items: garments, materials, colours, armour, gear carried on the body. Under twelve words, no full stops. Never a body trait, never a place, never an activity.",
    maxTokens: 120,
  },
  "character.bio": {
    noun: "backstory",
    instruction:
      "Three or four sentences, third person. How they came to be here and what they want. Their strongest abilities show in what they have done, never named as statistics.",
    maxTokens: 500,
  },
  "world.narratorPrompt": {
    noun: "narrator instruction",
    instruction:
      "One or two sentences telling the narrator how to write this world: register, sentence rhythm, what it refuses to spell out. Address the narrator directly. Never name a character, a place or an event.",
    maxTokens: 160,
  },
  "character.likes": {
    noun: "likes",
    instruction:
      "At most five comma-separated fragments naming what earns this character's patience: habits in other people, subjects, conditions, objects. Under fifteen words, no full stops. Specific, never a virtue like kindness.",
    maxTokens: 120,
  },
  "character.dislikes": {
    noun: "dislikes",
    instruction:
      "At most five comma-separated fragments naming what sets this character off: behaviours, subjects they refuse, conditions they cannot stand. Under fifteen words, no full stops. Specific, never a vice like dishonesty.",
    maxTokens: 120,
  },
  "character.responseStyle": {
    noun: "manner of speech",
    instruction:
      "One or two short sentences on how this character talks: sentence length, vocabulary, what they do when cornered, verbal tics. How they speak, never what they believe.",
    maxTokens: 140,
  },
};
