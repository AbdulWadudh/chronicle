import type { TurnChoice } from "@chronicle/shared";
import { ArrowUp, Sparkles, Square, Wand2 } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useThemeTokens } from "~/theme/ThemeEngine";

export type ActionMode = "scratch" | "enhanced";

const COMPOSER_WIDTH = { width: "100%", maxWidth: 680 } as const;

const DRAFT_STYLE = {
  flex: 1,
  minHeight: 56,
  maxHeight: 128,
  paddingHorizontal: 20,
  paddingVertical: 14,
  fontSize: 15,
  lineHeight: 22,
  textAlignVertical: "top",
} as const;

export interface ComposerProps {
  choices: readonly TurnChoice[];
  busy: boolean;
  onSelectChoice: (choiceIndex: 0 | 1 | 2) => void;
  onSubmitAction: (action: string, mode: ActionMode) => void;
  onAbort: () => void;
}

export function Composer({
  choices,
  busy,
  onSelectChoice,
  onSubmitAction,
  onAbort,
}: ComposerProps) {
  const tokens = useThemeTokens();
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<ActionMode>("scratch");
  const [focused, setFocused] = useState(false);
  const ready = draft.trim().length > 0 && !busy;

  function submit(): void {
    if (!ready) return;
    onSubmitAction(draft.trim(), mode);
    setDraft("");
  }

  return (
    <View
      style={COMPOSER_WIDTH}
      className="gap-3 self-center border-t border-white/[0.06] bg-canvas/95 px-4 pb-4 pt-3"
    >
      {choices.length > 0 && !busy ? (
        <View className="gap-2">
          {choices.slice(0, 3).map((choice, index) => (
            <Pressable
              key={choice.label}
              onPress={() => onSelectChoice(index as 0 | 1 | 2)}
              accessibilityRole="button"
              className="flex-row items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 active:opacity-70"
            >
              <Text className="text-[11px] font-semibold text-text-muted">{index + 1}</Text>
              <Text className="flex-1 text-[14px] leading-snug text-text-secondary">
                {choice.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View className="flex-row items-center gap-1.5">
        <ModeChip
          label="Scratch"
          icon={Wand2}
          active={mode === "scratch"}
          onPress={() => setMode("scratch")}
        />
        <ModeChip
          label="Enhance"
          icon={Sparkles}
          active={mode === "enhanced"}
          onPress={() => setMode("enhanced")}
        />
      </View>

      <View className="flex-row items-end gap-2">
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="What do you do?"
          placeholderTextColor={tokens.textMuted}
          multiline
          numberOfLines={1}
          editable={!busy}
          accessibilityLabel="Your action"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={DRAFT_STYLE}
          className={`rounded-2xl border bg-input-surface text-text-primary ${
            focused ? "border-primary" : "border-card-border"
          }`}
        />
        {busy ? (
          <Pressable
            onPress={onAbort}
            accessibilityRole="button"
            accessibilityLabel="Stop generating"
            className="h-[56px] w-[56px] items-center justify-center rounded-full bg-secondary active:opacity-80"
          >
            <Square
              size={16}
              strokeWidth={1.5}
              color={tokens.textSecondary}
              fill={tokens.textSecondary}
            />
          </Pressable>
        ) : (
          <Pressable
            onPress={submit}
            disabled={!ready}
            accessibilityRole="button"
            accessibilityLabel="Send action"
            className={`h-[56px] w-[56px] items-center justify-center rounded-full active:scale-95 ${
              ready ? "bg-primary" : "bg-white/[0.06]"
            }`}
          >
            <ArrowUp
              size={20}
              strokeWidth={2}
              color={ready ? tokens.primaryForeground : tokens.textMuted}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function ModeChip({
  label,
  icon: Icon,
  active,
  onPress,
}: {
  label: string;
  icon: typeof Wand2;
  active: boolean;
  onPress: () => void;
}) {
  const tokens = useThemeTokens();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      className={`h-8 flex-row items-center gap-1.5 rounded-full px-3 ${active ? "bg-primary" : "border border-white/[0.06] bg-white/[0.02]"}`}
    >
      <Icon
        size={13}
        strokeWidth={1.5}
        color={active ? tokens.primaryForeground : tokens.textMuted}
      />
      <Text
        className={`text-[12px] font-medium ${active ? "text-primary-foreground" : "text-text-muted"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
