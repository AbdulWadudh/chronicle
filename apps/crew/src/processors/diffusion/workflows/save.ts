export const NODE_SAVE = "9";

export function saveNode(
  prefix: string,
  quality: number,
  images: [string, number],
): Record<string, unknown> {
  return {
    class_type: "SaveAnimatedWEBP",
    inputs: {
      filename_prefix: `chronicle/${prefix}`,
      images,
      fps: 1,
      lossless: false,
      quality,
      method: "default",
    },
  };
}
