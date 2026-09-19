import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";
import { Bezel } from "~/components/common/Bezel";
import { Button } from "~/components/common/Button";
import { Field } from "~/components/common/Field";
import { GlowBackdrop } from "~/components/common/GlowBackdrop";
import { Screen } from "~/components/common/Screen";
import { useAuth } from "~/lib/auth";

type Mode = "sign-in" | "sign-up";

const MIN_PASSWORD = 8;

export default function SignInScreen() {
  const { signIn, signUp } = useAuth();
  const reduceMotion = useReducedMotion();

  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === "sign-up";
  const emailValid = /.+@.+\..+/u.test(email.trim());
  const passwordValid = password.length >= MIN_PASSWORD;
  const nameValid = !isSignUp || name.trim().length > 0;
  const canSubmit = emailValid && passwordValid && nameValid && !busy;

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

  function switchMode(): void {
    setMode(isSignUp ? "sign-in" : "sign-up");
    setError(null);
  }

  return (
    <Screen scroll center>
      <GlowBackdrop />
      <Animated.View
        entering={reduceMotion ? undefined : FadeInDown.duration(600)}
        className="gap-8"
      >
        <View className="items-center gap-4">
          <Image
            source={require("../../assets/logo.png")}
            style={{ width: 76, height: 76 }}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
            alt=""
          />
          <View className="items-center gap-2.5">
            <View className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
              <Text className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-accent">
                Interactive Worlds
              </Text>
            </View>
            <Text className="text-[34px] font-semibold leading-tight tracking-[-0.03em] text-text-primary">
              Chronicle
            </Text>
            <Text className="text-center text-sm leading-relaxed text-text-muted">
              {isSignUp
                ? "Create an account to begin your first world."
                : "Sign in to continue your story."}
            </Text>
          </View>
        </View>

        <Bezel tone="raised">
          <View className="gap-5 p-6">
            {isSignUp ? (
              <Field
                label="Name"
                value={name}
                onChangeText={setName}
                placeholder="Vell"
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
              />
            ) : null}

            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
            />

            <Field
              label="Password"
              secure
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              hint={isSignUp ? `Use ${MIN_PASSWORD} characters or more.` : undefined}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              textContentType={isSignUp ? "newPassword" : "password"}
              returnKeyType="go"
              onSubmitEditing={() => {
                if (canSubmit) void submit();
              }}
            />

            {error !== null ? (
              <View
                accessibilityLiveRegion="assertive"
                className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2"
              >
                <Text className="text-sm text-danger">{error}</Text>
              </View>
            ) : null}

            <Button
              label={isSignUp ? "Create account" : "Sign in"}
              onPress={() => void submit()}
              busy={busy}
              disabled={!canSubmit}
              trailing
            />
          </View>
        </Bezel>

        <Pressable onPress={switchMode} hitSlop={12} accessibilityRole="button" className="py-1">
          <Text className="text-center text-sm text-text-muted">
            {isSignUp ? "Already have an account? " : "New here? "}
            <Text className="font-medium text-text-accent">
              {isSignUp ? "Sign in" : "Create one"}
            </Text>
          </Text>
        </Pressable>
      </Animated.View>
    </Screen>
  );
}
