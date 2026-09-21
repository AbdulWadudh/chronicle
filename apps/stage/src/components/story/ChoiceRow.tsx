import type { TurnChoice } from "@chronicle/utils";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { useSentenceReveal } from "~/components/story/useSentenceReveal";

const CHOICE_STAGGER_MS = 650;
const HOLD_DURATION_MS = 450;

export interface ChoiceRowProps {
  choice: TurnChoice;
  index: number;
  typing: boolean;
  onPress: () => void;
  onHold?: () => void;
}

export function ChoiceRow({ choice, index, typing, onPress, onHold }: ChoiceRowProps) {
  const [started, setStarted] = useState(!typing);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didHoldRef = useRef(false);

  useEffect(() => {
    if (!typing) return;
    const timer = setTimeout(() => setStarted(true), index * CHOICE_STAGGER_MS);
    return () => clearTimeout(timer);
  }, [typing, index]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current !== null) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

  const label = useSentenceReveal(choice.label, {
    cinemaMode: false,
    playingSentenceIndex: null,
    typing,
    held: !started,
  });
  const labelText = label.visible.map((sentence) => sentence.text).join("");

  function clearHoldTimer() {
    if (holdTimerRef.current !== null) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setIsHolding(false);
  }

  function handlePointerDown() {
    didHoldRef.current = false;
    if (!onHold) return;
    setIsHolding(true);
    holdTimerRef.current = setTimeout(() => {
      didHoldRef.current = true;
      setIsHolding(false);
      onHold();
    }, HOLD_DURATION_MS);
  }

  function handleClick() {
    if (didHoldRef.current) {
      didHoldRef.current = false;
      return;
    }
    onPress();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={clearHoldTimer}
      onPointerLeave={clearHoldTimer}
      onPointerCancel={clearHoldTimer}
      onContextMenu={(event) => {
        if (didHoldRef.current) event.preventDefault();
      }}
      style={{ "--rise-index": index } as CSSProperties}
      className={`pressable rise-in group flex select-none items-start gap-3 rounded-card border-(length:--border-width-card) border-primary/25 bg-linear-to-r from-primary/12 via-accent/8 to-transparent px-4 py-3 text-left transition-all hover:border-primary/55 motion-reduce:transition-none ${
        isHolding ? "scale-[0.985] border-accent/60 bg-accent/20 ring-1 ring-accent/40" : ""
      }`}
    >
      <HugeiconsIcon
        icon={ArrowRight02Icon}
        size={15}
        strokeWidth={2}
        className="mt-0.5 shrink-0 text-text-accent"
      />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[0.9375rem] leading-snug font-medium text-text-primary">
          {labelText}
          {label.isTyping ? (
            <span aria-hidden="true" className="ml-0.5 inline-block w-0.5 animate-pulse bg-primary">
              &nbsp;
            </span>
          ) : null}
        </span>
        {choice.hint.length === 0 || !label.isComplete ? null : (
          <span className="text-[0.75rem] leading-snug text-text-muted">{choice.hint}</span>
        )}
      </span>
    </button>
  );
}

export function ChoiceSkeleton({ index }: { index: number }) {
  const widthClass = index === 0 ? "w-3/4" : index === 1 ? "w-5/6" : "w-2/3";
  const hintWidthClass = index === 0 ? "w-1/3" : index === 1 ? "w-1/2" : "w-2/5";

  return (
    <div
      style={{ "--rise-index": index } as CSSProperties}
      className="rise-in flex items-start gap-3 rounded-card border-(length:--border-width-card) border-primary/15 bg-linear-to-r from-primary/8 via-accent/4 to-transparent px-4 py-3 animate-pulse"
    >
      <div className="mt-1 size-3 shrink-0 rounded-full bg-primary/25" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 py-0.5">
        <div className={`h-4 rounded bg-primary/20 ${widthClass}`} />
        <div className={`h-3 rounded bg-text-muted/15 ${hintWidthClass}`} />
      </div>
    </div>
  );
}
