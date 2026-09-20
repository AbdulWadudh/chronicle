import { STATS } from "@chronicle/config";
import {
  canLower,
  canRaise,
  clampStatRank,
  costOfNextRank,
  remainingPoints,
  type StatBlock,
  type StatDefinition,
} from "@chronicle/utils";
import { GroupLabel } from "~/components/ui/label";

const RANK_PIPS = Array.from({ length: STATS.maxRank }, (_, index) => `rank-${index + 1}`);

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
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border-(length:--border-width-card) border-hairline bg-sunken text-[1rem] text-text-secondary transition-colors hover:border-primary/40 hover:text-text-primary disabled:border-transparent disabled:text-text-muted disabled:opacity-40 motion-reduce:transition-none"
    >
      {label}
    </button>
  );
}

export function PointBuyStepper({ definitions, stats, budget, onChange }: PointBuyStepperProps) {
  const remaining = remainingPoints(stats, budget);

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <GroupLabel>Abilities</GroupLabel>
        <p
          aria-live="polite"
          className={`text-[0.6875rem] font-medium ${remaining < 0 ? "text-danger" : "text-text-accent"}`}
        >
          {remaining} of {budget} points left
        </p>
      </div>

      {definitions.map((definition) => {
        const rank = stats[definition.id] ?? STATS.minRank;
        const nextCost = costOfNextRank(rank);
        return (
          <div
            key={definition.id}
            className="flex flex-col gap-2.5 rounded-card border-(length:--border-width-card) border-card-border bg-card p-3.5"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 flex-1 text-[0.875rem] font-medium text-text-primary">
                {definition.label}
              </p>
              <span className="shrink-0 text-[0.625rem] font-medium uppercase tracking-[0.12em] text-text-muted">
                {nextCost === null ? "maxed" : `next +${nextCost}`}
              </span>
            </div>

            {definition.description.length > 0 ? (
              <p className="text-[0.75rem] leading-relaxed text-text-muted">
                {definition.description}
              </p>
            ) : null}

            <div className="flex items-center gap-3">
              <Step
                label="−"
                statLabel={definition.label}
                disabled={!canLower(stats, definition.id)}
                onPress={() => onChange({ ...stats, [definition.id]: clampStatRank(rank - 1) })}
              />
              <div className="flex flex-1 items-center gap-1">
                {RANK_PIPS.map((pip, position) => (
                  <span
                    key={`${definition.id}-${pip}`}
                    aria-hidden="true"
                    className={`h-1.5 flex-1 rounded-full ${position < rank ? "bg-primary" : "bg-sunken"}`}
                  />
                ))}
              </div>
              <output className="w-5 shrink-0 text-center text-[1rem] font-semibold text-text-primary">
                {rank}
              </output>
              <Step
                label="+"
                statLabel={definition.label}
                disabled={!canRaise(stats, definition.id, budget)}
                onPress={() => onChange({ ...stats, [definition.id]: clampStatRank(rank + 1) })}
              />
            </div>
          </div>
        );
      })}
    </section>
  );
}
