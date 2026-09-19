import { motion } from "motion/react";
import { type FormEvent, useState } from "react";
import { Bezel } from "~/components/common/Bezel";
import { Button } from "~/components/common/Button";
import { Field } from "~/components/common/Field";
import { Screen } from "~/components/common/Screen";
import { useReducedMotion } from "~/hooks/useReducedMotion";
import { useResponsiveLayout } from "~/hooks/useResponsiveLayout";
import { useAuth } from "~/lib/auth";

type Mode = "sign-in" | "sign-up";

const MIN_PASSWORD = 8;

export function SignIn() {
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

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!canSubmit) return;
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
    <div className={`flex flex-col gap-3 ${isSplit ? "items-start gap-4" : "items-center"}`}>
      <img src="/logo.png" alt="" width={52} height={52} className="object-contain" />
      <div className={`flex flex-col gap-2 ${isSplit ? "" : "items-center"}`}>
        <span className="self-start rounded-full border border-hairline bg-raised-hover px-2.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-text-accent">
          Interactive Worlds
        </span>
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.03em] text-text-primary">
          Chronicle
        </h1>
        <p
          className={`text-[13px] leading-relaxed text-text-muted ${isSplit ? "" : "text-center"}`}
        >
          {isSignUp
            ? "Create an account to begin your first world."
            : "Sign in to continue your story."}
        </p>
      </div>
    </div>
  );

  return (
    <Screen scroll center width={isSplit ? "wide" : "narrow"}>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={isSplit ? "flex flex-row items-center gap-14" : "flex flex-col gap-6"}
      >
        {isSplit ? <div className="flex-1">{brand}</div> : brand}

        <div className="flex flex-col gap-4" style={isSplit ? { width: 380 } : undefined}>
          <Bezel tone="raised">
            <form className="flex flex-col gap-3.5 px-5 py-6" onSubmit={(e) => void submit(e)}>
              {isSignUp ? (
                <Field
                  label="Name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Vell"
                  autoCapitalize="words"
                  autoComplete="name"
                />
              ) : null}

              <Field
                label="Email"
                type="email"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoCapitalize="none"
                autoComplete="email"
              />

              <Field
                label="Password"
                secure
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                hint={isSignUp ? `Use ${MIN_PASSWORD} characters or more.` : undefined}
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />

              {error !== null ? (
                <p
                  role="alert"
                  className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-1.5 text-[13px] text-danger"
                >
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                label={isSignUp ? "Create account" : "Sign in"}
                busy={busy}
                disabled={!canSubmit}
                trailing
              />
            </form>
          </Bezel>

          <button
            type="button"
            onClick={switchMode}
            className="py-1 text-center text-[13px] text-text-muted"
          >
            {isSignUp ? "Already have an account? " : "New here? "}
            <span className="font-medium text-text-accent">
              {isSignUp ? "Sign in" : "Create one"}
            </span>
          </button>
        </div>
      </motion.div>
    </Screen>
  );
}
