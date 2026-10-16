import { Combobox } from "@base-ui/react/combobox";
import { ArrowDown01Icon, Loading03Icon, PlayIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTopLayer } from "~/hooks/useTopLayer";
import type { Voice } from "~/hooks/useVoices";
import { useVoices } from "~/hooks/useVoices";
import { previewVoice } from "~/lib/voicePreview";

const HOVER_DELAY_MS = 250;

const INHERIT: Voice = {
  id: "",
  label: "Narrator",
  locale: "Inherited",
  gender: "",
  grade: null,
};

function describe(voice: Voice): string {
  if (voice.id === "") return voice.label;
  return `${voice.label} — ${voice.locale}${voice.gender === "" ? "" : `, ${voice.gender.toLowerCase()}`}`;
}

export interface VoicePickerProps {
  value: string | null;
  ariaLabel: string;
  allowInherit?: boolean;
  onValueChange: (value: string | null) => void;
}

export function VoicePicker({
  value,
  ariaLabel,
  allowInherit = false,
  onValueChange,
}: VoicePickerProps) {
  const { groups, byId, loading, error } = useVoices();
  const { anchorRef, container } = useTopLayer<HTMLButtonElement>();
  const [playing, setPlaying] = useState<string | null>(null);
  const open = useRef(false);

  const items = useMemo(() => {
    const collected = groups.map((group) => ({
      value: group.label,
      items: group.values.flatMap((id) => {
        const voice = byId.get(id);
        return voice === undefined ? [] : [voice];
      }),
    }));
    return allowInherit ? [{ value: "", items: [INHERIT] }, ...collected] : collected;
  }, [groups, byId, allowInherit]);

  const total = useMemo(
    () => items.reduce((count, group) => count + group.items.length, 0),
    [items],
  );

  const selected = value === null ? (allowInherit ? INHERIT : null) : (byId.get(value) ?? null);

  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelHover = useCallback(() => {
    if (hoverTimer.current === null) return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
  }, []);

  const play = useCallback(
    (id: string) => {
      cancelHover();
      hoverTimer.current = setTimeout(() => {
        setPlaying(id);
        previewVoice(id)
          .catch(() => undefined)
          .finally(() => setPlaying(null));
      }, HOVER_DELAY_MS);
    },
    [cancelHover],
  );

  useEffect(() => cancelHover, [cancelHover]);

  if (error !== null) {
    return <p className="text-[0.75rem] text-danger">{error}</p>;
  }

  return (
    <Combobox.Root
      items={items}
      value={selected}
      itemToStringLabel={(item: Voice) => describe(item)}
      isItemEqualToValue={(item: Voice, current: Voice | null) => item.id === (current?.id ?? null)}
      onOpenChange={(next: boolean) => {
        open.current = next;
      }}
      onValueChange={(next: Voice | null) => {
        if (next === null || !open.current) return;
        onValueChange(next.id === "" ? null : next.id);
      }}
    >
      <Combobox.Trigger
        ref={anchorRef}
        aria-label={ariaLabel}
        className="flex w-36 cursor-pointer items-center justify-between gap-2 rounded-control border-(length:--border-width-card) border-card-border bg-input-surface px-3 py-2.5 text-left text-[0.8125rem] text-text-primary outline-none transition-colors hover:border-hairline-strong focus-visible:border-primary/60 data-popup-open:border-primary/60 motion-reduce:transition-none"
      >
        <span className={`truncate ${selected === null ? "text-text-muted" : ""}`}>
          {selected === null ? (loading ? "Loading…" : "Choose") : selected.label}
        </span>
        <Combobox.Icon className="shrink-0 text-text-muted">
          <HugeiconsIcon icon={ArrowDown01Icon} size={15} strokeWidth={1.5} />
        </Combobox.Icon>
      </Combobox.Trigger>

      <Combobox.Portal container={container}>
        <Combobox.Positioner sideOffset={6} className="z-50 outline-none">
          <Combobox.Popup className="flex max-h-[min(22rem,var(--available-height))] w-(--anchor-width) min-w-64 origin-(--transform-origin) flex-col overflow-hidden rounded-control border-(length:--border-width-card) border-hairline bg-card text-text-primary shadow-(--shadow-overlay) transition-[opacity,transform] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0 motion-reduce:transition-none">
            <div className="relative shrink-0 border-b border-hairline p-2">
              <HugeiconsIcon
                icon={Search01Icon}
                size={14}
                strokeWidth={1.5}
                className="pointer-events-none absolute top-1/2 left-4.5 -translate-y-1/2 text-text-muted"
              />
              <Combobox.Input
                placeholder={`Filter ${total} voices`}
                aria-label={`Filter ${ariaLabel}`}
                className="w-full rounded-control border-(length:--border-width-card) border-hairline bg-sunken py-2 pr-2.5 pl-8 text-[0.75rem] text-text-primary outline-none placeholder:text-text-muted focus-visible:border-primary/60"
              />
            </div>

            <Combobox.Empty className="px-3 py-4 text-center text-[0.75rem] text-text-muted empty:hidden">
              No voice matches that.
            </Combobox.Empty>

            <Combobox.List className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1">
              {(group: { value: string; items: Voice[] }) => (
                <Combobox.Group key={group.value} items={group.items} className="block">
                  {group.value === "" ? null : (
                    <Combobox.GroupLabel className="px-2 py-1.5 text-[0.625rem] font-medium tracking-[0.12em] text-text-muted uppercase">
                      {group.value}
                    </Combobox.GroupLabel>
                  )}
                  <Combobox.Collection>
                    {(voice: Voice) => (
                      <Combobox.Item
                        key={voice.id}
                        value={voice}
                        className="flex cursor-pointer items-center gap-2 rounded-control py-2 pr-1.5 pl-3 outline-none select-none data-highlighted:bg-sunken data-selected:text-text-accent"
                      >
                        <span className="min-w-0 flex-1 truncate text-[0.8125rem]">
                          {voice.label}
                        </span>
                        {voice.grade === null ? null : (
                          <span className="shrink-0 rounded-control bg-sunken px-1.5 py-0.5 text-[0.625rem] tabular-nums text-text-muted">
                            {voice.grade}
                          </span>
                        )}
                        {voice.id === "" ? null : (
                          <button
                            type="button"
                            aria-label={`Preview ${voice.label}`}
                            className="shrink-0 rounded-control p-1.5 text-text-muted transition-colors hover:text-text-accent focus-visible:text-text-accent motion-reduce:transition-none"
                            onPointerEnter={() => play(voice.id)}
                            onPointerLeave={cancelHover}
                            onFocus={() => play(voice.id)}
                            onBlur={cancelHover}
                            onPointerDown={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                            }}
                          >
                            <HugeiconsIcon
                              icon={playing === voice.id ? Loading03Icon : PlayIcon}
                              size={13}
                              strokeWidth={2}
                              className={playing === voice.id ? "animate-spin" : undefined}
                            />
                          </button>
                        )}
                      </Combobox.Item>
                    )}
                  </Combobox.Collection>
                </Combobox.Group>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
