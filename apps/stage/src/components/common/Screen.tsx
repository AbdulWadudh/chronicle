import type { ReactNode } from "react";
import { KeyboardAvoidingView, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlowBackdrop } from "~/components/common/GlowBackdrop";

export const CONTENT_MAX_WIDTH = 380;
export const WIDE_MAX_WIDTH = 1040;

export interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  center?: boolean;
  wide?: boolean;
}

const FILL = { flex: 1 } as const;
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

  return (
    <SafeAreaView style={FILL} className="bg-canvas">
      <GlowBackdrop />
      <KeyboardAvoidingView style={FILL} behavior="padding">
        {scroll ? (
          <ScrollView
            style={FILL}
            contentContainerStyle={SCROLL_CONTENT}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
          >
            {inner}
          </ScrollView>
        ) : (
          <View className="flex-1 px-5 py-6">{inner}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
