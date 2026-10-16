import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useReducedMotion } from "~/hooks/useReducedMotion";
import type { CharacterSummary } from "~/lib/entities";
import { useCast } from "./CastContext";
import type { RevealedSentence } from "./useSentenceReveal";

export interface PassageProps {
  sentences: readonly RevealedSentence[];
  textClass: string;
  emphasisedIndex?: number | null;
  cursorIndex?: number | null;
  animate?: boolean;
}

interface Run {
  speakerId: string | null;
  start: number;
  sentences: RevealedSentence[];
}

function groupRuns(sentences: readonly RevealedSentence[]): Run[] {
  const runs: Run[] = [];
  sentences.forEach((sentence, index) => {
    const last = runs.at(-1);
    if (last !== undefined && last.speakerId === sentence.speakerId) {
      last.sentences.push(sentence);
      return;
    }
    runs.push({ speakerId: sentence.speakerId, start: index, sentences: [sentence] });
  });
  return runs;
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("");
}

export function SpeakerChip({ speaker }: { speaker: CharacterSummary }) {
  return (
    <span className="flex items-center gap-1.5">
      <Avatar className="size-5 rounded-control border-hairline">
        <AvatarImage src={speaker.portraitUrl ?? undefined} alt="" className="object-cover" />
        <AvatarFallback className="text-[0.5rem] font-bold">
          {initialsOf(speaker.name)}
        </AvatarFallback>
      </Avatar>
      <span className="text-[0.6875rem] font-semibold tracking-[0.08em] text-text-accent uppercase">
        {speaker.name}
      </span>
    </span>
  );
}

export function Passage({
  sentences,
  textClass,
  emphasisedIndex = null,
  cursorIndex = null,
  animate = true,
}: PassageProps) {
  const cast = useCast();
  const reduceMotion = useReducedMotion();
  const runs = groupRuns(sentences);

  return (
    <div className="flex flex-col gap-3">
      {runs.map((run) => {
        const speaker = cast.find((member) => member.id === run.speakerId);
        const lines = run.sentences.map((sentence, offset) => {
          const index = run.start + offset;
          const emphasised = index === emphasisedIndex;
          return (
            <motion.span
              key={sentence.key}
              initial={animate && !reduceMotion ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className={emphasised ? "text-text-primary" : undefined}
            >
              {offset > 0 ? " " : ""}
              {sentence.text}
              {index === cursorIndex ? (
                <span
                  aria-hidden="true"
                  className="ml-0.5 inline-block w-0.5 animate-pulse bg-primary"
                >
                  &nbsp;
                </span>
              ) : null}
            </motion.span>
          );
        });

        if (speaker === undefined) {
          return (
            <p key={run.sentences[0]?.key} className={textClass}>
              {lines}
            </p>
          );
        }
        return (
          <div
            key={run.sentences[0]?.key}
            className="flex flex-col gap-1 border-l-2 border-primary/40 pl-3"
          >
            <SpeakerChip speaker={speaker} />
            <p className={`${textClass} italic`}>{lines}</p>
          </div>
        );
      })}
    </div>
  );
}
