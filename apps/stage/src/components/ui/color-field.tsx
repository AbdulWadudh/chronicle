import { RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useId } from "react";
import { HexAlphaColorPicker, HexColorInput } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { cn } from "~/lib/utils";

export interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  overridden?: boolean;
  onRevert?: () => void;
  className?: string;
}

export function ColorField({
  label,
  value,
  onChange,
  overridden,
  onRevert,
  className,
}: ColorFieldProps) {
  const id = useId();

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-control border-(length:--border-width-card) border-hairline bg-raised px-2.5 py-2 transition-colors duration-200 hover:border-hairline-strong hover:bg-raised-hover motion-reduce:transition-none",
        className,
      )}
    >
      <Popover>
        <PopoverTrigger
          aria-label={`Pick ${label}`}
          className="chronicle-swatch size-7 shrink-0 cursor-pointer rounded-control border-(length:--border-width-card) border-hairline-strong outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
          style={{ "--swatch": value } as React.CSSProperties}
        />
        <PopoverContent className="w-57">
          <HexAlphaColorPicker color={value} onChange={onChange} />
          <div className="mt-3 flex items-center gap-2">
            <span
              className="chronicle-swatch size-6 shrink-0 rounded-control border-(length:--border-width-card) border-hairline-strong"
              style={{ "--swatch": value } as React.CSSProperties}
            />
            <HexColorInput
              color={value}
              onChange={onChange}
              alpha
              prefixed
              aria-label={`${label} hex`}
              className="w-full rounded-control border-(length:--border-width-card) border-card-border bg-input-surface px-2.5 py-1.5 font-mono text-[0.75rem] text-text-primary uppercase outline-none focus:border-primary/60"
            />
          </div>
        </PopoverContent>
      </Popover>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-[0.75rem] font-medium text-text-primary">
          {label}
        </p>
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label} value`}
          spellCheck={false}
          className="w-full bg-transparent font-mono text-[0.625rem] tracking-tight text-text-muted outline-none focus:text-text-secondary"
        />
      </div>

      {overridden === true && onRevert !== undefined ? (
        <button
          type="button"
          onClick={onRevert}
          aria-label={`Revert ${label} to its default`}
          className="shrink-0 cursor-pointer rounded-control p-1 text-primary transition-colors hover:bg-raised-hover hover:text-text-accent motion-reduce:transition-none"
        >
          <HugeiconsIcon icon={RefreshIcon} size={12} strokeWidth={1.8} />
        </button>
      ) : null}
    </div>
  );
}
