import type { ComposeMode } from "@chronicle/utils";
import { SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ComposableField } from "~/components/common/ComposableField";
import { Spinner } from "~/components/common/Spinner";

const MIN_PREMISE = 8;

export interface WorldPremiseCardProps {
  premise: string;
  drafting: boolean;
  busyMode: ComposeMode | null;
  onChange: (premise: string) => void;
  onCompose: (mode: ComposeMode) => void;
  onDraftAll: () => void;
}

export function WorldPremiseCard({
  premise,
  drafting,
  busyMode,
  onChange,
  onCompose,
  onDraftAll,
}: WorldPremiseCardProps) {
  return (
    <section className="flex flex-col gap-3 rounded-card border-(length:--border-width-card) border-primary/25 bg-raised p-3.5">
      <ComposableField
        id="premise"
        label="Start from a premise"
        actionNoun="premise"
        value={premise}
        rows={2}
        busyMode={busyMode}
        placeholder="A drowned cathedral city where the tide keeps the dead honest."
        onChange={onChange}
        onCompose={onCompose}
      />

      <button
        type="button"
        disabled={premise.trim().length < MIN_PREMISE || drafting || busyMode !== null}
        onClick={onDraftAll}
        className="pressable flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-4 text-[0.8125rem] font-semibold text-primary-foreground disabled:bg-sunken disabled:text-text-muted"
      >
        {drafting ? (
          <Spinner size={14} label="Drafting the world" />
        ) : (
          <HugeiconsIcon icon={SparklesIcon} size={15} strokeWidth={1.75} />
        )}
        {drafting ? "Drafting…" : "Fill in everything below"}
      </button>

      <p className="text-[0.6875rem] leading-relaxed text-text-muted">
        Or use the two buttons on any field to generate it on its own, or sharpen what you have
        already written.
      </p>
    </section>
  );
}
