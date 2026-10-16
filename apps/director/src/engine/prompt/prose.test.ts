import { expect, test } from "bun:test";
import type { Character, World } from "@chronicle/utils";
import { buildProseScenePrompt } from "~/engine/prompt/prose";

const world = {
  genre: "near-future decay",
  artStyle: "photoreal",
  shotSize: "waistUp",
} as World;

const kaelen = { id: "k", name: "Kaelen Thorne", pronouns: "he" } as Character;
const elara = { id: "e", name: "Elara Voss", pronouns: "she" } as Character;

const looks = new Map([
  ["k", { appearance: "lean, dark hair", outfit: "worn leather jacket" }],
  ["e", { appearance: "copper hair", outfit: "green tunic" }],
]);

test("referenced cast are named by image number in portrait order, unreferenced by description", () => {
  const prompt = buildProseScenePrompt(
    {
      world,
      character: kaelen,
      visual: "They brace against the railing",
      maxChars: 200,
      interacting: [elara],
      looks,
      shape: "portrait",
      worldStyle: "weathered steel",
    },
    ["k", "e"],
  );
  expect(prompt).toContain(
    "The man in image 1 is Kaelen Thorne, lean, dark hair, wearing worn leather jacket.",
  );
  expect(prompt).toContain("The woman in image 2 is Elara Voss");
  expect(prompt).toContain("Exactly 2 people in frame");
  expect(prompt).not.toContain("(");

  const noPortraits = buildProseScenePrompt(
    {
      world,
      character: kaelen,
      visual: "x",
      maxChars: 50,
      interacting: [],
      looks,
      shape: "square",
      worldStyle: "",
    },
    [],
  );
  expect(noPortraits).toContain("Kaelen Thorne is a man, lean, dark hair");
  expect(noPortraits).toContain("One person in frame");
});
