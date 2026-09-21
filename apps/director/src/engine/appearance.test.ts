import { expect, test } from "bun:test";
import { LOOK_MAX_CHARS, tidyLook } from "~/engine/appearance";

test("turns full stops into fragment breaks", () => {
  expect(tidyLook("Male, mid-30s, lean. Short messy hair.")).toBe(
    "Male, mid-30s, lean, Short messy hair",
  );
});

test("never exceeds the cap that keeps the action inside the token window", () => {
  const long =
    "Archivist woman, scarred hands, worn clothes, hiding in apartment, city skyline through window";
  const tidied = tidyLook(long);
  expect(tidied.length).toBeLessThanOrEqual(LOOK_MAX_CHARS);
  expect(tidied.startsWith("Archivist woman, scarred hands")).toBe(true);
});

test("drops a single oversized fragment rather than cutting a word in half", () => {
  expect(tidyLook("x".repeat(200))).toBe("");
});

test("honours a per-field cap so no look category is dropped whole", () => {
  expect(tidyLook("mussed dark brown hair, streaked with grease and soot", 26)).toBe(
    "mussed dark brown hair",
  );
});
