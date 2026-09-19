import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:bg-white/[0.06] disabled:text-text-muted motion-reduce:transition-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground active:scale-[0.98]",
        secondary: "bg-secondary text-secondary-foreground active:scale-[0.98]",
        outline:
          "border border-white/[0.07] bg-white/[0.02] text-text-muted hover:border-white/15 hover:text-text-secondary",
        ghost: "text-text-muted hover:bg-white/[0.04] hover:text-text-secondary",
        destructive: "bg-danger text-text-primary active:scale-[0.98]",
      },
      size: {
        default: "h-11 px-5 text-[14px]",
        sm: "h-9 px-3 text-[12px]",
        lg: "h-12 px-6 text-[15px]",
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
