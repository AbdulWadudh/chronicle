import { IMAGE_SHAPES } from "@chronicle/config";
import type { ImageShape, TurnNode } from "@chronicle/utils";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { SceneFrame } from "./SceneFrame";

export interface TurnEntryProps {
  turn: TurnNode;
  painting: boolean;
  percent: number | null;
  focal: boolean;
  sceneActions?: ReactNode;
  sceneCorner?: ReactNode;
  children?: ReactNode;
}

export function aspectOf(shape: ImageShape): number {
  const { width, height } = IMAGE_SHAPES[shape];
  return width / height;
}

export const TURN_GRID =
  "flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,1fr)_17rem] md:items-start md:gap-6";

export function PlayerActionLine({ action, focal }: { action: string; focal: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="flex items-start gap-2.5"
    >
      <span
        className={`mt-1.5 h-4 w-0.5 shrink-0 rounded-full ${focal ? "bg-primary" : "bg-primary/40"}`}
      />
      <p
        className={`flex-1 leading-snug italic ${
          focal ? "text-[0.875rem] text-text-secondary" : "text-[0.8125rem] text-text-muted"
        }`}
      >
        {action}
      </p>
    </motion.div>
  );
}

export function TurnEntry({
  turn,
  painting,
  percent,
  focal,
  sceneActions,
  sceneCorner,
  children,
}: TurnEntryProps) {
  return (
    <article className={TURN_GRID}>
      <div className="md:col-start-2 md:row-start-1">
        <SceneFrame
          imageUrl={turn.sceneImageUrl}
          alt={`Scene from ${turn.playerAction}`}
          aspect={aspectOf(turn.sceneShape)}
          painting={painting}
          percent={percent}
          actions={sceneActions}
          corner={sceneCorner}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-3 md:col-start-1 md:row-start-1">
        <PlayerActionLine action={turn.playerAction} focal={focal} />

        <p
          className={`leading-(--leading-narrative) ${
            focal ? "text-[1.0625rem] text-text-secondary" : "text-[0.9375rem] text-text-muted"
          }`}
        >
          {turn.narrativeText}
        </p>

        {children}
      </div>
    </article>
  );
}
