import { PaintBrush01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { PreviewableImage } from "~/components/common/PreviewableImage";
import type { WorldDetail } from "~/lib/entities";

export interface WorldBriefProps {
  world: WorldDetail;
}

export function WorldBrief({ world }: WorldBriefProps) {
  const opening = world.initialStateJson.summary.trim();

  return (
    <section className="mb-5 flex shrink-0 flex-col overflow-hidden rounded-card border-(length:--border-width-card) border-card-border bg-card">
      <div className="relative h-36 w-full sm:h-44">
        {world.coverImageUrl === null ? (
          <div className="flex h-full w-full animate-pulse items-center justify-center gap-2 bg-secondary text-text-muted">
            <HugeiconsIcon icon={PaintBrush01Icon} size={16} strokeWidth={1.5} />
            <span className="text-[0.75rem]">Painting the cover…</span>
          </div>
        ) : (
          <PreviewableImage
            imageUrl={world.coverImageUrl}
            alt={`the cover of ${world.title}`}
            className="h-full w-full"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4">
          <p className="text-[0.625rem] font-medium uppercase tracking-[0.14em] text-text-accent">
            {world.genre}
          </p>
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-text-primary">
            {world.title}
          </h2>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <p className="text-[0.8125rem] leading-relaxed text-text-secondary">{world.description}</p>

        {opening.length > 0 ? (
          <div className="flex gap-3 rounded-control bg-raised p-3.5">
            <span className="mt-0.5 w-0.5 shrink-0 rounded-full bg-primary/70" />
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-[0.625rem] font-medium uppercase tracking-[0.14em] text-text-muted">
                Your story opens here
              </p>
              <p className="text-[0.8125rem] italic leading-relaxed text-text-secondary">
                {opening}
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[0.625rem] font-medium uppercase tracking-[0.14em] text-text-muted">
              What the dice test here
            </p>
            <p className="flex items-center gap-1.5 text-[0.6875rem] text-text-accent">
              <HugeiconsIcon icon={SparklesIcon} size={12} strokeWidth={1.75} />
              {world.pointBudget} points to spend
            </p>
          </div>
          <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
            {world.statDefinitionsJson.map((definition) => (
              <li
                key={definition.id}
                className="rounded-control border-(length:--border-width-card) border-hairline bg-raised px-3 py-2.5"
              >
                <p className="text-[0.8125rem] font-medium text-text-primary">{definition.label}</p>
                {definition.description.length > 0 ? (
                  <p className="text-[0.6875rem] leading-relaxed text-text-muted">
                    {definition.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
