import {
  IMAGE_ENGINE_IDS,
  IMAGE_ENGINES,
  type ImageEngineId,
  type RuntimeSettings,
  type RuntimeSettingsPatch,
  SETTING_BOUNDS,
} from "@chronicle/config";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "~/components/ui/button";
import { DiffusionPresets } from "./DiffusionPresets";
import { fieldMeta } from "./fields";
import { SettingRow } from "./SettingRow";

export interface ImageGroupProps {
  image: RuntimeSettings["image"];
  onUpdate: (patch: RuntimeSettingsPatch) => void;
}

function EnginePicker({
  title,
  blurb,
  engine,
  onSelect,
}: {
  title: string;
  blurb: string;
  engine: ImageEngineId;
  onSelect: (engine: ImageEngineId) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-card border-(length:--border-width-card) border-hairline bg-raised px-4 py-3.5">
      <div>
        <p className="text-[0.875rem] font-medium tracking-[-0.01em] text-text-primary">{title}</p>
        <p className="mt-0.5 text-[0.75rem] leading-relaxed text-text-muted">{blurb}</p>
      </div>
      <div className="mt-1 grid gap-2 sm:grid-cols-2">
        {IMAGE_ENGINE_IDS.map((id) => {
          const option = IMAGE_ENGINES[id];
          const selected = id === engine;
          return (
            <Button
              key={id}
              variant="outline"
              aria-pressed={selected}
              onClick={() => onSelect(id)}
              className={`h-auto flex-col items-start gap-1 rounded-control px-3.5 py-3 text-left font-normal whitespace-normal ${
                selected ? "border-primary/40 bg-primary/[0.07] hover:border-primary/40" : ""
              }`}
            >
              <span className="flex items-center gap-1.5 text-[0.8125rem] font-semibold text-text-primary">
                {option.label}
                {selected ? (
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    size={14}
                    strokeWidth={2}
                    className="text-text-accent"
                  />
                ) : null}
              </span>
              <span className="text-[0.75rem] leading-relaxed text-text-muted">{option.blurb}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function EngineFields({
  engine,
  image,
  onUpdate,
}: {
  engine: ImageEngineId;
  image: RuntimeSettings["image"];
  onUpdate: (patch: RuntimeSettingsPatch) => void;
}) {
  const fields = image[engine] as Record<string, number | boolean | string>;
  return (
    <div className="flex flex-col gap-2">
      <p className="px-1 pt-2 text-[0.6875rem] font-semibold tracking-[0.08em] text-text-muted uppercase">
        {IMAGE_ENGINES[engine].label}
      </p>
      {engine === "sdxl" ? (
        <DiffusionPresets
          sdxl={image.sdxl}
          onApply={(values) => onUpdate({ image: { sdxl: values } })}
        />
      ) : null}
      {Object.entries(fields).map(([field, value]) => (
        <SettingRow
          key={`${engine}-${field}`}
          field={field}
          meta={fieldMeta(`image.${engine}`, field)}
          value={value}
          bound={IMAGE_ENGINES[engine].bounds[field]}
          onChange={(next) => onUpdate({ image: { [engine]: { [field]: next } } })}
        />
      ))}
    </div>
  );
}

export function ImageGroup({ image, onUpdate }: ImageGroupProps) {
  const inUse = IMAGE_ENGINE_IDS.filter((id) => id === image.engine || id === image.portraitEngine);

  return (
    <>
      <EnginePicker
        title="Scenes and covers"
        blurb="Every turn's illustration and each world's cover."
        engine={image.engine}
        onSelect={(next) => onUpdate({ image: { engine: next } })}
      />
      <EnginePicker
        title="Portraits"
        blurb="Authors each character's face, which scenes then reference."
        engine={image.portraitEngine}
        onSelect={(next) => onUpdate({ image: { portraitEngine: next } })}
      />
      <SettingRow
        field="quality"
        meta={fieldMeta("image", "quality")}
        value={image.quality}
        bound={SETTING_BOUNDS.image.quality}
        onChange={(next) => onUpdate({ image: { quality: Number(next) } })}
      />
      {inUse.map((engine) => (
        <EngineFields key={engine} engine={engine} image={image} onUpdate={onUpdate} />
      ))}
    </>
  );
}
