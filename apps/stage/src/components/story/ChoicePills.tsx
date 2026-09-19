import type { TurnChoice } from "@chronicle/shared";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";

export type ActionMode = "scratch" | "enhanced";

export interface ChoicePillsProps {
  choices: readonly TurnChoice[];
  disabled: boolean;
  onSelectChoice: (choiceIndex: 0 | 1 | 2) => void;
  onSubmitAction: (action: string, mode: ActionMode) => void;
}

const MODES: { key: ActionMode; label: string; hint: string }[] = [
  { key: "scratch", label: "Scratch", hint: "Use my words exactly" },
  { key: "enhanced", label: "Enhance", hint: "Elevate my phrasing" },
];

export function ChoicePills({
  choices,
  disabled,
  onSelectChoice,
  onSubmitAction,
}: ChoicePillsProps) {
  const reduceMotion = useReducedMotion();
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<ActionMode>("scratch");

  function submit(): void {
    const action = draft.trim();
    if (action.length === 0) return;
    setDraft("");
    onSubmitAction(action, mode);
  }

  return (
    <View className="gap-3">
      {choices.slice(0, 3).map((choice, index) => (
        <Animated.View
          key={choice.label}
          entering={reduceMotion ? undefined : FadeInDown.delay(index * 60).duration(220)}
        >
          <Pressable
            onPress={() => onSelectChoice(index as 0 | 1 | 2)}
            disabled={disabled}
            accessibilityRole="button"
            className={`rounded-2xl border border-card-border bg-card px-4 py-3 active:opacity-80 ${disabled ? "opacity-40" : ""}`}
          >
            <Text className="text-text-primary">{choice.label}</Text>
            {choice.hint.length > 0 ? (
              <Text className="pt-0.5 text-xs text-text-muted">{choice.hint}</Text>
            ) : null}
          </Pressable>
        </Animated.View>
      ))}

      <View className="flex-row gap-2">
        {MODES.map((option) => (
          <Pressable
            key={option.key}
            onPress={() => setMode(option.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: mode === option.key }}
            accessibilityHint={option.hint}
            className={`rounded-full px-3 py-1.5 ${mode === option.key ? "bg-primary" : "bg-secondary"}`}
          >
            <Text
              className={`text-xs ${mode === option.key ? "text-primary-foreground" : "text-secondary-foreground"}`}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="flex-row items-end gap-2">
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Or write your own action…"
          multiline
          editable={!disabled}
          onSubmitEditing={submit}
          className="max-h-28 flex-1 rounded-xl border border-card-border bg-input-surface px-4 py-3 text-text-primary"
        />
        <Pressable
          onPress={submit}
          disabled={disabled || draft.trim().length === 0}
          accessibilityRole="button"
          accessibilityLabel="Submit action"
          className={`rounded-xl bg-primary px-4 py-3 active:opacity-85 ${disabled || draft.trim().length === 0 ? "opacity-40" : ""}`}
        >
          <Text className="font-medium text-primary-foreground">Send</Text>
        </Pressable>
      </View>
    </View>
  );
}
