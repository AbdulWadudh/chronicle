import { API } from "@chronicle/config";
import { PaintBrush01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useState } from "react";
import { ComposableField } from "~/components/common/ComposableField";
import { PreviewableImage } from "~/components/common/PreviewableImage";
import { Spinner } from "~/components/common/Spinner";
import { Button } from "~/components/ui/button";
import { Tooltip } from "~/components/ui/tooltip";
import { useCompose } from "~/hooks/useCompose";
import { useImagePoll } from "~/hooks/useImagePoll";
import { post } from "~/lib/api";
import type { WorldSummary } from "~/lib/entities";

export interface WorldCoverPanelProps {
  worldId: string;
  title: string;
  genre: string;
  description: string;
  coverImageUrl: string | null;
}

export function WorldCoverPanel({
  worldId,
  title,
  genre,
  description,
  coverImageUrl,
}: WorldCoverPanelProps) {
  const compose = useCompose();
  const [coverPrompt, setCoverPrompt] = useState("");
  const [supersededUrl, setSupersededUrl] = useState<string | null>(null);
  const [queueing, setQueueing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectCover = useCallback((world: WorldSummary) => world.coverImageUrl, []);
  const watching = coverImageUrl === null || supersededUrl !== null;
  const poll = useImagePoll<WorldSummary>(
    watching ? `${API.worlds}/${worldId}` : null,
    selectCover,
    supersededUrl,
  );

  const cover = poll.url ?? coverImageUrl;
  const painting = poll.pending || queueing;

  async function repaint(): Promise<void> {
    setQueueing(true);
    setError(null);
    try {
      const trimmed = coverPrompt.trim();
      await post(`${API.worlds}/${worldId}/cover`, trimmed.length > 0 ? { prompt: trimmed } : {});
      setSupersededUrl(cover);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That cover could not be queued.");
    } finally {
      setQueueing(false);
    }
  }

  async function draftPrompt(mode: "generate" | "enhance"): Promise<void> {
    const value = await compose.run(
      "world.cover",
      mode,
      { title, genre, description, coverPrompt },
      worldId,
    );
    if (value !== null) setCoverPrompt(value);
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-card border-(length:--border-width-card) border-card-border bg-sunken">
        {cover === null ? (
          <div className="flex aspect-[3/2] w-full items-center justify-center bg-secondary" />
        ) : (
          <PreviewableImage
            imageUrl={cover}
            alt={`the cover of ${title}`}
            downloadName={`${title} cover`}
            className="aspect-[3/2] w-full"
          />
        )}

        {painting ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-scrim/70 backdrop-blur-sm">
            <Spinner size={18} label="Painting the cover" />
            <span className="text-[0.75rem] text-text-secondary">Painting a new cover…</span>
          </div>
        ) : null}

        <Tooltip content={cover === null ? "Paint the cover" : "Regenerate the cover"}>
          <Button
            variant="outline"
            size="icon"
            onClick={() => void repaint()}
            disabled={painting}
            aria-label={cover === null ? "Paint the cover" : "Regenerate the cover"}
            className="absolute right-2 bottom-2 border-card-border bg-card/80 text-text-accent backdrop-blur-sm"
          >
            <HugeiconsIcon icon={PaintBrush01Icon} size={15} strokeWidth={1.5} />
          </Button>
        </Tooltip>
      </div>

      <ComposableField
        id="world-cover-prompt"
        label="Cover prompt"
        actionNoun="cover prompt"
        value={coverPrompt}
        rows={2}
        placeholder="Leave blank to draw from the description and art direction"
        hint="Write or draft the exact image prompt for this cover, then regenerate."
        busyMode={compose.modeFor("world.cover")}
        onChange={setCoverPrompt}
        onCompose={(mode) => void draftPrompt(mode)}
      />

      {(error ?? compose.error) === null ? null : (
        <p role="alert" className="text-[0.75rem] text-danger">
          {error ?? compose.error}
        </p>
      )}
    </section>
  );
}
