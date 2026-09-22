import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { type ReactNode, type PointerEvent as ReactPointerEvent, useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import { useResponsiveLayout } from "~/hooks/useResponsiveLayout";
import { useSheetSize } from "~/hooks/useSheetSize";

export interface SheetAction {
  label: string;
  onPress: () => void;
  tone?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}

export interface SheetProps {
  open: boolean;
  title: string;
  subtitle?: string;
  icon?: IconSvgElement;
  storageKey: string;
  onClose: () => void;
  children: ReactNode;
  actions?: SheetAction[];
}

const VARIANT = {
  primary: "default",
  secondary: "secondary",
  danger: "destructive",
} as const;

export function Sheet({
  open,
  title,
  subtitle,
  icon,
  storageKey,
  onClose,
  children,
  actions,
}: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const layout = useResponsiveLayout();
  const docked = layout.width >= 640;
  const { size, onResizeStart } = useSheetSize(storageKey, docked);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return;
    const dismiss = (event: MouseEvent): void => {
      if (event.target === dialog) onClose();
    };
    dialog.addEventListener("click", dismiss);
    return () => dialog.removeEventListener("click", dismiss);
  }, [onClose]);

  const frame = docked
    ? { width: `${size}px`, height: "100dvh" }
    : { width: "100%", height: `${size}px` };

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={`hidden max-h-none max-w-none border-(length:--border-width-card) border-card-border bg-card p-0 text-text-primary backdrop:bg-scrim open:flex ${
        docked
          ? "mt-0 mr-0 mb-0 ml-auto h-dvh rounded-l-card"
          : "mt-auto mr-0 mb-0 ml-0 w-full rounded-t-card"
      }`}
      style={frame}
    >
      <div className={`flex h-full min-h-0 w-full ${docked ? "flex-row" : "flex-col"}`}>
        <button
          type="button"
          aria-label={docked ? "Resize the panel width" : "Resize the panel height"}
          onPointerDown={(event: ReactPointerEvent<HTMLButtonElement>) => onResizeStart(event)}
          className={`group shrink-0 bg-transparent ${
            docked ? "w-1.5 cursor-col-resize" : "h-4 w-full cursor-row-resize"
          }`}
        >
          <span
            className={`block rounded-full bg-hairline-strong transition-colors group-hover:bg-primary motion-reduce:transition-none ${
              docked ? "mx-auto h-16 w-1" : "mx-auto mt-1.5 h-1 w-10"
            }`}
          />
        </button>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col pb-(--safe-bottom)">
          <header className="flex shrink-0 items-center gap-2.5 border-b border-card-border px-4 py-3.5">
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
            {open ? children : null}
          </div>

          {actions !== undefined && actions.length > 0 ? (
            <footer className="flex shrink-0 justify-end gap-2.5 border-t border-card-border px-4 py-3.5">
              {actions.map((action) => (
                <Button
                  key={action.label}
                  variant={VARIANT[action.tone ?? "secondary"]}
                  onClick={action.onPress}
                  disabled={action.disabled === true}
                >
                  {action.label}
                </Button>
              ))}
            </footer>
          ) : null}
        </div>
      </div>
    </dialog>
  );
}
