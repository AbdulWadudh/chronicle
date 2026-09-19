import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useIsDark } from "~/theme/store";

const CLASS_NAMES = {
  toast:
    "!rounded-2xl !border !border-white/[0.08] !bg-card !text-text-primary !shadow-[0_18px_40px_-12px_rgb(0_0_0/0.7)]",
  title: "!text-[13px] !font-medium !text-text-primary",
  description: "!text-[12px] !text-text-muted",
  actionButton: "!rounded-lg !bg-primary !text-primary-foreground",
  cancelButton: "!rounded-lg !bg-secondary !text-secondary-foreground",
  error: "!border-danger/30",
  success: "!border-success/25",
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
