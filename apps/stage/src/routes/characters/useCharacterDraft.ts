import { API } from "@chronicle/config";
import { baselineStats, isValidBuild, type Pronouns, type StatBlock } from "@chronicle/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { patch, post } from "~/lib/api";
import type { CharacterSummary, WorldDetail } from "~/lib/entities";

function message(cause: unknown, fallback: string): string {
  return cause instanceof Error && cause.message.length > 0 ? cause.message : fallback;
}

export function useCharacterDraft(world: WorldDetail | null, existing?: CharacterSummary | null) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [pronouns, setPronouns] = useState<Pronouns>("they");
  const [stats, setStats] = useState<StatBlock>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (world === null) return;
    setName(existing?.name ?? "");
    setBio(existing?.bio ?? "");
    setPronouns(existing?.pronouns ?? "they");
    setStats(existing?.statsJson ?? baselineStats(world.statDefinitionsJson));
    setError(null);
  }, [world, existing]);

  const reset = useCallback(() => {
    setName(existing?.name ?? "");
    setBio(existing?.bio ?? "");
    setPronouns(existing?.pronouns ?? "they");
    setError(null);
    if (world !== null) {
      setStats(existing?.statsJson ?? baselineStats(world.statDefinitionsJson));
    }
  }, [world, existing]);

  const save = useCallback(async (): Promise<CharacterSummary | null> => {
    if (world === null) return null;
    setSaving(true);
    setError(null);
    const payload = { name: name.trim(), bio: bio.trim(), pronouns, stats };
    try {
      if (existing != null) {
        return await patch<CharacterSummary>(`${API.characters}/${existing.id}`, payload);
      }
      return await post<CharacterSummary>(API.characters, { worldId: world.id, ...payload });
    } catch (cause) {
      setError(message(cause, "The character could not be saved."));
      return null;
    } finally {
      setSaving(false);
    }
  }, [world, existing, name, bio, pronouns, stats]);

  const strengths = useMemo(() => {
    if (world === null) return "";
    return world.statDefinitionsJson
      .filter((definition) => (stats[definition.id] ?? 1) >= 3)
      .map((definition) => definition.label)
      .join(", ");
  }, [world, stats]);

  const composeContext = useMemo(
    () => ({ name, bio, strengths, pronouns }),
    [name, bio, strengths, pronouns],
  );

  const nameReady = name.trim().length > 0;
  const buildValid =
    world !== null && isValidBuild(stats, world.statDefinitionsJson, world.pointBudget);

  return {
    name,
    setName,
    bio,
    setBio,
    pronouns,
    setPronouns,
    stats,
    setStats,
    reset,
    save,
    saving,
    error,
    nameReady,
    composeContext,
    complete: nameReady && buildValid && bio.trim().length > 0,
  };
}
