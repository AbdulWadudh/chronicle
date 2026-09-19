import {
  canLower,
  canRaise,
  clampStatRank,
  costOfNextRank,
  remainingPoints,
  STATS,
  type StatBlock,
  type StatDefinition,
} from "@chronicle/shared";

export interface PointBuyStepperProps {
  definitions: readonly StatDefinition[];
  stats: StatBlock;
  budget: number;
  onChange: (stats: StatBlock) => void;
}

function Step({
  label,
  statLabel,
  disabled,
  onPress,
}: {
  label: string;
  statLabel: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-label={`${label === "−" ? "Decrease" : "Increase"} ${statLabel}`}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-lg text-secondary-foreground disabled:opacity-30"
    >
      {label}
    </button>
  );
}

export function PointBuyStepper({ definitions, stats, budget, onChange }: PointBuyStepperProps) {
  const remaining = remainingPoints(stats, budget);

  function setRank(statId: string, rank: number): void {
    onChange({ ...stats, [statId]: clampStatRank(rank) });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-medium text-text-primary">Abilities</h2>
        <p aria-live="polite" className={remaining < 0 ? "text-danger" : "text-text-muted"}>
          {remaining} / {budget} points left
        </p>
      </div>

      {definitions.map((definition) => {
        const rank = stats[definition.id] ?? STATS.minRank;
        const nextCost = costOfNextRank(rank);
        return (
          <div
            key={definition.id}
            className="flex items-center gap-3 rounded-[var(--radius-control)] border-[length:var(--border-width-card)] border-card-border bg-card p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-text-primary">{definition.label}</p>
              {definition.description.length > 0 ? (
                <p className="truncate text-xs text-text-muted">{definition.description}</p>
              ) : null}
            </div>
            <Step
              label="−"
              statLabel={definition.label}
              disabled={!canLower(stats, definition.id)}
              onPress={() => setRank(definition.id, rank - 1)}
            />
            <output className="w-6 text-center text-lg font-semibold text-text-primary">
              {rank}
            </output>
            <Step
              label="+"
              statLabel={definition.label}
              disabled={!canRaise(stats, definition.id, budget)}
              onPress={() => setRank(definition.id, rank + 1)}
            />
            <span className="w-8 text-right text-xs text-text-muted">
              {nextCost === null ? "max" : `+${nextCost}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
