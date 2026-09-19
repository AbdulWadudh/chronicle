import { Eye, EyeOff } from "lucide-react-native";
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
      <Text className="text-[11px] font-medium uppercase tracking-[0.14em] text-text-muted">
        {label}
      </Text>

      <View className="relative justify-center">
        <TextInput
          {...input}
          accessibilityLabel={label}
          secureTextEntry={secure && !revealed}
          placeholderTextColor={tokens.textMuted}
          className={`min-h-[52px] rounded-2xl border bg-input-surface px-4 py-3.5 text-base text-text-primary ${
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
            {revealed ? (
              <EyeOff size={18} strokeWidth={1.25} color={tokens.textMuted} />
            ) : (
              <Eye size={18} strokeWidth={1.25} color={tokens.textMuted} />
            )}
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
