import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

function Label({ className, htmlFor, ...props }: ComponentProps<"label">) {
  return (
    <label
      htmlFor={htmlFor}
      data-slot="label"
      className={cn(
        "text-[0.875rem] font-medium tracking-[-0.01em] text-text-primary select-none",
        className,
      )}
      {...props}
    />
  );
}

function GroupLabel({ className, ...props }: ComponentProps<"h3">) {
  return (
    <h3
      data-slot="group-label"
      className={cn(
        "text-[0.875rem] font-medium tracking-[-0.01em] text-text-primary select-none",
        className,
      )}
      {...props}
    />
  );
}

export { GroupLabel, Label };
