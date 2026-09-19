import "../global.css";

import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { configureAudioSession } from "~/hooks/useAudioQueue";
import { AuthProvider, useAuth } from "~/lib/auth";
import { ThemeEngine, useThemeTokens } from "~/theme/ThemeEngine";

function AuthGate() {
  const { user, ready } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const tokens = useThemeTokens();

  useEffect(() => {
    if (!ready) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (user === null && !inAuthGroup) router.replace("/(auth)/sign-in");
    if (user !== null && inAuthGroup) router.replace("/");
  }, [ready, router, segments, user]);

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color={tokens.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: tokens.canvas } }}>
      <Stack.Screen name="(auth)/sign-in" />
      <Stack.Screen name="index" />
      <Stack.Screen name="character-select" />
      <Stack.Screen name="play/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void configureAudioSession();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeEngine>
          <AuthProvider>
            <StatusBar style="auto" />
            <AuthGate />
          </AuthProvider>
        </ThemeEngine>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
