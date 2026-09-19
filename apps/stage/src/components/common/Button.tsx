import { ArrowUpRight } from "lucide-react-native";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useThemeTokens } from "~/theme/ThemeEngine";

export type ButtonTone = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  busy?: boolean;
  disabled?: boolean;
  trailing?: boolean;
}

const SURFACE: Record<ButtonTone, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  ghost: "border border-white/10 bg-white/[0.03]",
  danger: "bg-danger",
};

const LABEL: Record<ButtonTone, string> = {
  primary: "text-primary-foreground",
  secondary: "text-secondary-foreground",
  ghost: "text-text-secondary",
  danger: "text-text-primary",
};

export function Button({
  label,
  onPress,
  tone = "primary",
  busy = false,
  disabled = false,
  trailing = false,
}: ButtonProps) {
  const tokens = useThemeTokens();
  const inert = disabled || busy;
  const foreground = tone === "primary" ? tokens.primaryForeground : tokens.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      disabled={inert}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inert, busy }}
      className={`min-h-[52px] flex-row items-center justify-center gap-2 rounded-full px-6 active:scale-[0.98] active:opacity-90 ${SURFACE[tone]} ${inert ? "opacity-40" : ""}`}
    >
      {busy ? <ActivityIndicator size="small" color={foreground} /> : null}
      <Text className={`text-[15px] font-semibold tracking-[-0.01em] ${LABEL[tone]}`}>{label}</Text>
      {trailing && !busy ? (
        <View className="ml-1 h-8 w-8 items-center justify-center rounded-full bg-black/10">
          <ArrowUpRight size={16} strokeWidth={1.5} color={foreground} />
        </View>
      ) : null}
    </Pressable>
  );
}
