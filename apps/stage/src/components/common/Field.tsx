import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type InputHTMLAttributes, useId, useState } from "react";

export interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  label: string;
  hint?: string;
  error?: string | null;
  secure?: boolean;
}

export function Field({ label, hint, error, secure = false, ...input }: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const [revealed, setRevealed] = useState(false);
  const [focused, setFocused] = useState(false);
  const invalid = typeof error === "string" && error.length > 0;
  const border = invalid ? "border-danger" : focused ? "border-primary" : "border-card-border";
  const hasMessage = invalid || hint !== undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="px-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-text-muted"
      >
        {label}
      </label>

      <div className="relative flex flex-col justify-center">
        <input
          {...input}
          id={id}
          type={secure && !revealed ? "password" : "text"}
          aria-invalid={invalid}
          aria-describedby={hasMessage ? messageId : undefined}
          onFocus={(event) => {
            setFocused(true);
            input.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            input.onBlur?.(event);
          }}
          className={`min-h-[44px] rounded-2xl border bg-input-surface px-3.5 py-2.5 text-[14px] leading-5 text-text-primary outline-none placeholder:text-text-muted ${border} ${secure ? "pr-11" : ""}`}
        />
        {secure ? (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? "Hide password" : "Show password"}
            className="absolute right-2 flex h-9 items-center justify-center px-2 text-text-muted"
          >
            <HugeiconsIcon icon={revealed ? ViewOffIcon : ViewIcon} size={18} strokeWidth={1.25} />
          </button>
        ) : null}
      </div>

      {invalid ? (
        <p id={messageId} role="alert" className="px-0.5 text-[11px] text-danger">
          {error}
        </p>
      ) : hint !== undefined ? (
        <p id={messageId} className="px-0.5 text-[11px] text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
