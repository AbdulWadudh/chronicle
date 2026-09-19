import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

function Input({ className, type = "text", ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full rounded-[var(--radius-control)] border-[length:var(--border-width-card)] border-card-border bg-input-surface px-3.5 py-2.5 text-[0.8125rem] text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary/60 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
