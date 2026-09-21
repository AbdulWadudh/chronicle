import { API } from "@chronicle/config";
import { pronounPhrase } from "@chronicle/utils";
import { Delete02Icon, Edit02Icon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback } from "react";
import { PreviewableImage } from "~/components/common/PreviewableImage";
import { Button } from "~/components/ui/button";
import { PreviewCard } from "~/components/ui/preview-card";
import { Tooltip } from "~/components/ui/tooltip";
import { useImagePoll } from "~/hooks/useImagePoll";
import type { CharacterSummary } from "~/lib/entities";

export interface CharacterCardProps {
  character: CharacterSummary;
  index: number;
  onPlay: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function Details({ character }: { character: CharacterSummary }) {
  const ranks = Object.entries(character.statsJson);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-[1rem] font-semibold tracking-[-0.01em] text-text-primary">
          {character.name}
        </h3>
        <p className="text-[0.6875rem] text-text-muted">{pronounPhrase(character.pronouns)}</p>
      </div>

      <p className="text-[0.8125rem] leading-relaxed text-text-secondary">{character.bio}</p>

      {ranks.length === 0 ? null : (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-hairline pt-3">
          {ranks.map(([stat, rank]) => (
            <div key={stat} className="flex items-baseline justify-between gap-2">
              <dt className="truncate text-[0.6875rem] text-text-muted">{stat}</dt>
              <dd className="shrink-0 text-[0.75rem] font-medium tabular-nums text-text-accent">
                {rank}/5
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

export function CharacterCard({ character, index, onPlay, onEdit, onDelete }: CharacterCardProps) {
  const selectPortrait = useCallback((entity: CharacterSummary) => entity.portraitUrl, []);
  const poll = useImagePoll<CharacterSummary>(
    character.portraitUrl === null ? `${API.characters}/${character.id}` : null,
    selectPortrait,
  );
  const portrait = character.portraitUrl ?? poll.url;

  return (
    <article
      style={{ ["--rise-index" as string]: index }}
      className="raise rise-in flex h-full flex-col gap-3 rounded-card border-(length:--border-width-card) border-card-border bg-card p-4"
    >
      <div className="flex flex-1 items-start gap-4">
        <PreviewCard
          side="right"
          trigger={
            <div className="aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-control">
              {portrait === null ? (
                <span className="flex h-full w-full animate-pulse items-center justify-center bg-secondary text-text-muted">
                  <HugeiconsIcon icon={UserIcon} size={24} strokeWidth={1.75} />
                </span>
              ) : (
                <PreviewableImage
                  imageUrl={portrait}
                  alt={`the portrait of ${character.name}`}
                  downloadName={`${character.name} portrait`}
                  className="h-full w-full rounded-none border-0"
                />
              )}
            </div>
          }
        >
          <Details character={character} />
        </PreviewCard>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="truncate text-[1.0625rem] font-semibold tracking-[-0.01em] text-text-primary">
            {character.name}
          </h2>
          <p className="line-clamp-4 text-[0.8125rem] leading-relaxed text-text-secondary">
            {character.bio}
          </p>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <Button className="min-w-0 flex-1" onClick={onPlay}>
          <span className="truncate">Play as {character.name}</span>
        </Button>
        <Tooltip content="Edit">
          <Button
            variant="outline"
            size="icon"
            onClick={onEdit}
            aria-label={`Edit ${character.name}`}
            className="text-text-accent hover:border-primary/50 hover:text-text-accent"
          >
            <HugeiconsIcon icon={Edit02Icon} size={16} strokeWidth={2} />
          </Button>
        </Tooltip>
        <Tooltip content="Delete">
          <Button
            variant="outline"
            size="icon"
            onClick={onDelete}
            aria-label={`Delete ${character.name}`}
            className="text-danger hover:border-danger/50 hover:bg-danger/10 hover:text-danger"
          >
            <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />
          </Button>
        </Tooltip>
      </div>
    </article>
  );
}
