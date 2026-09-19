import { ArrowUpRight } from "lucide-react";
import { useThemeTokens } from "~/theme/ThemeEngine";
import { Spinner } from "./Spinner";

export type ButtonTone = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  tone?: ButtonTone;
  busy?: boolean;
  disabled?: boolean;
  trailing?: boolean;
  type?: "button" | "submit";
}

const SURFACE: Record<ButtonTone, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  ghost: "border border-white/10 bg-white/[0.03]",
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
  trailing = false,
  type = "button",
}: ButtonProps) {
  const tokens = useThemeTokens();
  const inert = disabled || busy;
  const foreground = inert
    ? tokens.textMuted
    : tone === "primary"
      ? tokens.primaryForeground
      : tokens.textSecondary;

  return (
    <button
      type={type}
      onClick={onPress}
      disabled={inert}
      aria-busy={busy}
      className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full px-5 transition active:scale-[0.98] active:opacity-90 disabled:cursor-not-allowed ${
        inert ? "bg-white/[0.06]" : SURFACE[tone]
      }`}
    >
      {busy ? <Spinner size={14} label={`${label} in progress`} /> : null}
      <span
        className={`text-[14px] font-semibold tracking-[-0.01em] ${inert ? "text-text-muted" : LABEL[tone]}`}
      >
        {label}
      </span>
      {trailing && !busy ? (
        <span className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/10">
          <ArrowUpRight size={14} strokeWidth={1.5} color={foreground} />
        </span>
      ) : null}
    </button>
  );
}
