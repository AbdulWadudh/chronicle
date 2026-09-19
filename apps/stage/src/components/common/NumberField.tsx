import { Pressable, Text, View } from "react-native";

export interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

export function NumberField({ label, value, min, max, step = 1, onChange }: NumberFieldProps) {
  function nudge(direction: -1 | 1): void {
    const next = Math.min(Math.max(value + direction * step, min), max);
    if (next !== value) onChange(next);
  }

  return (
    <View className="flex-row items-center gap-3 rounded-xl border border-card-border bg-card px-3 py-2">
      <Text className="flex-1 text-text-primary" numberOfLines={1}>
        {label}
      </Text>
      <Pressable
        onPress={() => nudge(-1)}
        disabled={value <= min}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Decrease ${label}`}
        className={`h-8 w-8 items-center justify-center rounded-full bg-secondary ${value <= min ? "opacity-30" : "active:opacity-70"}`}
      >
        <Text className="text-secondary-foreground">−</Text>
      </Pressable>
      <Text className="w-12 text-center text-text-primary">{value}</Text>
      <Pressable
        onPress={() => nudge(1)}
        disabled={value >= max}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Increase ${label}`}
        className={`h-8 w-8 items-center justify-center rounded-full bg-secondary ${value >= max ? "opacity-30" : "active:opacity-70"}`}
      >
        <Text className="text-secondary-foreground">+</Text>
      </Pressable>
    </View>
  );
}
