import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const APPLICATION_DIRECTORY = "chronicle";

export function resolveDataRoot(): string {
  if (process.platform === "win32") {
    const roaming = process.env.APPDATA ?? join(homedir(), "AppData", "Roaming");
    return join(roaming, APPLICATION_DIRECTORY);
  }
  const dataHome = process.env.XDG_DATA_HOME ?? join(homedir(), ".local", "share");
  return join(dataHome, APPLICATION_DIRECTORY);
}

export function defaultDatabasePath(): string {
  return join(resolveDataRoot(), "data.db");
}

export function defaultVectorDatabasePath(): string {
  return join(resolveDataRoot(), "vectors");
}

export function defaultStageDistPath(): string {
  return resolve(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "..",
    "apps",
    "stage",
    "dist",
  );
}

export async function ensureFile(target: string): Promise<string> {
  const file = Bun.file(target);
  if (!(await file.exists())) await Bun.write(file, new Uint8Array(0));
  return target;
}
