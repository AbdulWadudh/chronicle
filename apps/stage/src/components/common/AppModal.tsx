import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ReactNode, useEffect, useRef } from "react";

export interface AppModalAction {
  label: string;
  onPress: () => void;
  tone?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}

export interface AppModalProps {
  visible: boolean;
  title: string;
  icon?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  actions?: AppModalAction[];
}

const TONE_CLASS: Record<NonNullable<AppModalAction["tone"]>, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  danger: "bg-danger",
};

const TONE_TEXT: Record<NonNullable<AppModalAction["tone"]>, string> = {
  primary: "text-primary-foreground",
  secondary: "text-secondary-foreground",
  danger: "text-text-primary",
};

export function AppModal({ visible, title, icon, onClose, children, actions }: AppModalProps) {
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
      onClose={onClose}
      className="app-modal mx-auto mt-auto mb-0 max-h-[88%] w-full max-w-160 overflow-hidden rounded-(--radius-card) border-(length:--border-width-card) border-card-border bg-card p-0 text-text-primary backdrop:bg-scrim sm:mb-6 sm:rounded-(--radius-card)"
    >
      <div className="flex max-h-[inherit] flex-col pb-(--safe-bottom)">
        <div className="flex items-center gap-3 border-b border-card-border px-5 py-4">
          {icon}
          <h2 className="flex-1 truncate text-lg font-semibold text-text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-(--radius-control) bg-secondary text-text-secondary"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">{children}</div>

        {actions !== undefined && actions.length > 0 ? (
          <div className="flex justify-end gap-3 border-t border-card-border px-5 py-4">
            {actions.map((action) => (
              <button
                type="button"
                key={action.label}
                onClick={action.onPress}
                disabled={action.disabled}
                className={`rounded-(--radius-control) px-4 py-2.5 font-medium ${
                  action.disabled === true
                    ? "bg-sunken text-text-muted"
                    : `${TONE_CLASS[action.tone ?? "secondary"]} ${TONE_TEXT[action.tone ?? "secondary"]}`
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </dialog>
  );
}
