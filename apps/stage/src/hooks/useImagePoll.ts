import { useEffect, useState } from "react";
import { get } from "~/lib/api";

const INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 60;

export interface ImagePoll {
  url: string | null;
  pending: boolean;
}

export function useImagePoll<T>(
  path: string | null,
  select: (entity: T) => string | null,
  previous: string | null = null,
): ImagePoll {
  const [url, setUrl] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setUrl(null);
    if (path === null) {
      setPending(false);
      return;
    }

    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    setPending(true);

    const poll = async (): Promise<void> => {
      attempts += 1;
      const found = select(await get<T>(path));
      if (cancelled) return;
      if (found !== null && found !== previous) {
        setUrl(found);
        setPending(false);
        return;
      }
      if (attempts >= MAX_ATTEMPTS) {
        setPending(false);
        return;
      }
      timer = setTimeout(() => void poll().catch(() => setPending(false)), INTERVAL_MS);
    };

    timer = setTimeout(() => void poll().catch(() => setPending(false)), INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timer !== null) clearTimeout(timer);
    };
  }, [path, select, previous]);

  return { url, pending };
}
