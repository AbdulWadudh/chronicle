import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { cn } from "~/lib/utils";

export interface PreviewCardProps {
  trigger: ReactElement;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

function PreviewCard({ trigger, children, side = "top", className }: PreviewCardProps) {
  return (
    <PreviewCardPrimitive.Root>
      <PreviewCardPrimitive.Trigger render={trigger} />
      <PreviewCardPrimitive.Portal>
        <PreviewCardPrimitive.Positioner side={side} sideOffset={10} className="z-50 outline-none">
          <PreviewCardPrimitive.Popup
            className={cn(
              "w-80 max-w-[85vw] origin-(--transform-origin) rounded-card border-(length:--border-width-card) border-card-border bg-card p-4 text-text-primary shadow-(--shadow-overlay) outline-none transition-[opacity,transform] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 motion-reduce:transition-none",
              className,
            )}
          >
            {children}
          </PreviewCardPrimitive.Popup>
        </PreviewCardPrimitive.Positioner>
      </PreviewCardPrimitive.Portal>
    </PreviewCardPrimitive.Root>
  );
}

export type PreviewCardPopupProps = ComponentProps<typeof PreviewCardPrimitive.Popup>;
export { PreviewCard };
