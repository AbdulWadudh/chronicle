import type { TurnNode } from "@chronicle/utils";
import { HierarchyIcon } from "@hugeicons/core-free-icons";
import { lazy, Suspense } from "react";
import { EmptyState } from "~/components/common/EmptyState";
import { ErrorBoundary } from "~/components/common/ErrorBoundary";
import { Spinner } from "~/components/common/Spinner";
import { Sheet } from "~/components/ui/sheet";
import { useElementSize } from "~/hooks/useElementSize";

const FlowchartCanvas = lazy(async () => {
  const module = await import("~/components/canvas/flowchart");
  return { default: module.FlowchartCanvas };
});

export interface StoryMapModalProps {
  visible: boolean;
  turns: readonly TurnNode[];
  activeTurnId: string | null;
  onClose: () => void;
}

export function StoryMapModal({ visible, turns, activeTurnId, onClose }: StoryMapModalProps) {
  const [frame, size] = useElementSize<HTMLDivElement>();
  const ready = size.width > 0 && size.height > 0;

  return (
    <Sheet
      open={visible}
      storageKey="story-map"
      icon={HierarchyIcon}
      title="Story map"
      subtitle="Every turn you have taken, and where it branched"
      onClose={onClose}
    >
      {turns.length === 0 ? (
        <EmptyState
          icon={HierarchyIcon}
          title="No branches yet"
          body="Every choice you make adds a node here. Take your first action to begin the map."
          compact
        />
      ) : (
        <ErrorBoundary
          label="the story map"
          fallback={
            <EmptyState
              icon={HierarchyIcon}
              title="The story map could not load"
              body="Your story is unaffected. Close this and reopen it to try again."
              compact
            />
          }
        >
          <div ref={frame} className="min-h-72 min-w-0 flex-1 overflow-hidden rounded-card">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center text-text-muted">
                  <Spinner label="Loading the story map" />
                </div>
              }
            >
              {ready ? (
                <FlowchartCanvas
                  turns={turns}
                  activeTurnId={activeTurnId}
                  width={size.width}
                  height={size.height}
                />
              ) : null}
            </Suspense>
          </div>
        </ErrorBoundary>
      )}
    </Sheet>
  );
}
