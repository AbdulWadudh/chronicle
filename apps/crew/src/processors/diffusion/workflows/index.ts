import type { RenderParams } from "@chronicle/utils";
import { buildKleinWorkflow } from "./klein";
import { buildSdxlWorkflow, NODE_HIRES_SAMPLER } from "./sdxl";

export { NODE_HIRES_SAMPLER };

export function buildWorkflow(
  render: RenderParams,
  prefix: string,
  portraitFilenames: readonly string[] = [],
): Record<string, unknown> {
  return render.engine === "klein"
    ? buildKleinWorkflow(render, prefix, portraitFilenames)
    : buildSdxlWorkflow(render, prefix, portraitFilenames);
}
