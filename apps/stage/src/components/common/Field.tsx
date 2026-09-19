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

const INPUT_STYLE = {
  minHeight: 44,
  paddingHorizontal: 14,
  paddingVertical: 10,
  fontSize: 14,
  lineHeight: 20,
} as const;

const SECURE_INPUT_STYLE = { ...INPUT_STYLE, paddingRight: 44 } as const;

export function Field({ label, hint, error, secure = false, ...input }: FieldProps) {
  const tokens = useThemeTokens();
  const [revealed, setRevealed] = useState(false);
  const [focused, setFocused] = useState(false);
  const invalid = typeof error === "string" && error.length > 0;
  const border = invalid ? "border-danger" : focused ? "border-primary" : "border-card-border";

  return (
    <View className="gap-1.5">
      <Text className="px-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-text-muted">
        {label}
      </Text>

      <View className="relative justify-center">
        <TextInput
          {...input}
          accessibilityLabel={label}
          secureTextEntry={secure && !revealed}
          placeholderTextColor={tokens.textMuted}
          onFocus={(event) => {
            setFocused(true);
            input.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            input.onBlur?.(event);
          }}
          style={secure ? SECURE_INPUT_STYLE : INPUT_STYLE}
          className={`rounded-2xl border bg-input-surface text-text-primary ${border}`}
        />
        {secure ? (
          <Pressable
            onPress={() => setRevealed((value) => !value)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
            className="absolute right-2 h-9 justify-center px-2"
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
        <Text className="px-0.5 text-[11px] text-danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint !== undefined ? (
        <Text className="px-0.5 text-[11px] text-text-muted">{hint}</Text>
      ) : null}
    </View>
  );
}
