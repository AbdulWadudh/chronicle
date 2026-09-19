import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const CONTENT_MAX_WIDTH = 440;
export const WIDE_MAX_WIDTH = 1040;

export interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  center?: boolean;
  wide?: boolean;
}

const SCROLL_CONTENT = { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 24 } as const;

export function Screen({ children, scroll = false, center = false, wide = false }: ScreenProps) {
  const maxWidth = wide ? WIDE_MAX_WIDTH : CONTENT_MAX_WIDTH;

  const inner = (
    <View
      style={{ width: "100%", maxWidth }}
      className={center ? "flex-1 justify-center self-center" : "flex-1 self-center"}
    >
      {children}
    </View>
  );

  if (!scroll) {
    return (
      <SafeAreaView className="flex-1 bg-canvas">
        <View className="flex-1 px-5 py-6">{inner}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <ScrollView
        contentContainerStyle={SCROLL_CONTENT}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {inner}
      </ScrollView>
    </SafeAreaView>
  );
}
