import { motion } from "motion/react";
import { useReducedMotion } from "~/hooks/useReducedMotion";
import type { SentenceReveal } from "./useSentenceReveal";

export interface NarrativeStreamProps {
  reveal: SentenceReveal;
  cinemaMode: boolean;
  playingSentenceIndex: number | null;
  caption?: boolean;
  onSkip?: () => void;
}

const PASSAGE = "text-[1rem] leading-(--leading-narrative)";
const CAPTION = "text-center text-[1.0625rem] leading-snug";

export function NarrativeStream({
  reveal,
  cinemaMode,
  playingSentenceIndex,
  caption = false,
  onSkip,
}: NarrativeStreamProps) {
  const reduceMotion = useReducedMotion();
  const shown = caption ? reveal.visible.slice(-1) : reveal.visible;
  const offset = caption ? reveal.visible.length - shown.length : 0;

  function skip(): void {
    reveal.revealAll();
    onSkip?.();
  }

  return (
    <div className={`relative flex flex-col ${caption ? "gap-0" : "gap-3"}`}>
      {shown.map((sentence, position) => {
        const index = offset + position;
        const live = index === reveal.visible.length - 1;
        const emphasised = (cinemaMode && index === playingSentenceIndex) || (live && caption);
        return (
          <motion.p
            key={sentence.key}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`${caption ? CAPTION : PASSAGE} ${
              emphasised ? "text-text-primary" : "text-text-secondary"
            }`}
          >
            {sentence.text}
            {live && reveal.isTyping ? (
              <span
                aria-hidden="true"
                className="ml-0.5 inline-block w-0.5 animate-pulse bg-primary"
              >
                &nbsp;
              </span>
            ) : null}
          </motion.p>
        );
      })}

      {reveal.isComplete || caption ? null : (
        <>
          <p aria-hidden="true" className="pt-1 text-xs text-text-muted">
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
