import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

const buttonVariants = cva(
  "pressable inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-(--radius-control) font-medium whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:bg-sunken disabled:text-text-muted",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline:
          "border-(length:--border-width-card) border-hairline bg-raised text-text-muted hover:border-hairline-strong hover:text-text-secondary",
        ghost:
          "text-text-muted [--hover-scale:1.02] [--press-scale:0.97] [--shadow-hard:none] [--shadow-offset:0px] hover:bg-raised-hover hover:text-text-secondary",
        destructive: "bg-danger text-text-primary",
      },
      size: {
        default: "h-11 px-5 text-[0.875rem]",
        sm: "h-9 px-3 text-[0.75rem]",
        lg: "h-12 px-6 text-[0.9375rem]",
        icon: "size-9",
        iconSm: "size-7",
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
