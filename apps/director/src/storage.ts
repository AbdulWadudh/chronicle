import { env } from "@chronicle/config/env";

export const UPLOAD_MAX_BYTES = 8 * 1024 * 1024;

export const UPLOAD_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

let client: Bun.S3Client | null = null;

function storage(): Bun.S3Client {
  if (client === null) {
    const configuration = env();
    client = new Bun.S3Client({
      endpoint: configuration.STORAGE_ENDPOINT,
      accessKeyId: configuration.STORAGE_ACCESS_KEY,
      secretAccessKey: configuration.STORAGE_SECRET_KEY,
      bucket: configuration.STORAGE_BUCKET_ASSETS,
      region: configuration.STORAGE_REGION,
    });
  }
  return client;
}

export async function upload(key: string, bytes: Uint8Array, type: string): Promise<string> {
  await storage().write(key, bytes, { type });
  return `${env().STORAGE_ENDPOINT}/${env().STORAGE_BUCKET_ASSETS}/${key}?v=${Date.now()}`;
}
