import { Alert02Icon, Globe02Icon, LockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useId } from "react";
import { GroupLabel, Label } from "~/components/ui/label";
import { Segmented, type SegmentedOption } from "~/components/ui/segmented";
import { Slider } from "~/components/ui/slider";

const BUDGET = { min: 4, max: 60, step: 1 };

type Visibility = "private" | "public";

const VISIBILITY: readonly SegmentedOption<Visibility>[] = [
  { value: "private", label: "Private", icon: LockIcon },
  { value: "public", label: "Public", icon: Globe02Icon },
];

export interface WorldRulesProps {
  pointBudget: number;
  visibility: Visibility;
  maximumSpend: number;
  everythingAffordable: boolean;
  onBudgetChange: (budget: number) => void;
  onVisibilityChange: (visibility: Visibility) => void;
}

export function WorldRules({
  pointBudget,
  visibility,
  maximumSpend,
  everythingAffordable,
  onBudgetChange,
  onVisibilityChange,
}: WorldRulesProps) {
  const budgetId = useId();

  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <Label htmlFor={budgetId}>Point budget</Label>
          <p className="text-[0.6875rem] leading-relaxed text-text-muted">
            Spent on abilities at character creation. Maxing every ability costs {maximumSpend}.
          </p>
        </div>
        <output className="text-lg font-semibold text-text-primary">{pointBudget}</output>
        <div className="col-span-2">
          <Slider
            id={budgetId}
            value={pointBudget}
            min={BUDGET.min}
            max={BUDGET.max}
            step={BUDGET.step}
            aria-label="Point budget"
            onValueChange={(next) =>
              onBudgetChange(typeof next === "number" ? next : (next[0] ?? BUDGET.min))
            }
          />
        </div>
      </div>

      {everythingAffordable ? (
        <p className="flex items-start gap-2 rounded-control bg-warning/10 px-3 py-2.5 text-[0.75rem] leading-relaxed text-warning">
          <HugeiconsIcon icon={Alert02Icon} size={14} strokeWidth={1.75} className="mt-px" />
          This budget buys every ability at rank 5, so no choice is being made. Lower it below{" "}
          {maximumSpend} or add another ability.
        </p>
      ) : null}

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <GroupLabel>Visibility</GroupLabel>
          <p className="text-[0.6875rem] leading-relaxed text-text-muted">
            A public world can be played by anyone on this installation.
          </p>
        </div>
        <Segmented
          value={visibility}
          options={VISIBILITY}
          onValueChange={onVisibilityChange}
          ariaLabel="World visibility"
          className="w-auto shrink-0"
        />
      </div>
    </>
  );
}
