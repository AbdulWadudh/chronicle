import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

function Slider({ className, ...props }: ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root data-slot="slider" className={cn("w-full", className)} {...props}>
      <SliderPrimitive.Control className="relative flex w-full cursor-pointer touch-none items-center py-2 select-none">
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-(--radius-control) bg-sunken">
          <SliderPrimitive.Indicator className="absolute h-full rounded-(--radius-control) bg-primary" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="size-4 cursor-grab rounded-(--radius-control) border-2 border-canvas bg-primary outline-none transition-transform duration-150 hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring/70 active:cursor-grabbing active:scale-115 data-dragging:cursor-grabbing motion-reduce:transition-none" />
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
