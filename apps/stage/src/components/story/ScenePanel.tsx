import type { TurnNode } from "@chronicle/utils";
import { HierarchyIcon, ImageNotFound01Icon } from "@hugeicons/core-free-icons";
import { motion } from "motion/react";
import { lazy, Suspense } from "react";
import { EmptyState } from "~/components/common/EmptyState";
import { Spinner } from "~/components/common/Spinner";

export type ScenePanelTab = "scene" | "map";

export interface ScenePanelProps {
  tab: ScenePanelTab;
  onTabChange: (tab: ScenePanelTab) => void;
  imageUrl: string | null;
  turns: readonly TurnNode[];
  activeTurnId: string | null;
  width: number;
  height: number;
}

const FlowchartCanvas = lazy(async () => {
  const module = await import("~/components/canvas/flowchart");
  return { default: module.FlowchartCanvas };
});

const TABS: { key: ScenePanelTab; label: string }[] = [
  { key: "scene", label: "Scene" },
  { key: "map", label: "Story map" },
];

export function ScenePanel({
  tab,
  onTabChange,
  imageUrl,
  turns,
  activeTurnId,
  width,
  height,
}: ScenePanelProps) {
  return (
    <div className="flex flex-1 flex-col gap-3 overflow-hidden">
      <div className="flex gap-1.5" role="tablist" aria-label="Scene panel">
        {TABS.map((option) => (
          <button
            type="button"
            key={option.key}
            role="tab"
            aria-selected={tab === option.key}
            onClick={() => onTabChange(option.key)}
            className={`flex h-8 items-center justify-center rounded-(--radius-control) px-3.5 text-[0.75rem] font-medium ${
              tab === option.key
                ? "bg-primary text-primary-foreground"
                : "border-(length:--border-width-card) border-hairline bg-raised text-text-muted"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-(--radius-card) border-(length:--border-width-card) border-hairline bg-card">
        {tab === "map" ? (
          turns.length === 0 ? (
            <EmptyState
              icon={HierarchyIcon}
              title="No branches yet"
              body="Every choice you make adds a node here. Take your first action to begin the map."
            />
          ) : (
            <Suspense
              fallback={
                <div className="flex flex-1 items-center justify-center text-text-muted">
                  <Spinner label="Loading the story map" />
                </div>
              }
            >
              <FlowchartCanvas
                turns={turns}
                activeTurnId={activeTurnId}
                width={width}
                height={height}
              />
            </Suspense>
          )
        ) : imageUrl === null ? (
          <EmptyState
            icon={ImageNotFound01Icon}
            title="No scene yet"
            body="The first illustration appears once your opening turn finishes rendering."
          />
        ) : (
          <motion.img
            key={imageUrl}
            src={imageUrl}
            alt="Current scene illustration"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>
    </div>
  );
}
