import type { ComposeMode } from "@chronicle/utils";
import { FieldActions } from "~/components/common/FieldActions";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

export interface ComposableFieldProps {
  id: string;
  actionNoun: string;
  value: string;
  placeholder: string;
  label?: string;
  ariaLabel?: string;
  hint?: string;
  rows?: number;
  disabled?: boolean;
  busyMode: ComposeMode | null;
  onChange: (value: string) => void;
  onCompose: (mode: ComposeMode) => void;
}

export function ComposableField({
  id,
  actionNoun,
  value,
  placeholder,
  label,
  ariaLabel,
  hint,
  rows,
  disabled = false,
  busyMode,
  onChange,
  onCompose,
}: ComposableFieldProps) {
  const hintId = `${id}-hint`;
  const multiline = rows !== undefined;

  const shared = {
    id,
    value,
    placeholder,
    "aria-label": label === undefined ? ariaLabel : undefined,
    "aria-describedby": hint === undefined ? undefined : hintId,
    disabled: disabled || busyMode !== null,
    onChange: (event: { target: { value: string } }) => onChange(event.target.value),
  };

  const actions = (
    <FieldActions
      label={actionNoun}
      busyMode={busyMode}
      canEnhance={value.trim().length > 0}
      disabled={disabled}
      onCompose={onCompose}
    />
  );

  return (
    <div className="flex flex-col gap-2">
      {label === undefined ? null : <Label htmlFor={id}>{label}</Label>}

      {multiline ? (
        <div className="relative">
          <Textarea {...shared} rows={rows} className="pb-9" />
          <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-control bg-input-surface/85 p-0.5 backdrop-blur-sm">
            {actions}
          </span>
        </div>
      ) : (
        <div className="relative">
          <Input {...shared} className="pr-18" />
          <span className="absolute top-1/2 right-1.5 -translate-y-1/2">{actions}</span>
        </div>
      )}

      {hint === undefined ? null : (
        <p id={hintId} className="text-[0.6875rem] leading-relaxed text-text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
