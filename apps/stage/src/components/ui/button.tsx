import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring/60 disabled:bg-sunken disabled:text-text-muted motion-reduce:transition-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground active:scale-[0.98]",
        secondary: "bg-secondary text-secondary-foreground active:scale-[0.98]",
        outline:
          "border-[length:var(--border-width-card)] border-hairline bg-raised text-text-muted hover:border-hairline-strong hover:text-text-secondary",
        ghost: "text-text-muted hover:bg-raised-hover hover:text-text-secondary",
        destructive: "bg-danger text-text-primary active:scale-[0.98]",
      },
      size: {
        default: "h-11 px-5 text-[0.875rem]",
        sm: "h-9 px-3 text-[0.75rem]",
        lg: "h-12 px-6 text-[0.9375rem]",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      type={type}
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
