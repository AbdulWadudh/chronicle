import type { StatBlock, StatDefinition, StatePatch } from "@chronicle/shared";
import { clampStatRank } from "@chronicle/shared";
import { type ReactNode, useState } from "react";
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">{title}</h3>
      {children}
    </section>
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
          <p className="text-sm text-text-muted">No relationships tracked yet.</p>
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
        <textarea
          value={whisper}
          onChange={(event) => setWhisper(event.target.value)}
          placeholder="Hidden instruction for the next turn…"
          aria-label="Director's whisper"
          className="min-h-20 resize-none rounded-xl border border-card-border bg-input-surface px-4 py-3 text-text-primary outline-none placeholder:text-text-muted"
        />
      </Section>

      <Section title="Checkpoint">
        <div className="flex gap-2">
          <input
            value={checkpointName}
            onChange={(event) => setCheckpointName(event.target.value)}
            placeholder="Checkpoint name"
            aria-label="Checkpoint name"
            className="flex-1 rounded-xl border border-card-border bg-input-surface px-4 py-3 text-text-primary outline-none placeholder:text-text-muted"
          />
          <button
            type="button"
            disabled={checkpointName.trim().length === 0}
            onClick={() => {
              onSaveCheckpoint(checkpointName.trim());
              setCheckpointName("");
            }}
            className="rounded-xl bg-secondary px-4 py-3 text-secondary-foreground disabled:opacity-40"
          >
            Save
          </button>
        </div>
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
