import { Cancel01Icon, Download04Icon, LinkSquare02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Tooltip } from "~/components/ui/tooltip";
import { usePanZoom, type Viewport } from "~/hooks/usePanZoom";
import { API, directorOrigin } from "~/lib/api";
import { assetUrl } from "~/lib/assets";
import { readToken } from "~/lib/session";

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const WHEEL_SENSITIVITY = 0.0015;

export interface ImageViewerProps {
  imageUrl: string | null;
  alt: string;
  open: boolean;
  downloadName?: string;
  onClose: () => void;
}

function extensionOf(imageUrl: string): string {
  const path = imageUrl.split("?")[0] ?? imageUrl;
  return path.split(".").pop()?.toLowerCase() ?? "png";
}

export function filenameOf(imageUrl: string, downloadName?: string): string {
  if (downloadName === undefined || downloadName.trim().length === 0) {
    const path = imageUrl.split("?")[0] ?? imageUrl;
    return path.split("/").pop() ?? "chronicle.png";
  }
  const slug = downloadName
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "_")
    .replace(/^_+|_+$/gu, "")
    .slice(0, 60)
    .replace(/_+$/u, "");
  return `${slug.length > 0 ? slug : "chronicle"}.${extensionOf(imageUrl)}`;
}

type OverlayTone = "accent" | "danger";

const TONE: Record<OverlayTone, string> = {
  accent: "text-text-accent hover:border-primary/60",
  danger: "text-danger hover:border-danger/60",
};

interface OverlayActionProps {
  icon: IconSvgElement;
  label: string;
  tone: OverlayTone;
  onPress: () => void;
}

function OverlayAction({ icon, label, tone, onPress }: OverlayActionProps) {
  return (
    <Tooltip content={label}>
      <button
        type="button"
        onClick={onPress}
        aria-label={label}
        className={`pressable flex h-10 w-10 items-center justify-center rounded-control border-(length:--border-width-card) border-hairline-strong bg-transparent backdrop-blur-md ${TONE[tone]}`}
      >
        <HugeiconsIcon icon={icon} size={17} strokeWidth={2} />
      </button>
    </Tooltip>
  );
}

export function ImageViewer({ imageUrl, alt, open, downloadName, onClose }: ImageViewerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const clamp = useCallback((next: Viewport): Viewport => {
    const element = frame.current;
    if (element === null) return next;
    const spareX = element.clientWidth * (1 - next.scale);
    const spareY = element.clientHeight * (1 - next.scale);
    return {
      scale: next.scale,
      x: Math.min(0, Math.max(spareX, next.x)),
      y: Math.min(0, Math.max(spareY, next.y)),
    };
  }, []);

  const zoomOptions = useMemo(() => ({ minScale: MIN_SCALE, maxScale: MAX_SCALE, clamp }), [clamp]);

  const { viewport, zoomBy, reset, onPointerDown, onPointerMove, onPointerUp } =
    usePanZoom(zoomOptions);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return;
    if (open && !dialog.open) {
      reset();
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, reset]);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return;
    const dismiss = (event: MouseEvent): void => {
      if (event.target === dialog) onClose();
    };
    dialog.addEventListener("click", dismiss);
    return () => dialog.removeEventListener("click", dismiss);
  }, [onClose]);

  useEffect(() => {
    const element = frame.current;
    if (element === null || !open) return;
    const onWheel = (event: WheelEvent): void => {
      event.preventDefault();
      const bounds = element.getBoundingClientRect();
      zoomBy(Math.exp(-event.deltaY * WHEEL_SENSITIVITY), {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [open, zoomBy]);

  async function download(): Promise<void> {
    if (imageUrl === null) return;
    setError(null);
    try {
      const token = readToken();
      const proxied = `${directorOrigin()}${API.assets}?url=${encodeURIComponent(imageUrl)}`;
      const response = await fetch(proxied, {
        headers: token === null ? undefined : { authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`The image server answered ${response.status}`);
      const href = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = filenameOf(imageUrl, downloadName);
      anchor.click();
      URL.revokeObjectURL(href);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? `${cause.message}. Open the original instead.`
          : "That download failed. Open the original instead.",
      );
    }
  }

  const zoomed = viewport.scale > 1;

  return (
    <dialog
      ref={ref}
      aria-label={alt.length > 0 ? alt : "Image preview"}
      onClose={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="hidden h-full max-h-none w-full max-w-none items-center justify-center overflow-hidden bg-transparent p-6 backdrop:bg-scrim backdrop:backdrop-blur-sm open:flex"
    >
      {imageUrl === null ? null : (
        <div className="group relative flex max-h-full flex-col items-center gap-3">
          <div
            ref={frame}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className={`inline-flex touch-none overflow-hidden rounded-card border-(length:--border-width-card) border-card-border ${
              zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-default"
            }`}
          >
            <img
              src={assetUrl(imageUrl)}
              alt={alt}
              draggable={false}
              style={{
                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
              }}
              className="max-h-[82dvh] max-w-full origin-top-left object-contain select-none"
            />
          </div>

          <div className="absolute top-3 right-3 flex gap-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 has-[:focus-visible]:opacity-100 max-sm:opacity-100 motion-reduce:transition-none">
            <OverlayAction
              icon={LinkSquare02Icon}
              label="Open the original in a new tab"
              tone="accent"
              onPress={() => window.open(assetUrl(imageUrl), "_blank")}
            />
            <OverlayAction
              icon={Download04Icon}
              label="Download"
              tone="accent"
              onPress={() => void download()}
            />
            <OverlayAction icon={Cancel01Icon} label="Close" tone="danger" onPress={onClose} />
          </div>

          {error === null ? null : (
            <p
              role="alert"
              className="rounded-control bg-card px-3 py-2 text-[0.75rem] text-danger"
            >
              {error}
            </p>
          )}
        </div>
      )}
    </dialog>
  );
}
