import { env } from "@chronicle/config/env";

let client: Bun.S3Client | null = null;

export function storage(): Bun.S3Client {
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
  const configuration = env();
  await storage().write(key, bytes, { type });
  return `${configuration.STORAGE_ENDPOINT}/${configuration.STORAGE_BUCKET_ASSETS}/${key}`;
}
