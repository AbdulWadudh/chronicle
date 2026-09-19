import { BlurView } from "expo-blur";
import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeTokens } from "~/theme/ThemeEngine";

export interface AppModalAction {
  label: string;
  onPress: () => void;
  tone?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}

export interface AppModalProps {
  visible: boolean;
  title: string;
  icon?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  actions?: AppModalAction[];
}

const TONE_CLASS: Record<NonNullable<AppModalAction["tone"]>, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  danger: "bg-danger",
};

const TONE_TEXT: Record<NonNullable<AppModalAction["tone"]>, string> = {
  primary: "text-primary-foreground",
  secondary: "text-secondary-foreground",
  danger: "text-text-primary",
};

const BODY_STYLE = { gap: 16 } as const;

export function AppModal({ visible, title, icon, onClose, children, actions }: AppModalProps) {
  const insets = useSafeAreaInsets();
  const tokens = useThemeTokens();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        entering={FadeIn.duration(160)}
        exiting={FadeOut.duration(140)}
        className="flex-1"
      >
        <Pressable
          className="flex-1 bg-black/60"
          onPress={onClose}
          accessibilityLabel="Close modal"
        />
        <Animated.View
          entering={SlideInDown.springify().damping(18)}
          exiting={SlideOutDown.duration(180)}
          className="absolute inset-x-0 bottom-0 max-h-[88%] overflow-hidden rounded-t-3xl border-t border-card-border bg-card"
          style={{ paddingBottom: insets.bottom }}
        >
          <BlurView
            intensity={tokens.blurIntensity}
            tint={tokens.mode}
            className="absolute inset-0"
          />

          <View className="flex-row items-center gap-3 border-b border-card-border px-5 py-4">
            {icon}
            <Text className="flex-1 text-lg font-semibold text-text-primary" numberOfLines={1}>
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
              className="h-9 w-9 items-center justify-center rounded-full bg-secondary active:opacity-70"
            >
              <Text className="text-base text-text-secondary">✕</Text>
            </Pressable>
          </View>

          <ScrollView
            className="px-5 py-4"
            contentContainerStyle={BODY_STYLE}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>

          {actions !== undefined && actions.length > 0 ? (
            <View className="flex-row justify-end gap-3 border-t border-card-border px-5 py-4">
              {actions.map((action) => (
                <Pressable
                  key={action.label}
                  onPress={action.onPress}
                  disabled={action.disabled}
                  accessibilityRole="button"
                  className={`rounded-xl px-4 py-2.5 active:opacity-80 ${TONE_CLASS[action.tone ?? "secondary"]} ${action.disabled === true ? "opacity-40" : ""}`}
                >
                  <Text className={`font-medium ${TONE_TEXT[action.tone ?? "secondary"]}`}>
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
