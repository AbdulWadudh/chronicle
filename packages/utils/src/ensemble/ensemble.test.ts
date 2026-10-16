import { expect, test } from "bun:test";
import { bondBand, bondKey } from "./bonds";
import { parseAttributedLines, spokenBy } from "./dialogue";
import { mentionedIn } from "./mentions";
import { pickSpeakers } from "./speakers";

const CAST = [
  { id: "c1", name: "Corvin Ashgrave" },
  { id: "c2", name: "Seraphina Vane" },
];

test("attributes a spoken line and strips the quotes the model adds anyway", () => {
  const parsed = parseAttributedLines('Corvin Ashgrave: "Three souls. Two memories."', CAST);
  expect(parsed).toEqual([
    { text: "Three souls.", speakerId: "c1" },
    { text: "Two memories.", speakerId: "c1" },
  ]);
});

test("an unprefixed line is narration, and indexes stay global across speakers", () => {
  const parsed = parseAttributedLines(
    ["The tide rises.", "Corvin Ashgrave: Three souls.", "Seraphina Vane: It is the bell."].join(
      "\n",
    ),
    CAST,
  );
  expect(parsed.map((line) => line.speakerId)).toEqual([null, "c1", "c2"]);
  expect(spokenBy(parsed)).toEqual(["c1", "c2"]);
});

test("a first name alone attributes, an unknown name stays narration", () => {
  expect(parseAttributedLines("Corvin: Three souls.", CAST)[0]?.speakerId).toBe("c1");
  expect(parseAttributedLines("Someone Else: hello.", CAST)[0]?.speakerId).toBe(null);
});

test("a colon inside prose does not steal the line", () => {
  const parsed = parseAttributedLines("She had one rule: never open the ledger twice.", CAST);
  expect(parsed[0]?.speakerId).toBe(null);
});

test("mentioned characters always speak, even past the eagerness roll", () => {
  const present = [
    { id: "c1", name: "Corvin", eagerness: 0 },
    { id: "c2", name: "Seraphina", eagerness: 100 },
  ];
  const picked = pickSpeakers({
    present,
    mentionedIds: ["c1"],
    maxSpeakers: 1,
    speakChance: 0,
    random: () => 0.99,
  });
  expect(picked).toEqual(["c1"]);
});

test("eagerness zero never gets picked unprompted", () => {
  const present = [
    { id: "c1", name: "Corvin", eagerness: 0 },
    { id: "c2", name: "Seraphina", eagerness: 100 },
  ];
  const picked = pickSpeakers({ present, maxSpeakers: 1, speakChance: 1, random: () => 0.5 });
  expect(picked).toEqual(["c2"]);
});

test("someone always speaks when the cast is present; chattiness only gates the ones after", () => {
  const present = [
    { id: "c1", name: "Corvin", eagerness: 100 },
    { id: "c2", name: "Seraphina", eagerness: 100 },
  ];
  const picked = pickSpeakers({ present, maxSpeakers: 2, speakChance: 0, random: () => 1 });
  expect(picked).toHaveLength(1);
});

test("an empty room yields no speakers and the solo path takes over", () => {
  expect(pickSpeakers({ present: [], maxSpeakers: 2, speakChance: 1, random: () => 0 })).toEqual(
    [],
  );
});

test("never exceeds maxSpeakers", () => {
  const present = [
    { id: "c1", name: "A", eagerness: 50 },
    { id: "c2", name: "B", eagerness: 50 },
    { id: "c3", name: "C", eagerness: 50 },
  ];
  const picked = pickSpeakers({
    present,
    mentionedIds: ["c1", "c2", "c3"],
    maxSpeakers: 2,
    speakChance: 1,
    random: () => 0,
  });
  expect(picked).toHaveLength(2);
});

test("bond bands read off the scale, neutral around zero", () => {
  expect(bondBand(0).id).toBe("neutral");
  expect(bondBand(-100).id).toBe("hostile");
  expect(bondBand(100).id).toBe("devoted");
  expect(bondBand(-20).id).toBe("wary");
  expect(bondKey("a", "b")).toBe("a>b");
});

const WORLD = [
  { id: "c1", name: "Kaelen Thorne" },
  { id: "c2", name: "Nia Solace" },
  { id: "c3", name: "Will Baxter" },
];

test("an @mention typed by hand counts, with or without the surname", () => {
  expect(mentionedIn("I ask @Nia Solace to explain.", WORLD)).toEqual(["c2"]);
  expect(mentionedIn("I look at @Kaelen and wait.", WORLD)).toEqual(["c1"]);
});

test("a choice that names someone counts, because SELECT_CHOICE sends no ids", () => {
  expect(mentionedIn("I shout at Kaelen Thorne to confirm the corrosion data.", WORLD)).toEqual([
    "c1",
  ]);
});

test("an ordinary word that happens to be a name does not count", () => {
  expect(mentionedIn("I will go to the harbour and wait.", WORLD)).toEqual([]);
  expect(mentionedIn("Will Baxter blocks the door.", WORLD)).toEqual(["c3"]);
});

test("explicit ids from the composer win and are never dropped", () => {
  expect(mentionedIn("I say nothing at all.", WORLD, ["c2"])).toEqual(["c2"]);
  expect(mentionedIn("I turn to Kaelen Thorne.", WORLD, ["c2"])).toEqual(["c2", "c1"]);
});
