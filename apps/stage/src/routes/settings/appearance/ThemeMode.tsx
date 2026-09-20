import type { ThemeScheme } from "@chronicle/config";
import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { Segmented, type SegmentedOption } from "~/components/ui/segmented";
import { useScheme, useThemeStore } from "~/theme/store";
import { PANEL, SPLIT } from "./styles";

const SCHEMES: readonly SegmentedOption<ThemeScheme>[] = [
  { value: "dark", label: "Dark", icon: Moon02Icon },
  { value: "light", label: "Light", icon: Sun03Icon },
];

export function ThemeMode({ index }: { index: number }) {
  const scheme = useScheme();
  const setPreference = useThemeStore((state) => state.setPreference);

  return (
    <div style={{ ["--rise-index" as string]: index }} className={`${PANEL} ${SPLIT} rise-in`}>
      <div className="min-w-0">
        <p className="text-[0.875rem] font-medium tracking-[-0.01em] text-text-primary">
          Theme mode
        </p>
        <p className="mt-0.5 text-[0.75rem] leading-relaxed text-text-muted">
          Starts from your system. Each mode keeps its own colours.
        </p>
      </div>
      <Segmented
        value={scheme}
        options={SCHEMES}
        onValueChange={setPreference}
        ariaLabel="Theme mode"
      />
    </div>
  );
}
