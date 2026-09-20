import { useState } from "react";
import { ImageViewer } from "~/components/common/ImageViewer";
import { assetUrl } from "~/lib/assets";
import { cn } from "~/lib/utils";

export interface PreviewableImageProps {
  imageUrl: string;
  alt: string;
  className?: string;
  imageClassName?: string;
}

export function PreviewableImage({
  imageUrl,
  alt,
  className,
  imageClassName,
}: PreviewableImageProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Preview ${alt}`}
        className={cn(
          "block cursor-pointer overflow-hidden",
          "focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
          className,
        )}
      >
        <img
          src={assetUrl(imageUrl)}
          alt=""
          loading="lazy"
          className={cn("h-full w-full object-cover", imageClassName)}
        />
      </button>

      <ImageViewer imageUrl={imageUrl} alt={alt} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
