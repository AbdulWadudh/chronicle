import type { ReactNode } from "react";
import { GroupLabel } from "~/components/ui/label";

export interface LabeledRowProps {
  label: string;
  blurb?: string;
  htmlFor?: string;
  children: ReactNode;
}

export function LabeledRow({ label, blurb, htmlFor, children }: LabeledRowProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
      <div className="min-w-0">
        <GroupLabel {...(htmlFor === undefined ? {} : { id: htmlFor })}>{label}</GroupLabel>
        {blurb === undefined ? null : (
          <p className="mt-0.5 text-[0.75rem] leading-relaxed text-text-muted">{blurb}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function FormSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-[0.6875rem] font-medium tracking-[-0.005em] text-text-accent/70">
        {label}
      </h4>
      {children}
    </section>
  );
}

export function RowGroup({ label, children }: { label?: string; children: ReactNode }) {
  const rows = (
    <div className="divide-y divide-hairline rounded-card border-(length:--border-width-card) border-card-border bg-raised px-4">
      {children}
    </div>
  );
  if (label === undefined) return rows;
  return <FormSection label={label}>{rows}</FormSection>;
}
