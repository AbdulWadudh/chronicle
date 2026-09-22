import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { type ReactNode, useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";

export interface AppModalAction {
  label: string;
  onPress: () => void;
  tone?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  busy?: boolean;
}

export interface AppModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  icon?: IconSvgElement;
  onClose: () => void;
  children: ReactNode;
  actions?: AppModalAction[];
}

const VARIANT = {
  primary: "default",
  secondary: "secondary",
  danger: "destructive",
} as const;

export function AppModal({
  visible,
  title,
  subtitle,
  icon,
  onClose,
  children,
  actions,
}: AppModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return;
    if (visible && !dialog.open) dialog.showModal();
    if (!visible && dialog.open) dialog.close();
  }, [visible]);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return;
    const dismissOnBackdrop = (event: MouseEvent): void => {
      if (event.target === dialog) onClose();
    };
    dialog.addEventListener("click", dismissOnBackdrop);
    return () => dialog.removeEventListener("click", dismissOnBackdrop);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="app-modal mx-auto mt-auto mb-0 hidden max-h-[88dvh] w-full max-w-160 flex-col overflow-hidden rounded-card border-(length:--border-width-card) border-card-border bg-card p-0 text-text-primary backdrop:bg-scrim open:flex sm:mb-6"
    >
      <header className="flex shrink-0 items-center gap-2.5 border-b border-card-border bg-card px-4 py-3.5">
        {icon === undefined ? null : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary/15 text-text-accent">
            <HugeiconsIcon icon={icon} size={17} strokeWidth={1.5} />
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="truncate text-[1.0625rem] font-semibold tracking-[-0.01em] text-text-primary">
            {title}
          </h2>
          {subtitle === undefined ? null : (
            <p className="truncate text-[0.75rem] text-text-muted">{subtitle}</p>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={onClose}
          aria-label="Close"
          className="border-hairline-strong bg-sunken text-text-secondary hover:border-danger/50 hover:bg-danger/10 hover:text-danger"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.5} />
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4">
        {children}
      </div>

      {actions !== undefined && actions.length > 0 ? (
        <footer className="flex shrink-0 justify-end gap-2.5 border-t border-card-border bg-card px-4 py-3.5 pb-[max(0.875rem,var(--safe-bottom))]">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={VARIANT[action.tone ?? "secondary"]}
              onClick={action.onPress}
              disabled={action.disabled === true || action.busy === true}
              aria-busy={action.busy === true}
            >
              {action.label}
            </Button>
          ))}
        </footer>
      ) : null}
    </dialog>
  );
}
