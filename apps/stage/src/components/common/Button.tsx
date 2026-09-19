import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";

export type ButtonTone = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  busy?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
}

const SURFACE: Record<ButtonTone, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  ghost: "bg-transparent border border-card-border",
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
  icon,
}: ButtonProps) {
  const inert = disabled || busy;

  return (
    <Pressable
      onPress={onPress}
      disabled={inert}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inert, busy }}
      className={`min-h-12 flex-row items-center justify-center gap-2 rounded-xl px-5 active:opacity-80 ${SURFACE[tone]} ${inert ? "opacity-40" : ""}`}
    >
      {busy ? <ActivityIndicator size="small" /> : icon}
      <Text className={`text-base font-semibold ${LABEL[tone]}`}>{label}</Text>
    </Pressable>
  );
}
