import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";
import { Bezel } from "~/components/common/Bezel";
import { Button } from "~/components/common/Button";
import { Field } from "~/components/common/Field";
import { Screen } from "~/components/common/Screen";
import { useResponsiveLayout } from "~/hooks/useResponsiveLayout";
import { useAuth } from "~/lib/auth";

type Mode = "sign-in" | "sign-up";

const MIN_PASSWORD = 8;
const CARD_COLUMN = { width: 380 } as const;

export default function SignInScreen() {
  const { signIn, signUp } = useAuth();
  const reduceMotion = useReducedMotion();
  const { isSplit } = useResponsiveLayout();

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

  const brand = (
    <View className={isSplit ? "items-start gap-4" : "items-center gap-3"}>
      <Image
        source={require("../../assets/logo.png")}
        style={{ width: 52, height: 52 }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        alt=""
      />
      <View className={isSplit ? "gap-2" : "items-center gap-2"}>
        <View className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5">
          <Text className="text-[9px] font-medium uppercase tracking-[0.18em] text-text-accent">
            Interactive Worlds
          </Text>
        </View>
        <Text className="text-[26px] font-semibold leading-tight tracking-[-0.03em] text-text-primary">
          Chronicle
        </Text>
        <Text
          className={`text-[13px] leading-relaxed text-text-muted ${isSplit ? "" : "text-center"}`}
        >
          {isSignUp
            ? "Create an account to begin your first world."
            : "Sign in to continue your story."}
        </Text>
      </View>
    </View>
  );

  const card = (
    <>
      <Bezel tone="raised">
        <View className="gap-3.5 px-5 py-6">
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
              className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-1.5"
            >
              <Text className="text-[13px] text-danger">{error}</Text>
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
        <Text className="text-center text-[13px] text-text-muted">
          {isSignUp ? "Already have an account? " : "New here? "}
          <Text className="font-medium text-text-accent">
            {isSignUp ? "Sign in" : "Create one"}
          </Text>
        </Text>
      </Pressable>
    </>
  );

  return (
    <Screen scroll center wide={isSplit}>
      <Animated.View
        entering={reduceMotion ? undefined : FadeInDown.duration(600)}
        className={isSplit ? "flex-row items-center gap-14" : "gap-6"}
      >
        {isSplit ? <View className="flex-1">{brand}</View> : brand}
        <View style={isSplit ? CARD_COLUMN : undefined} className="gap-4">
          {card}
        </View>
      </Animated.View>
    </Screen>
  );
}
