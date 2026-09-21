import { API } from "@chronicle/config";
import { PaintBrush01Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback } from "react";
import { PreviewableImage } from "~/components/common/PreviewableImage";
import { Tooltip } from "~/components/ui/tooltip";
import { useImagePoll } from "~/hooks/useImagePoll";
import type { WorldSummary } from "~/lib/entities";

export interface WorldCardProps {
  world: WorldSummary;
  index: number;
  onOpen: () => void;
  onEdit?: (() => void) | undefined;
}

export function WorldCard({ world, index, onOpen, onEdit }: WorldCardProps) {
  const selectCover = useCallback((entity: WorldSummary) => entity.coverImageUrl, []);
  const poll = useImagePoll<WorldSummary>(
    world.coverImageUrl === null ? `${API.worlds}/${world.id}` : null,
    selectCover,
  );
  const cover = world.coverImageUrl ?? poll.url;

  return (
    <article
      style={{ ["--rise-index" as string]: index }}
      className="raise rise-in relative flex flex-col overflow-hidden rounded-card border-(length:--border-width-card) border-card-border bg-card"
    >
      {cover === null ? (
        <div className="flex h-40 w-full animate-pulse items-center justify-center gap-2 bg-secondary text-text-muted">
          <HugeiconsIcon icon={PaintBrush01Icon} size={16} strokeWidth={1.5} />
          <span className="text-[0.75rem]">Painting the cover…</span>
        </div>
      ) : (
        <PreviewableImage
          imageUrl={cover}
          alt={`the cover of ${world.title}`}
          downloadName={`${world.title} cover`}
          className="h-40 w-full"
        />
      )}

      {onEdit === undefined ? null : (
        <Tooltip content="Edit world">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${world.title}`}
            className="pressable absolute top-2 right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-control border-(length:--border-width-card) border-card-border bg-card/80 text-text-secondary backdrop-blur-sm"
          >
            <HugeiconsIcon icon={PencilEdit02Icon} size={16} strokeWidth={1.5} />
          </button>
        </Tooltip>
      )}

      <button
        type="button"
        onClick={onOpen}
        className="pressable flex flex-1 cursor-pointer flex-col gap-2 p-4 text-left"
      >
        <span className="flex w-full items-start justify-between gap-3">
          <span className="min-w-0 flex-1 text-[1.0625rem] font-semibold tracking-[-0.01em] text-text-primary">
            {world.title}
          </span>
          {world.genre.length > 0 ? (
            <span className="shrink-0 rounded-control bg-primary/15 px-2 py-1 text-[0.625rem] font-medium tracking-widest text-text-accent uppercase">
              {world.genre}
            </span>
          ) : null}
        </span>
        <span className="line-clamp-3 text-[0.8125rem] leading-relaxed text-text-secondary">
          {world.description}
        </span>
      </button>
    </article>
  );
}
