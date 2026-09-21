import { API, STATS } from "@chronicle/config";
import type { RenderStyle, ShotSize, StatDefinition, WorldVisibility } from "@chronicle/utils";
import { useCallback, useMemo, useState } from "react";
import { post } from "~/lib/api";
import type { WorldSummary } from "~/lib/entities";

const MAX_RANK_COST = 6;

function slug(value: string, fallback: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
  return cleaned.length > 0 ? cleaned : fallback;
}

function identify(definitions: readonly StatDefinition[]): StatDefinition[] {
  const taken = new Set<string>();
  return definitions.map((definition, index) => {
    let id = slug(definition.label, `stat-${index + 1}`);
    while (taken.has(id)) id = `${id}-${index + 1}`;
    taken.add(id);
    return { ...definition, id, label: definition.label.trim() };
  });
}

export interface WorldDraft {
  premise: string;
  title: string;
  genre: string;
  description: string;
  opening: string;
  visualStyle: string;
  shotSize: ShotSize;
  artStyle: RenderStyle;
  statDefinitions: StatDefinition[];
  pointBudget: number;
  visibility: WorldVisibility;
}

interface AssistResponse {
  title: string;
  genre: string;
  description: string;
  openingSummary: string;
  statDefinitions: StatDefinition[];
}

const EMPTY: WorldDraft = {
  premise: "",
  title: "",
  genre: "",
  description: "",
  opening: "",
  visualStyle: "",
  shotSize: "waistUp",
  artStyle: "photoreal",
  statDefinitions: [],
  pointBudget: STATS.defaultPointBudget,
  visibility: "private",
};

function message(cause: unknown, fallback: string): string {
  return cause instanceof Error && cause.message.length > 0 ? cause.message : fallback;
}

export function useWorldDraft() {
  const [draft, setDraft] = useState<WorldDraft>(EMPTY);
  const [drafting, setDrafting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(<K extends keyof WorldDraft>(key: K, value: WorldDraft[K]) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setDraft(EMPTY);
    setError(null);
  }, []);

  const assist = useCallback(async (): Promise<void> => {
    setDrafting(true);
    setError(null);
    try {
      const drafted = await post<AssistResponse>(`${API.worlds}/assist`, {
        premise: draft.premise.trim(),
      });
      setDraft((previous) => ({
        ...previous,
        title: drafted.title,
        genre: drafted.genre,
        description: drafted.description,
        opening: drafted.openingSummary,
        statDefinitions: drafted.statDefinitions,
      }));
    } catch (cause) {
      setError(message(cause, "The game master could not draft that world."));
    } finally {
      setDrafting(false);
    }
  }, [draft.premise]);

  const save = useCallback(async (): Promise<WorldSummary | null> => {
    setSaving(true);
    setError(null);
    try {
      return await post<WorldSummary>(API.worlds, {
        title: draft.title.trim(),
        genre: draft.genre.trim(),
        description: draft.description.trim(),
        visualStyle: draft.visualStyle.trim(),
        shotSize: draft.shotSize,
        artStyle: draft.artStyle,
        visibility: draft.visibility,
        statDefinitions: identify(draft.statDefinitions),
        pointBudget: draft.pointBudget,
        initialState: { summary: draft.opening.trim() },
      });
    } catch (cause) {
      setError(message(cause, "The world could not be saved."));
      return null;
    } finally {
      setSaving(false);
    }
  }, [draft]);

  const composeContext = useMemo(
    () => ({
      premise: draft.premise,
      title: draft.title,
      genre: draft.genre,
      description: draft.description,
      opening: draft.opening,
      visualStyle: draft.visualStyle,
      abilities: draft.statDefinitions
        .map((definition) => definition.label)
        .filter((label) => label.trim().length > 0),
    }),
    [draft],
  );

  const maximumSpend = draft.statDefinitions.length * MAX_RANK_COST;
  const everythingAffordable = maximumSpend > 0 && draft.pointBudget >= maximumSpend;

  const complete = useMemo(
    () =>
      draft.title.trim().length > 0 &&
      draft.description.trim().length > 0 &&
      draft.statDefinitions.length > 0 &&
      draft.statDefinitions.every((stat) => stat.label.trim().length > 0),
    [draft],
  );

  return {
    draft,
    update,
    reset,
    assist,
    save,
    drafting,
    saving,
    error,
    complete,
    composeContext,
    maximumSpend,
    everythingAffordable,
  };
}
