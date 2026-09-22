import { API } from "@chronicle/config";
import type { ComposeContext, ComposeMode, Pronouns } from "@chronicle/utils";
import {
  ArrowTurnBackwardIcon,
  PaintBrush01Icon,
  Upload04Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ChangeEvent, useCallback, useRef, useState } from "react";
import { ComposableField } from "~/components/common/ComposableField";
import { PreviewableImage } from "~/components/common/PreviewableImage";
import { Spinner } from "~/components/common/Spinner";
import { Button } from "~/components/ui/button";
import { GroupLabel } from "~/components/ui/label";
import { Tooltip } from "~/components/ui/tooltip";
import type { Compose } from "~/hooks/useCompose";
import { useImagePoll } from "~/hooks/useImagePoll";
import { post, putBytes, remove } from "~/lib/api";
import type { CharacterSummary } from "~/lib/entities";

export interface CharacterLookDraft {
  name: string;
  pronouns: Pronouns;
  bio: string;
  appearance: string;
  outfit: string;
}

export interface PortraitPanelProps {
  existing: CharacterSummary | null;
  worldId: string | null;
  compose: Compose;
  describe: () => Partial<ComposeContext>;
  liveValues: () => CharacterLookDraft;
}

export function PortraitPanel({
  existing,
  worldId,
  compose,
  describe,
  liveValues,
}: PortraitPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [awaiting, setAwaiting] = useState<{ since: string | null } | null>(null);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [discarded, setDiscarded] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const selectDraft = useCallback(
    (entity: CharacterSummary) => entity.draftPortraitUrl ?? entity.portraitUrl,
    [],
  );
  const known = existing?.portraitUrl ?? null;
  const watching = existing !== null && (known === null || awaiting !== null);
  const poll = useImagePoll<CharacterSummary>(
    watching ? `${API.characters}/${existing.id}` : null,
    selectDraft,
    awaiting?.since ?? null,
  );

  const stored = discarded ? null : (existing?.draftPortraitUrl ?? null);
  const drafted = discarded ? null : (uploaded ?? poll.url);
  const portrait = drafted ?? stored ?? known;
  const painting = poll.pending;
  const unsaved = drafted !== null || stored !== null;

  async function fill(mode: ComposeMode): Promise<void> {
    const value = await compose.run(
      "character.portrait",
      mode,
      { ...describe(), portraitPrompt: prompt },
      worldId,
    );
    if (value !== null) setPrompt(value);
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file === undefined || existing === null) return;
    setError(null);
    setUploading(true);
    try {
      const saved = await putBytes<{ draftPortraitUrl: string }>(
        `${API.characters}/${existing.id}/portrait`,
        file,
      );
      setUploaded(saved.draftPortraitUrl);
      setDiscarded(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That portrait could not be uploaded.");
    } finally {
      setUploading(false);
    }
  }

  async function discardDraft(): Promise<void> {
    if (existing === null) return;
    setError(null);
    try {
      await remove(`${API.characters}/${existing.id}/portrait/draft`);
      setUploaded(null);
      setAwaiting(null);
      setDiscarded(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That draft could not be discarded.");
    }
  }

  async function regenerate(): Promise<void> {
    if (existing === null) return;
    setError(null);
    try {
      const trimmed = prompt.trim();
      await post(`${API.characters}/${existing.id}/portrait`, {
        ...liveValues(),
        ...(trimmed.length > 0 ? { prompt: trimmed } : {}),
      });
      setAwaiting({ since: portrait });
      setDiscarded(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The portrait could not be requested.");
    }
  }

  return (
    <section className="flex flex-col gap-2.5">
      <GroupLabel>Portrait</GroupLabel>

      <div className="flex items-stretch gap-4 rounded-card border-(length:--border-width-card) border-card-border bg-card p-3.5">
        {portrait === null ? (
          <span className="flex w-24 shrink-0 animate-pulse items-center justify-center self-stretch rounded-control bg-secondary text-text-muted">
            <HugeiconsIcon
              icon={painting ? PaintBrush01Icon : UserIcon}
              size={24}
              strokeWidth={1.75}
            />
          </span>
        ) : (
          <span className="relative w-24 shrink-0 self-stretch">
            <PreviewableImage
              imageUrl={portrait}
              alt="the portrait"
              downloadName={`${existing?.name ?? "character"} portrait`}
              className="h-full w-full rounded-control"
            />
            {painting ? (
              <span className="absolute inset-0 flex items-center justify-center rounded-control bg-scrim/70 backdrop-blur-sm">
                <Spinner size={16} label="Painting the portrait" />
              </span>
            ) : null}
          </span>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <ComposableField
            id="portrait-prompt"
            actionNoun="portrait prompt"
            ariaLabel="Portrait prompt"
            value={prompt}
            rows={3}
            placeholder="Leave blank to draw from the backstory, or describe the look you want."
            busyMode={compose.modeFor("character.portrait")}
            onChange={setPrompt}
            onCompose={(mode) => void fill(mode)}
          />

          {existing === null ? (
            <p className="text-[0.6875rem] leading-relaxed text-text-muted">
              The portrait is painted once the character is created.
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void regenerate()}
                disabled={painting || uploading}
                className="min-w-0 flex-1 text-text-accent"
              >
                {painting ? (
                  <Spinner size={13} label="Painting the portrait" />
                ) : (
                  <HugeiconsIcon icon={PaintBrush01Icon} size={15} strokeWidth={2} />
                )}
                <span className="truncate">{painting ? "Painting…" : "Paint portrait"}</span>
              </Button>

              <Tooltip content="Upload your own portrait">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInput.current?.click()}
                  disabled={painting || uploading}
                  aria-label="Upload a portrait image"
                  className="text-text-accent hover:border-primary/50 hover:text-text-accent"
                >
                  {uploading ? (
                    <Spinner size={13} label="Uploading the portrait" />
                  ) : (
                    <HugeiconsIcon icon={Upload04Icon} size={15} strokeWidth={2} />
                  )}
                </Button>
              </Tooltip>

              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => void chooseFile(event)}
                className="hidden"
                tabIndex={-1}
              />
            </div>
          )}
        </div>
      </div>

      {unsaved && !painting ? (
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 text-[0.6875rem] leading-relaxed text-text-muted">
            This portrait is a draft. Save the character to keep it.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void discardDraft()}
            className="shrink-0 gap-1.5 text-text-muted hover:text-text-primary"
          >
            <HugeiconsIcon icon={ArrowTurnBackwardIcon} size={14} strokeWidth={1.5} />
            Discard
          </Button>
        </div>
      ) : null}

      {error === null ? null : (
        <p role="alert" className="text-[0.75rem] text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
