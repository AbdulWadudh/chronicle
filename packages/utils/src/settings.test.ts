import { expect, test } from "bun:test";
import { DEFAULT_RUNTIME_SETTINGS } from "@chronicle/config";
import { mergeRuntimeSettings } from "./settings";

test("a nested engine patch changes one field and keeps its siblings and the other engine", () => {
  const base = mergeRuntimeSettings(DEFAULT_RUNTIME_SETTINGS, {
    image: { klein: { model: "custom-klein.safetensors" } },
  });
  const next = mergeRuntimeSettings(base, { image: { engine: "sdxl", klein: { steps: 6 } } });

  expect(next.image.engine).toBe("sdxl");
  expect(next.image.klein.steps).toBe(6);
  expect(next.image.klein.model).toBe("custom-klein.safetensors");
  expect(next.image.sdxl).toEqual(DEFAULT_RUNTIME_SETTINGS.image.sdxl);
});
