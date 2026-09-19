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
import { Pressable, Text, View } from "react-native";

export interface PointBuyStepperProps {
  definitions: readonly StatDefinition[];
  stats: StatBlock;
  budget: number;
  onChange: (stats: StatBlock) => void;
}

function Step({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label === "−" ? "Decrease" : "Increase"}
      className={`h-9 w-9 items-center justify-center rounded-full bg-secondary active:opacity-70 ${disabled ? "opacity-30" : ""}`}
    >
      <Text className="text-lg text-secondary-foreground">{label}</Text>
    </Pressable>
  );
}

export function PointBuyStepper({ definitions, stats, budget, onChange }: PointBuyStepperProps) {
  const remaining = remainingPoints(stats, budget);

  function setRank(statId: string, rank: number): void {
    onChange({ ...stats, [statId]: clampStatRank(rank) });
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-baseline justify-between">
        <Text className="text-base font-medium text-text-primary">Abilities</Text>
        <Text className={remaining < 0 ? "text-danger" : "text-text-muted"}>
          {remaining} / {budget} points left
        </Text>
      </View>

      {definitions.map((definition) => {
        const rank = stats[definition.id] ?? STATS.minRank;
        const nextCost = costOfNextRank(rank);
        return (
          <View
            key={definition.id}
            className="flex-row items-center gap-3 rounded-xl border border-card-border bg-card p-3"
          >
            <View className="flex-1">
              <Text className="font-medium text-text-primary">{definition.label}</Text>
              {definition.description.length > 0 ? (
                <Text className="text-xs text-text-muted" numberOfLines={1}>
                  {definition.description}
                </Text>
              ) : null}
            </View>
            <Step
              label="−"
              disabled={!canLower(stats, definition.id)}
              onPress={() => setRank(definition.id, rank - 1)}
            />
            <Text className="w-6 text-center text-lg font-semibold text-text-primary">{rank}</Text>
            <Step
              label="+"
              disabled={!canRaise(stats, definition.id, budget)}
              onPress={() => setRank(definition.id, rank + 1)}
            />
            <Text className="w-8 text-right text-xs text-text-muted">
              {nextCost === null ? "max" : `+${nextCost}`}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
