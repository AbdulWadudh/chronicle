import { expect, test } from "bun:test";
import type { Character, TurnNode } from "@chronicle/utils";
import { presentFor } from "~/engine/ensemble";

const actor = (id: string, name: string): Character =>
  ({ id, name, eagerness: 50, pronouns: "they" }) as Character;

const CAST = [actor("c1", "Elara Voss"), actor("c2", "Nia Solace")];

const turn = (narrativeText: string, present?: string[]): TurnNode =>
  ({
    narrativeText,
    cast: present === undefined ? null : { present },
  }) as TurnNode;

test("a recorded cast is used verbatim", () => {
  const present = presentFor(CAST, turn("anything at all", ["c2"]));
  expect(present.map((a) => a.name)).toEqual(["Nia Solace"]);
});

test("without a record, presence is seeded from who the last turn actually named", () => {
  const present = presentFor(CAST, turn("Nia Solace steps out of the stairwell."));
  expect(present.map((a) => a.name)).toEqual(["Nia Solace"]);
});

test("someone the story left behind is not in the scene", () => {
  const present = presentFor(CAST, turn("You land hard on the aqueduct ledge. Hunters close in."));
  expect(present).toEqual([]);
});

test("the very first turn of a world opens with the cast on hand", () => {
  expect(presentFor(CAST, undefined).map((a) => a.name)).toEqual(["Elara Voss", "Nia Solace"]);
});
