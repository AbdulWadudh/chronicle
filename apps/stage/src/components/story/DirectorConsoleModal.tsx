import type { StatBlock, StatDefinition, StatePatch } from "@chronicle/utils";
import { clampStatRank } from "@chronicle/utils";
import {
  Bookmark01Icon,
  ChartAverageIcon,
  Image01Icon,
  PlayListIcon,
  PreferenceHorizontalIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { type ReactNode, useState } from "react";
import { NumberField } from "~/components/common/NumberField";
import { type GroupMeta, SettingsGroup } from "~/components/common/SettingsGroup";
import { Label } from "~/components/ui/label";
import { Sheet } from "~/components/ui/sheet";
import { Switch } from "~/components/ui/switch";
import { WorldLookFields } from "~/components/world/WorldLookFields";
import { useCompose } from "~/hooks/useCompose";
import { useWorldLook } from "~/hooks/useWorldLook";
import { useThemeStore } from "~/theme/store";

export interface DirectorConsoleModalProps {
  visible: boolean;
  worldId: string | null;
  onClose: () => void;
  statDefinitions: readonly StatDefinition[];
  stats: StatBlock;
  affinities: Record<string, number>;
  onApply: (patch: StatePatch) => void;
  onSaveCheckpoint: (name: string) => void;
}

const SECTIONS = {
  playback: {
    title: "Playback",
    blurb: "What the controls under each turn do while you read.",
    icon: PlayListIcon,
  },
  imagery: {
    title: "Imagery",
    blurb: "The look every cover, portrait and scene in this world is drawn from.",
    icon: Image01Icon,
  },
  stats: {
    title: "Stats",
    blurb: "Override this character's ability ranks.",
    icon: ChartAverageIcon,
  },
  affinities: {
    title: "NPC affinities",
    blurb: "How the cast currently feels about you.",
    icon: UserMultipleIcon,
  },
  checkpoint: {
    title: "Checkpoint",
    blurb: "Save this moment so you can branch back to it later.",
    icon: Bookmark01Icon,
  },
} as const satisfies Record<string, GroupMeta>;

type SectionName = keyof typeof SECTIONS;

const ORDER: readonly SectionName[] = ["playback", "imagery", "stats", "affinities", "checkpoint"];

function Section({
  name,
  openSection,
  onOpenSection,
  children,
}: {
  name: SectionName;
  openSection: SectionName | null;
  onOpenSection: (name: SectionName | null) => void;
  children: ReactNode;
}) {
  return (
    <SettingsGroup
      meta={SECTIONS[name]}
      index={ORDER.indexOf(name)}
      open={openSection === name}
      onOpenChange={(next) => onOpenSection(next ? name : null)}
    >
      {children}
    </SettingsGroup>
  );
}

export function DirectorConsoleModal({
  visible,
  worldId,
  onClose,
  statDefinitions,
  stats,
  affinities,
  onApply,
  onSaveCheckpoint,
}: DirectorConsoleModalProps) {
  const [draftStats, setDraftStats] = useState<StatBlock>(stats);
  const [draftAffinities, setDraftAffinities] = useState(affinities);
  const [checkpointName, setCheckpointName] = useState("");
  const [openSection, setOpenSection] = useState<SectionName | null>("playback");
  const historyActions = useThemeStore((state) => state.historyActions);
  const toggleHistoryActions = useThemeStore((state) => state.toggleHistoryActions);
  const look = useWorldLook(worldId);
  const compose = useCompose();

  async function draftStyle(mode: "generate" | "enhance"): Promise<void> {
    const value = await compose.run(
      "world.visualStyle",
      mode,
      { visualStyle: look.visualStyle },
      worldId,
    );
    if (value !== null) look.setVisualStyle(value);
  }

  function apply(): void {
    void look.save();
    onApply({
      statOverrides: draftStats,
      affinityDeltas: diffAffinities(affinities, draftAffinities),
    });
    onClose();
  }

  return (
    <Sheet
      open={visible}
      storageKey="director-console"
      icon={PreferenceHorizontalIcon}
      title="Story settings"
      subtitle="Playback, stats and checkpoints for this story"
      onClose={onClose}
      actions={[
        { label: "Cancel", onPress: onClose, tone: "secondary" },
        { label: "Apply", onPress: apply, tone: "primary" },
      ]}
    >
      <Section name="playback" openSection={openSection} onOpenSection={setOpenSection}>
        <div className="flex items-center justify-between gap-4 rounded-card border-(length:--border-width-card) border-card-border bg-raised px-4 py-3">
          <div className="min-w-0">
            <Label htmlFor="history-actions">Actions on past turns</Label>
            <p className="mt-0.5 text-[0.75rem] leading-relaxed text-text-muted">
              Show the narration and re-voice buttons under every earlier turn.
            </p>
          </div>
          <Switch
            id="history-actions"
            checked={historyActions}
            onCheckedChange={toggleHistoryActions}
            aria-label="Actions on past turns"
          />
        </div>
      </Section>

      <Section name="imagery" openSection={openSection} onOpenSection={setOpenSection}>
        {look.loaded ? (
          <WorldLookFields
            visualStyle={look.visualStyle}
            shotSize={look.shotSize}
            artStyle={look.artStyle}
            busyMode={compose.modeFor("world.visualStyle")}
            onVisualStyleChange={look.setVisualStyle}
            onShotSizeChange={look.setShotSize}
            onArtStyleChange={look.setArtStyle}
            onCompose={(mode) => void draftStyle(mode)}
          />
        ) : (
          <p className="text-sm text-text-muted">Reading this world…</p>
        )}
        {look.error === null ? null : (
          <p role="alert" className="text-[0.8125rem] text-danger">
            {look.error}
          </p>
        )}
      </Section>

      <Section name="stats" openSection={openSection} onOpenSection={setOpenSection}>
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

      <Section name="affinities" openSection={openSection} onOpenSection={setOpenSection}>
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

      <Section name="checkpoint" openSection={openSection} onOpenSection={setOpenSection}>
        <div className="flex gap-2">
          <input
            value={checkpointName}
            onChange={(event) => setCheckpointName(event.target.value)}
            placeholder="Checkpoint name"
            aria-label="Checkpoint name"
            className="flex-1 rounded-control border-(length:--border-width-card) border-card-border bg-input-surface px-4 py-3 text-text-primary outline-none placeholder:text-text-muted"
          />
          <button
            type="button"
            disabled={checkpointName.trim().length === 0}
            onClick={() => {
              onSaveCheckpoint(checkpointName.trim());
              setCheckpointName("");
            }}
            className="rounded-control bg-secondary px-4 py-3 text-secondary-foreground disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </Section>
    </Sheet>
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
