import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import type { ReactNode } from "react";
import { Button } from "./button";

export interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "default" | "destructive";
  icon?: ReactNode;
  children?: ReactNode;
  onConfirm: () => void;
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "destructive",
  icon,
  children,
  onConfirm,
}: AlertDialogProps) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-scrim transition-opacity duration-200 ease-out data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none" />

        <AlertDialogPrimitive.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <AlertDialogPrimitive.Popup
            data-slot="alert-dialog"
            className="w-full max-w-[26rem] rounded-(--radius-card) border-(length:--border-width-card) border-card-border p-5 text-text-primary shadow-(--shadow-overlay) outline-none transition-[opacity,scale,translate] duration-200 ease-out data-ending-style:translate-y-1 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:translate-y-1 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none"
          >
            <div className="flex items-center gap-3">
              {icon === undefined ? null : (
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-(--radius-control) border-(length:--border-width-card) ${
                    tone === "destructive"
                      ? "border-danger/30 bg-danger/10 text-danger"
                      : "border-primary/20 bg-primary/[0.06] text-text-accent"
                  }`}
                >
                  {icon}
                </span>
              )}
              <AlertDialogPrimitive.Title className="min-w-0 flex-1 text-[0.9375rem] font-semibold tracking-[-0.015em] text-text-primary">
                {title}
              </AlertDialogPrimitive.Title>
            </div>

            <AlertDialogPrimitive.Description className="mt-3 text-[0.8125rem] leading-relaxed text-text-secondary">
              {description}
            </AlertDialogPrimitive.Description>

            {children === undefined ? null : (
              <div className="mt-4 max-h-[min(18rem,45dvh)] overflow-y-auto overscroll-contain">
                {children}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <AlertDialogPrimitive.Close
                render={
                  <Button variant="outline" size="sm">
                    {cancelLabel}
                  </Button>
                }
              />
              <AlertDialogPrimitive.Close
                onClick={onConfirm}
                render={
                  <Button variant={tone === "destructive" ? "destructive" : "default"} size="sm">
                    {confirmLabel}
                  </Button>
                }
              />
            </div>
          </AlertDialogPrimitive.Popup>
        </AlertDialogPrimitive.Viewport>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
