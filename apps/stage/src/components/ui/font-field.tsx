import { ArrowDown01Icon, Search01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Spinner } from "~/components/common/Spinner";
import { Input } from "~/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import {
  familyFromStack,
  fetchFontCatalogue,
  fontStack,
  type GoogleFontFamily,
  loadFontFamily,
  searchFontCatalogue,
} from "~/lib/googleFonts";

const PAGE_SIZE = 24;

export interface FontFieldProps {
  value: string;
  onChange: (stack: string) => void;
  ariaLabel: string;
}

export function FontField({ value, onChange, ariaLabel }: FontFieldProps) {
  const [open, setOpen] = useState(false);
  const [catalogue, setCatalogue] = useState<GoogleFontFamily[] | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sentinel = useRef<HTMLDivElement>(null);

  const current = familyFromStack(value) ?? "System default";

  useEffect(() => {
    if (!open || catalogue !== null) return;
    fetchFontCatalogue()
      .then(setCatalogue)
      .catch((cause: unknown) =>
        setFailure(cause instanceof Error ? cause.message : "Could not load Google Fonts."),
      );
  }, [open, catalogue]);

  const matches = useMemo(
    () =>
      catalogue === null ? [] : searchFontCatalogue(catalogue, query, Number.POSITIVE_INFINITY),
    [catalogue, query],
  );

  const results = useMemo(() => matches.slice(0, visible), [matches, visible]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, []);

  useEffect(() => {
    const target = sentinel.current;
    if (target === null || results.length >= matches.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible((current) => current + PAGE_SIZE);
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [results.length, matches.length]);

  useEffect(() => {
    for (const entry of results) loadFontFamily(entry.family);
  }, [results]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={ariaLabel}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-[var(--radius-control)] border-[length:var(--border-width-card)] border-card-border bg-input-surface px-3.5 py-2.5 text-[0.8125rem] text-text-primary outline-none transition-colors hover:border-hairline-strong focus-visible:border-primary/60 motion-reduce:transition-none"
      >
        <span className="truncate" style={{ fontFamily: value }}>
          {current}
        </span>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={15}
          strokeWidth={1.5}
          className="shrink-0 text-text-muted"
        />
      </PopoverTrigger>

      <PopoverContent className="w-[var(--anchor-width)] min-w-[260px] p-2">
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            size={14}
            strokeWidth={1.5}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted"
          />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisible(PAGE_SIZE);
            }}
            placeholder="Search Google Fonts"
            aria-label="Search Google Fonts"
            className="pl-8"
          />
        </div>

        <div className="mt-2 max-h-64 overflow-y-auto">
          {failure !== null ? (
            <p role="alert" className="px-2 py-3 text-[0.75rem] leading-relaxed text-danger">
              {failure}
            </p>
          ) : catalogue === null ? (
            <div className="flex items-center justify-center gap-2 py-6 text-text-muted">
              <Spinner size={14} label="Loading fonts" />
              <span className="text-[0.75rem]">Loading the catalogue</span>
            </div>
          ) : results.length === 0 ? (
            <p className="px-2 py-3 text-[0.75rem] text-text-muted">No family matches that.</p>
          ) : (
            results.map((entry) => {
              const stack = fontStack(entry.family, entry.category);
              const selected = entry.family === current;
              return (
                <button
                  type="button"
                  key={entry.family}
                  onClick={() => {
                    loadFontFamily(entry.family);
                    onChange(stack);
                    setOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-[var(--radius-control)] px-2.5 py-2 text-left transition-colors hover:bg-raised-hover motion-reduce:transition-none ${
                    selected ? "text-text-accent" : "text-text-primary"
                  }`}
                >
                  <span className="truncate text-[0.875rem]" style={{ fontFamily: stack }}>
                    {entry.family}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-[0.625rem] text-text-muted">{entry.category}</span>
                    {selected ? (
                      <HugeiconsIcon icon={Tick02Icon} size={13} strokeWidth={2} />
                    ) : null}
                  </span>
                </button>
              );
            })
          )}
          {results.length < matches.length ? (
            <div ref={sentinel} className="flex justify-center py-3 text-text-muted">
              <Spinner size={13} label="Loading more fonts" />
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
