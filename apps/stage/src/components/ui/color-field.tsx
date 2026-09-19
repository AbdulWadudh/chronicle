import { useId } from "react";
import { cn } from "~/lib/utils";

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/iu;

export interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  overridden?: boolean;
  className?: string;
}

function swatchValue(value: string): string {
  return HEX.test(value) ? value.slice(0, 7) : "#000000";
}

export function ColorField({ label, value, onChange, overridden, className }: ColorFieldProps) {
  const id = useId();

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-[var(--radius-control)] border border-hairline bg-raised px-2.5 py-2 transition-colors duration-200 hover:border-hairline-strong hover:bg-raised-hover motion-reduce:transition-none",
        className,
      )}
    >
      <label
        htmlFor={id}
        className="relative size-7 shrink-0 cursor-pointer overflow-hidden rounded-full border border-hairline-strong"
        style={{ backgroundColor: HEX.test(value) ? value : undefined }}
        title={`Change ${label}`}
      >
        <input
          id={id}
          type="color"
          value={swatchValue(value)}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-[12px] font-medium text-text-primary">
          {label}
          {overridden === true ? (
            <>
              <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-primary" />
              <span className="sr-only">Changed from the default</span>
            </>
          ) : null}
        </p>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label} value`}
          spellCheck={false}
          className="w-full bg-transparent font-mono text-[10px] tracking-tight text-text-muted outline-none focus:text-text-secondary"
        />
      </div>
    </div>
  );
}
