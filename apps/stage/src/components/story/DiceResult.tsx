export interface DiceResultProps {
  stat: string;
  dc: number;
  roll: number;
  baseModifier: number;
  succeeded: boolean;
}

function signed(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

export function DiceResult({ stat, dc, roll, baseModifier, succeeded }: DiceResultProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-2">
      <p className="text-[0.75rem] uppercase tracking-[0.14em] text-text-muted">
        {stat} · DC {dc}
      </p>
      <p className="font-mono text-2xl font-semibold text-text-primary">
        {roll} {signed(baseModifier)} = {roll + baseModifier}
      </p>
      <p className={`text-[0.8125rem] font-medium ${succeeded ? "text-success" : "text-danger"}`}>
        {succeeded ? "Succeeded" : "Failed"}
      </p>
    </div>
  );
}
