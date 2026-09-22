import { useQuery } from "@tanstack/react-query";
import { get } from "~/lib/api";

const INTERVAL_MS = 3000;

export interface ImagePoll {
  url: string | null;
  pending: boolean;
}

export function useImagePoll<T>(
  path: string | null,
  select: (entity: T) => string | null,
  previous: string | null = null,
): ImagePoll {
  const query = useQuery({
    queryKey: ["image-poll", path, previous],
    queryFn: () => get<T>(path as string),
    enabled: path !== null,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: (query) => {
      const found = query.state.data === undefined ? null : select(query.state.data);
      return found !== null && found !== previous ? false : INTERVAL_MS;
    },
  });

  const found = query.data === undefined ? null : select(query.data);
  const arrived = found !== null && found !== previous;

  return {
    url: arrived ? found : null,
    pending: path !== null && !arrived,
  };
}
