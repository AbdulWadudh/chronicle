import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useIsDark } from "~/theme/store";

const CLASS_NAMES = {
  toast:
    "!rounded-[var(--radius-control)] !border !border-hairline !bg-card !text-text-primary !shadow-[0_18px_40px_-12px_rgb(0_0_0/0.7)]",
  title: "!text-[13px] !font-medium",
  description: "!text-[12px] !text-text-muted",
  actionButton: "!rounded-lg !bg-primary !text-primary-foreground",
  cancelButton: "!rounded-lg !bg-secondary !text-secondary-foreground",
  success:
    "!border-success/35 !bg-success/[0.08] [&_[data-icon]]:!text-success [&_[data-title]]:!text-success",
  error:
    "!border-danger/35 !bg-danger/[0.08] [&_[data-icon]]:!text-danger [&_[data-title]]:!text-danger",
  warning:
    "!border-warning/35 !bg-warning/[0.08] [&_[data-icon]]:!text-warning [&_[data-title]]:!text-warning",
  info: "!border-accent/35 !bg-accent/[0.08] [&_[data-icon]]:!text-accent [&_[data-title]]:!text-accent",
};

export function Toaster(props: ToasterProps) {
  const isDark = useIsDark();

  return (
    <Sonner
      theme={isDark ? "dark" : "light"}
      position="bottom-center"
      offset={20}
      mobileOffset={12}
      toastOptions={{ classNames: CLASS_NAMES }}
      {...props}
    />
  );
}
