import type { LucideIcon } from "lucide-react-native";
import { Text, View } from "react-native";
import { useThemeTokens } from "~/theme/ThemeEngine";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body?: string;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, body, compact = false }: EmptyStateProps) {
  const tokens = useThemeTokens();

  return (
    <View className={`items-center justify-center gap-3 ${compact ? "px-6 py-10" : "flex-1 px-8"}`}>
      <View className="h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
        <Icon size={22} strokeWidth={1.25} color={tokens.textMuted} />
      </View>
      <Text className="text-center text-[15px] font-medium text-text-secondary">{title}</Text>
      {body !== undefined ? (
        <Text className="max-w-[300px] text-center text-[13px] leading-relaxed text-text-muted">
          {body}
        </Text>
      ) : null}
    </View>
  );
}
