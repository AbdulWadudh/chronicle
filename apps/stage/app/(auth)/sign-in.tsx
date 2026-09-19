import { useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, TextInput } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "~/lib/auth";

export default function SignInScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === "sign-up";

  async function submit(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      if (isSignUp) await signUp(name.trim(), email.trim(), password);
      else await signIn(email.trim(), password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <Animated.View
        entering={FadeInDown.duration(320)}
        className="flex-1 justify-center gap-5 px-6"
      >
        <Image
          source={require("../../assets/logo.png")}
          className="h-20 w-20 self-center"
          resizeMode="contain"
        />
        <Text className="text-center text-3xl font-semibold text-text-primary">Chronicle</Text>
        <Text className="text-center text-text-secondary">
          {isSignUp ? "Create an account to begin." : "Sign in to continue your story."}
        </Text>

        {isSignUp ? (
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name"
            autoCapitalize="words"
            className="rounded-xl border border-card-border bg-input-surface px-4 py-3 text-text-primary"
          />
        ) : null}

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          className="rounded-xl border border-card-border bg-input-surface px-4 py-3 text-text-primary"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          className="rounded-xl border border-card-border bg-input-surface px-4 py-3 text-text-primary"
        />

        {error !== null ? <Text className="text-center text-danger">{error}</Text> : null}

        <Pressable
          onPress={() => void submit()}
          disabled={busy}
          accessibilityRole="button"
          className={`items-center rounded-xl bg-primary py-3.5 active:opacity-85 ${busy ? "opacity-50" : ""}`}
        >
          {busy ? (
            <ActivityIndicator />
          ) : (
            <Text className="font-semibold text-primary-foreground">
              {isSignUp ? "Create account" : "Sign in"}
            </Text>
          )}
        </Pressable>

        <Pressable onPress={() => setMode(isSignUp ? "sign-in" : "sign-up")} hitSlop={8}>
          <Text className="text-center text-text-accent">
            {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
          </Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}
