export interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

export function NumberField({ label, value, min, max, step = 1, onChange }: NumberFieldProps) {
  function nudge(direction: -1 | 1): void {
    const next = Math.min(Math.max(value + direction * step, min), max);
    if (next !== value) onChange(next);
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-card-border bg-card px-3 py-2">
      <span className="flex-1 truncate text-text-primary">{label}</span>
      <button
        type="button"
        onClick={() => nudge(-1)}
        disabled={value <= min}
        aria-label={`Decrease ${label}`}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground disabled:opacity-30"
      >
        −
      </button>
      <output className="w-12 text-center text-text-primary">{value}</output>
      <button
        type="button"
        onClick={() => nudge(1)}
        disabled={value >= max}
        aria-label={`Increase ${label}`}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}
