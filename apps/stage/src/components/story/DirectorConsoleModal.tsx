import type { StatBlock, StatDefinition, StatePatch } from "@chronicle/shared";
import { clampStatRank } from "@chronicle/shared";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { AppModal } from "~/components/common/AppModal";
import { NumberField } from "~/components/common/NumberField";

export interface DirectorConsoleModalProps {
  visible: boolean;
  onClose: () => void;
  statDefinitions: readonly StatDefinition[];
  stats: StatBlock;
  affinities: Record<string, number>;
  onApply: (patch: StatePatch, whisper: string | null) => void;
  onSaveCheckpoint: (name: string) => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold uppercase tracking-wide text-text-muted">{title}</Text>
      {children}
    </View>
  );
}

export function DirectorConsoleModal({
  visible,
  onClose,
  statDefinitions,
  stats,
  affinities,
  onApply,
  onSaveCheckpoint,
}: DirectorConsoleModalProps) {
  const [draftStats, setDraftStats] = useState<StatBlock>(stats);
  const [draftAffinities, setDraftAffinities] = useState(affinities);
  const [whisper, setWhisper] = useState("");
  const [checkpointName, setCheckpointName] = useState("");

  function apply(): void {
    onApply(
      { statOverrides: draftStats, affinityDeltas: diffAffinities(affinities, draftAffinities) },
      whisper.trim().length > 0 ? whisper.trim() : null,
    );
    setWhisper("");
    onClose();
  }

  return (
    <AppModal
      visible={visible}
      title="Director's Console"
      onClose={onClose}
      actions={[
        { label: "Cancel", onPress: onClose, tone: "secondary" },
        { label: "Apply", onPress: apply, tone: "primary" },
      ]}
    >
      <Section title="Stats">
        {statDefinitions.map((definition) => (
          <NumberField
            key={definition.id}
            label={definition.label}
            value={draftStats[definition.id] ?? 1}
            min={1}
            max={5}
            onChange={(next) =>
              setDraftStats((previous) => ({ ...previous, [definition.id]: clampStatRank(next) }))
            }
          />
        ))}
      </Section>

      <Section title="NPC affinities">
        {Object.keys(draftAffinities).length === 0 ? (
          <Text className="text-sm text-text-muted">No relationships tracked yet.</Text>
        ) : (
          Object.entries(draftAffinities).map(([name, value]) => (
            <NumberField
              key={name}
              label={name}
              value={value}
              min={-100}
              max={100}
              step={5}
              onChange={(next) => setDraftAffinities((previous) => ({ ...previous, [name]: next }))}
            />
          ))
        )}
      </Section>

      <Section title="Director's whisper">
        <TextInput
          value={whisper}
          onChangeText={setWhisper}
          placeholder="Hidden instruction for the next turn…"
          multiline
          className="min-h-20 rounded-xl border border-card-border bg-input-surface px-4 py-3 text-text-primary"
        />
      </Section>

      <Section title="Checkpoint">
        <View className="flex-row gap-2">
          <TextInput
            value={checkpointName}
            onChangeText={setCheckpointName}
            placeholder="Checkpoint name"
            className="flex-1 rounded-xl border border-card-border bg-input-surface px-4 py-3 text-text-primary"
          />
          <Pressable
            onPress={() => {
              if (checkpointName.trim().length === 0) return;
              onSaveCheckpoint(checkpointName.trim());
              setCheckpointName("");
            }}
            accessibilityRole="button"
            className="rounded-xl bg-secondary px-4 py-3 active:opacity-80"
          >
            <Text className="text-secondary-foreground">Save</Text>
          </Pressable>
        </View>
      </Section>
    </AppModal>
  );
}

function diffAffinities(
  before: Record<string, number>,
  after: Record<string, number>,
): Record<string, number> {
  const deltas: Record<string, number> = {};
  for (const [name, value] of Object.entries(after)) {
    const previous = before[name] ?? 0;
    if (value !== previous) deltas[name] = value - previous;
  }
  return deltas;
}
