import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import type { ComponentProps } from "react";
import { useTopLayer } from "~/hooks/useTopLayer";
import { cn } from "~/lib/utils";

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;

function PopoverContent({
  className,
  sideOffset = 8,
  align = "start",
  ...props
}: ComponentProps<typeof PopoverPrimitive.Popup> & {
  sideOffset?: number;
  align?: "start" | "center" | "end";
}) {
  const { anchorRef, container } = useTopLayer<HTMLSpanElement>();

  return (
    <>
      <span ref={anchorRef} hidden aria-hidden="true" />
      <PopoverPrimitive.Portal container={container}>
        <PopoverPrimitive.Positioner
          sideOffset={sideOffset}
          align={align}
          className="z-50 outline-none"
        >
          <PopoverPrimitive.Popup
            data-slot="popover-content"
            className={cn(
              "origin-(--transform-origin) rounded-control border-(length:--border-width-card) border-hairline bg-card p-3 text-text-primary shadow-(--shadow-overlay) outline-none transition-[opacity,transform] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 motion-reduce:transition-none",
              className,
            )}
            {...props}
          />
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </>
  );
}

export { Popover, PopoverContent, PopoverTrigger };
