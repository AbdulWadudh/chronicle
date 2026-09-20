import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useIsDark, useThemeStore } from "~/theme/store";

const CLASS_NAMES = {
  toast:
    "!rounded-control !border-(length:--border-width-card) !border-card-border !bg-card !text-text-primary !shadow-(--shadow-overlay)",
  title: "!text-[0.8125rem] !font-medium",
  description: "!text-[0.75rem] !text-text-muted",
  actionButton: "!rounded-control !bg-primary !text-primary-foreground",
  cancelButton: "!rounded-control !bg-secondary !text-secondary-foreground",
  closeButton:
    "!rounded-control !border-(length:--border-width-card) !border-card-border !bg-card !text-text-muted hover:!text-text-primary",
  success:
    "!border-success/35 !bg-[color-mix(in_srgb,var(--color-success)_12%,var(--color-card))] [&_[data-icon]]:!text-success [&_[data-title]]:!text-success",
  error:
    "!border-danger/35 !bg-[color-mix(in_srgb,var(--color-danger)_12%,var(--color-card))] [&_[data-icon]]:!text-danger [&_[data-title]]:!text-danger",
  warning:
    "!border-warning/35 !bg-[color-mix(in_srgb,var(--color-warning)_12%,var(--color-card))] [&_[data-icon]]:!text-warning [&_[data-title]]:!text-warning",
  info: "!border-accent/35 !bg-[color-mix(in_srgb,var(--color-accent)_12%,var(--color-card))] [&_[data-icon]]:!text-accent [&_[data-title]]:!text-accent",
};

export function Toaster(props: ToasterProps) {
  const isDark = useIsDark();
  const position = useThemeStore((state) => state.toastPosition);

  return (
    <Sonner
      theme={isDark ? "dark" : "light"}
      position={position}
      closeButton
      style={
        {
          "--toast-close-button-start": "unset",
          "--toast-close-button-end": "0",
          "--toast-close-button-transform": "translate(35%, -35%)",
        } as CSSProperties
      }
      offset={20}
      mobileOffset={12}
      toastOptions={{ classNames: CLASS_NAMES }}
      {...props}
    />
  );
}
