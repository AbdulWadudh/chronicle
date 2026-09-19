const WEBFONTS_ENDPOINT = "https://www.googleapis.com/webfonts/v1/webfonts";
const CACHE_KEY = "chronicle_google_fonts_v1";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const LINK_PREFIX = "chronicle-font-";

export interface GoogleFontFamily {
  family: string;
  category: string;
}

export type FontCatalogueFailure = "missing-api-key" | "request-failed";

export class GoogleFontsError extends Error {
  constructor(
    readonly reason: FontCatalogueFailure,
    message: string,
  ) {
    super(message);
    this.name = "GoogleFontsError";
  }
}

interface CachedCatalogue {
  fetchedAt: number;
  items: GoogleFontFamily[];
}

let memoryCache: GoogleFontFamily[] | null = null;
let inFlight: Promise<GoogleFontFamily[]> | null = null;

function apiKey(): string | undefined {
  const key = import.meta.env.VITE_GOOGLE_FONTS_API_KEY;
  return typeof key === "string" && key.length > 0 ? key : undefined;
}

function readCache(): GoogleFontFamily[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as CachedCatalogue;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed.items;
  } catch {
    return null;
  }
}

function writeCache(items: GoogleFontFamily[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), items }));
  } catch {
    memoryCache = items;
  }
}

export async function fetchFontCatalogue(forceRefresh = false): Promise<GoogleFontFamily[]> {
  if (!forceRefresh && memoryCache !== null) return memoryCache;
  if (inFlight !== null) return inFlight;

  inFlight = (async () => {
    if (!forceRefresh) {
      const cached = readCache();
      if (cached !== null) {
        memoryCache = cached;
        return cached;
      }
    }

    const key = apiKey();
    if (key === undefined) {
      throw new GoogleFontsError(
        "missing-api-key",
        "Set VITE_GOOGLE_FONTS_API_KEY to browse Google Fonts.",
      );
    }

    let response: Response;
    try {
      response = await fetch(`${WEBFONTS_ENDPOINT}?sort=popularity&key=${encodeURIComponent(key)}`);
    } catch {
      throw new GoogleFontsError("request-failed", "Could not reach Google Fonts.");
    }
    if (!response.ok) {
      throw new GoogleFontsError(
        "request-failed",
        `Google Fonts responded ${response.status}. Check the key and that the Web Fonts Developer API is enabled.`,
      );
    }

    const body = (await response.json()) as { items?: GoogleFontFamily[] };
    const items = (body.items ?? []).map((entry) => ({
      family: entry.family,
      category: entry.category,
    }));
    memoryCache = items;
    writeCache(items);
    return items;
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

export function searchFontCatalogue(
  catalogue: readonly GoogleFontFamily[],
  query: string,
  limit = Number.POSITIVE_INFINITY,
): GoogleFontFamily[] {
  const trimmed = query.trim().toLowerCase();
  const results: GoogleFontFamily[] = [];
  for (const entry of catalogue) {
    if (trimmed.length === 0 || entry.family.toLowerCase().includes(trimmed)) {
      results.push(entry);
      if (results.length >= limit) break;
    }
  }
  return results;
}

export function loadFontFamily(family: string): void {
  const id = `${LINK_PREFIX}${family.replace(/\s+/gu, "-").toLowerCase()}`;
  if (document.getElementById(id) !== null) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/gu, "+")}:wght@400;500;600;700&display=swap`;
  document.head.append(link);
}

const FALLBACKS: Record<string, string> = {
  serif: "ui-serif, Georgia, serif",
  "sans-serif": "ui-sans-serif, system-ui, sans-serif",
  display: "ui-sans-serif, system-ui, sans-serif",
  handwriting: "cursive",
  monospace: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

export function fontStack(family: string, category: string): string {
  return `"${family}", ${FALLBACKS[category] ?? FALLBACKS["sans-serif"]}`;
}

export function familyFromStack(stack: string): string | null {
  const match = /^"([^"]+)"/u.exec(stack.trim());
  return match?.[1] ?? null;
}
