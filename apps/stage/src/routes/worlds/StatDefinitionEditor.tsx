import type { ComposeMode, StatDefinition } from "@chronicle/utils";
import { Delete02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "motion/react";
import { ComposableField } from "~/components/common/ComposableField";
import { Input } from "~/components/ui/input";
import { GroupLabel } from "~/components/ui/label";

export interface StatDefinitionEditorProps {
  definitions: readonly StatDefinition[];
  busyIndex: number | null;
  busyMode: ComposeMode | null;
  onChange: (definitions: StatDefinition[]) => void;
  onCompose: (index: number, mode: ComposeMode) => void;
}

export function StatDefinitionEditor({
  definitions,
  busyIndex,
  busyMode,
  onChange,
  onCompose,
}: StatDefinitionEditorProps) {
  function edit(index: number, patch: Partial<StatDefinition>): void {
    onChange(
      definitions.map((definition, position) =>
        position === index ? { ...definition, ...patch } : definition,
      ),
    );
  }

  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <GroupLabel>Abilities</GroupLabel>
        <p className="text-[0.6875rem] text-text-muted">
          {definitions.length === 0 ? "None yet" : `${definitions.length} tested by the dice`}
        </p>
      </div>

      {definitions.map((definition, index) => (
        <motion.div
          key={definition.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="flex flex-col gap-2 rounded-card border-(length:--border-width-card) border-card-border bg-card p-3 shadow-(--shadow-overlay)"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control bg-primary/15 text-[0.6875rem] font-semibold text-text-accent">
              {index + 1}
            </span>
            <Input
              className="flex-1 text-[0.875rem] font-medium"
              value={definition.label}
              placeholder="Ability name"
              aria-label={`Ability ${index + 1} name`}
              onChange={(event) => edit(index, { label: event.target.value })}
            />
            <button
              type="button"
              aria-label={`Remove ability ${index + 1}`}
              onClick={() => onChange(definitions.filter((_, position) => position !== index))}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border-(length:--border-width-card) border-hairline bg-sunken text-text-muted transition-colors hover:border-danger/40 hover:text-danger motion-reduce:transition-none"
            >
              <HugeiconsIcon icon={Delete02Icon} size={15} strokeWidth={1.5} />
            </button>
          </div>

          <div className="pl-9.5">
            <ComposableField
              id={`ability-${definition.id}`}
              actionNoun="description"
              ariaLabel={`Ability ${index + 1} description`}
              value={definition.description}
              placeholder="When is it tested?"
              disabled={definition.label.trim().length === 0}
              busyMode={busyIndex === index ? busyMode : null}
              onChange={(value) => edit(index, { description: value })}
              onCompose={(mode) => onCompose(index, mode)}
            />
          </div>
        </motion.div>
      ))}

      <button
        type="button"
        onClick={() =>
          onChange([...definitions, { id: crypto.randomUUID(), label: "", description: "" }])
        }
        className="pressable flex min-h-11 items-center justify-center gap-2 rounded-control border-(length:--border-width-card) border-dashed border-hairline-strong bg-raised text-[0.8125rem] font-medium text-text-secondary"
      >
        <HugeiconsIcon icon={PlusSignIcon} size={15} strokeWidth={1.75} />
        Add an ability
      </button>
    </section>
  );
}
