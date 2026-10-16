import { API } from "@chronicle/config";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { get } from "~/lib/api";
import { queryKeys } from "~/lib/queryKeys";

export interface Voice {
  id: string;
  label: string;
  locale: string;
  gender: string;
  grade: string | null;
}

export interface VoiceGroup {
  label: string;
  values: string[];
}

export interface VoiceCatalogue {
  groups: VoiceGroup[];
  byId: ReadonlyMap<string, Voice>;
  loading: boolean;
  error: string | null;
}

const GRADE_ORDER = ["A", "B", "C", "D", "F"];

function rank(grade: string | null): number {
  if (grade === null) return GRADE_ORDER.length;
  const index = GRADE_ORDER.indexOf(grade.charAt(0).toUpperCase());
  return index === -1 ? GRADE_ORDER.length : index;
}

export function useVoices(): VoiceCatalogue {
  const query = useQuery({
    queryKey: queryKeys.voices(),
    queryFn: () => get<{ voices: Voice[] }>(API.voices),
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });

  return useMemo(() => {
    const voices = query.data?.voices ?? [];
    const buckets = new Map<string, Voice[]>();
    for (const voice of voices) {
      const key = `${voice.locale} · ${voice.gender}`;
      const bucket = buckets.get(key);
      if (bucket === undefined) buckets.set(key, [voice]);
      else bucket.push(voice);
    }

    return {
      groups: [...buckets.entries()].map(([label, items]) => ({
        label,
        values: [...items]
          .sort((left, right) => rank(left.grade) - rank(right.grade))
          .map((voice) => voice.id),
      })),
      byId: new Map(voices.map((voice) => [voice.id, voice])),
      loading: query.isPending,
      error: query.error === null ? null : (query.error.message ?? "Kokoro could not be reached."),
    };
  }, [query.data, query.isPending, query.error]);
}
