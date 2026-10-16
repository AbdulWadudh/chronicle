import { API } from "@chronicle/config";
import { baselineStats, isValidBuild, type Pronouns, type StatBlock } from "@chronicle/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { patch, post } from "~/lib/api";
import type { CharacterSummary, WorldDetail } from "~/lib/entities";
import { queryKeys } from "~/lib/queryKeys";

function message(cause: unknown, fallback: string): string {
  return cause instanceof Error && cause.message.length > 0 ? cause.message : fallback;
}

export function useCharacterDraft(world: WorldDetail | null, existing?: CharacterSummary | null) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [appearance, setAppearance] = useState("");
  const [outfit, setOutfit] = useState("");
  const [outfitLocked, setOutfitLocked] = useState(true);
  const [pronouns, setPronouns] = useState<Pronouns>("they");
  const [likes, setLikes] = useState("");
  const [dislikes, setDislikes] = useState("");
  const [responseStyle, setResponseStyle] = useState("");
  const [eagerness, setEagerness] = useState(50);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [stats, setStats] = useState<StatBlock>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (world === null) return;
    setName(existing?.name ?? "");
    setBio(existing?.bio ?? "");
    setAppearance(existing?.appearance ?? "");
    setOutfit(existing?.outfit ?? "");
    setOutfitLocked(existing?.outfitLocked ?? true);
    setPronouns(existing?.pronouns ?? "they");
    setLikes(existing?.likes ?? "");
    setDislikes(existing?.dislikes ?? "");
    setResponseStyle(existing?.responseStyle ?? "");
    setEagerness(existing?.eagerness ?? 50);
    setVoiceId(existing?.voiceId ?? null);
    setStats(existing?.statsJson ?? baselineStats(world.statDefinitionsJson));
    setError(null);
  }, [world, existing]);

  const reset = useCallback(() => {
    setName(existing?.name ?? "");
    setBio(existing?.bio ?? "");
    setAppearance(existing?.appearance ?? "");
    setOutfit(existing?.outfit ?? "");
    setOutfitLocked(existing?.outfitLocked ?? true);
    setPronouns(existing?.pronouns ?? "they");
    setLikes(existing?.likes ?? "");
    setDislikes(existing?.dislikes ?? "");
    setResponseStyle(existing?.responseStyle ?? "");
    setEagerness(existing?.eagerness ?? 50);
    setVoiceId(existing?.voiceId ?? null);
    setError(null);
    if (world !== null) {
      setStats(existing?.statsJson ?? baselineStats(world.statDefinitionsJson));
    }
  }, [world, existing]);

  const save = useCallback(async (): Promise<CharacterSummary | null> => {
    if (world === null) return null;
    setSaving(true);
    setError(null);
    const payload = {
      name: name.trim(),
      bio: bio.trim(),
      appearance: appearance.trim(),
      outfit: outfit.trim(),
      outfitLocked,
      pronouns,
      likes: likes.trim(),
      dislikes: dislikes.trim(),
      responseStyle: responseStyle.trim(),
      eagerness,
      voiceId,
      stats,
    };
    try {
      const saved =
        existing != null
          ? await patch<CharacterSummary>(`${API.characters}/${existing.id}`, payload)
          : await post<CharacterSummary>(API.characters, { worldId: world.id, ...payload });
      void queryClient.invalidateQueries({ queryKey: ["characters"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.character(saved.id) });
      return saved;
    } catch (cause) {
      setError(message(cause, "The character could not be saved."));
      return null;
    } finally {
      setSaving(false);
    }
  }, [
    queryClient,
    world,
    existing,
    name,
    bio,
    appearance,
    outfit,
    outfitLocked,
    pronouns,
    likes,
    dislikes,
    responseStyle,
    eagerness,
    voiceId,
    stats,
  ]);

  const strengths = useMemo(() => {
    if (world === null) return "";
    return world.statDefinitionsJson
      .filter((definition) => (stats[definition.id] ?? 1) >= 3)
      .map((definition) => definition.label)
      .join(", ");
  }, [world, stats]);

  const composeContext = useMemo(
    () => ({ name, bio, appearance, outfit, strengths, pronouns, likes, dislikes, responseStyle }),
    [name, bio, appearance, outfit, strengths, pronouns, likes, dislikes, responseStyle],
  );

  const nameReady = name.trim().length > 0;
  const buildValid =
    world !== null && isValidBuild(stats, world.statDefinitionsJson, world.pointBudget);

  return {
    name,
    setName,
    bio,
    setBio,
    appearance,
    setAppearance,
    outfit,
    setOutfit,
    outfitLocked,
    setOutfitLocked,
    pronouns,
    setPronouns,
    likes,
    setLikes,
    dislikes,
    setDislikes,
    responseStyle,
    setResponseStyle,
    eagerness,
    setEagerness,
    voiceId,
    setVoiceId,
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
