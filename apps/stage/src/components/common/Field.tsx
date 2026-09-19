import { useState } from "react";
import { Pressable, Text, TextInput, type TextInputProps, View } from "react-native";
import { useThemeTokens } from "~/theme/ThemeEngine";

export interface FieldProps extends Omit<TextInputProps, "className"> {
  label: string;
  hint?: string;
  error?: string | null;
  secure?: boolean;
}

export function Field({ label, hint, error, secure = false, ...input }: FieldProps) {
  const tokens = useThemeTokens();
  const [revealed, setRevealed] = useState(false);
  const invalid = typeof error === "string" && error.length > 0;

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-text-secondary">{label}</Text>

      <View className="relative justify-center">
        <TextInput
          {...input}
          accessibilityLabel={label}
          secureTextEntry={secure && !revealed}
          placeholderTextColor={tokens.textMuted}
          className={`min-h-12 rounded-xl border bg-input-surface px-4 py-3 text-base text-text-primary ${
            invalid ? "border-danger" : "border-card-border"
          } ${secure ? "pr-16" : ""}`}
        />
        {secure ? (
          <Pressable
            onPress={() => setRevealed((value) => !value)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
            className="absolute right-3 h-11 justify-center px-2"
          >
            <Text className="text-xs font-medium text-text-accent">
              {revealed ? "Hide" : "Show"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {invalid ? (
        <Text className="text-xs text-danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint !== undefined ? (
        <Text className="text-xs text-text-muted">{hint}</Text>
      ) : null}
    </View>
  );
}
