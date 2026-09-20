import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
  ghost: "border-(length:--border-width-card) border-hairline bg-raised-hover",
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
      className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-control px-5 transition active:scale-[0.98] active:opacity-90 disabled:cursor-not-allowed ${
        inert ? "bg-sunken" : SURFACE[tone]
      }`}
    >
      {busy ? <Spinner size={14} label={`${label} in progress`} /> : null}
      <span
        className={`text-[0.875rem] font-semibold tracking-[-0.01em] ${inert ? "text-text-muted" : LABEL[tone]}`}
      >
        {label}
      </span>
      {trailing && !busy ? (
        <span className="ml-0.5 flex h-6 w-6 items-center justify-center rounded-control bg-scrim">
          <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} strokeWidth={1.5} color={foreground} />
        </span>
      ) : null}
    </button>
  );
}
