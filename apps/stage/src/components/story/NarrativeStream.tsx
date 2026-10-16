import { Passage } from "./Passage";
import type { SentenceReveal } from "./useSentenceReveal";

export interface NarrativeStreamProps {
  reveal: SentenceReveal;
  cinemaMode: boolean;
  playingSentenceIndex: number | null;
  caption?: boolean;
  onSkip?: () => void;
}

const PASSAGE = "text-[1rem] leading-(--leading-narrative) text-text-secondary";
const CAPTION = "text-center text-[1.0625rem] leading-snug text-text-primary";

export function NarrativeStream({
  reveal,
  cinemaMode,
  playingSentenceIndex,
  caption = false,
  onSkip,
}: NarrativeStreamProps) {
  const shown = caption ? reveal.visible.slice(-1) : reveal.visible;
  const offset = caption ? reveal.visible.length - shown.length : 0;
  const liveIndex = reveal.visible.length - 1 - offset;

  function skip(): void {
    reveal.revealAll();
    onSkip?.();
  }

  return (
    <div className="relative">
      <Passage
        sentences={shown}
        textClass={caption ? CAPTION : PASSAGE}
        emphasisedIndex={
          caption
            ? liveIndex
            : cinemaMode && playingSentenceIndex !== null
              ? playingSentenceIndex
              : null
        }
        cursorIndex={reveal.isTyping ? liveIndex : null}
      />

      {reveal.isComplete || caption ? null : (
        <>
          <p aria-hidden="true" className="pt-4 text-xs text-text-muted">
            Tap to reveal the rest
          </p>
          <button
            type="button"
            onClick={skip}
            aria-label="Reveal the full passage"
            className="pointer-events-auto absolute inset-0"
          />
        </>
      )}
    </div>
  );
}
