import { motion } from "motion/react";
import { useReducedMotion } from "~/hooks/useReducedMotion";
import { useSentenceReveal } from "./useSentenceReveal";

export interface NarrativeStreamProps {
  text: string;
  cinemaMode: boolean;
  playingSentenceIndex: number | null;
  onSkip?: () => void;
}

export function NarrativeStream({
  text,
  cinemaMode,
  playingSentenceIndex,
  onSkip,
}: NarrativeStreamProps) {
  const reduceMotion = useReducedMotion();
  const reveal = useSentenceReveal(text, cinemaMode, playingSentenceIndex);

  function skip(): void {
    reveal.revealAll();
    onSkip?.();
  }

  return (
    <div className="relative flex flex-col gap-2 rounded-(--radius-card) border-(length:--border-width-card) border-card-border bg-card p-5">
      {reveal.sentences.slice(0, reveal.revealedCount).map((sentence, index) => (
        <motion.p
          key={sentence.key}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className={
            cinemaMode && index === playingSentenceIndex
              ? "text-base leading-(--leading-narrative) text-text-primary"
              : "text-base leading-(--leading-narrative) text-text-secondary"
          }
        >
          {sentence.text}
        </motion.p>
      ))}

      {reveal.isComplete ? null : (
        <>
          <p aria-hidden="true" className="pt-1 text-xs text-text-muted">
            Tap to reveal the rest
          </p>
          <button
            type="button"
            onClick={skip}
            aria-label="Reveal the full passage"
            className="absolute inset-0 rounded-(--radius-card)"
          />
        </>
      )}
    </div>
  );
}
