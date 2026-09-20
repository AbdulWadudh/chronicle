import { RUNTIME_SETTING_GROUPS, SETTING_BOUNDS, type SettingBound } from "@chronicle/config";
import { CheckmarkCircle02Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "motion/react";
import { SettingsGroup } from "~/components/common/SettingsGroup";
import { Spinner } from "~/components/common/Spinner";
import { Button } from "~/components/ui/button";
import { AdminScreen } from "./AdminScreen";
import { DiffusionPresets } from "./DiffusionPresets";
import { fieldMeta, GROUP_META } from "./fields";
import { SettingRow } from "./SettingRow";
import { useSettings } from "./useSettings";

type BoundTable = Record<string, Record<string, SettingBound>>;

function boundFor(group: string, field: string): SettingBound | undefined {
  return (SETTING_BOUNDS as BoundTable)[group]?.[field];
}

function SaveStatus({ status }: { status: ReturnType<typeof useSettings>["status"] }) {
  return (
    <AnimatePresence mode="wait">
      {status === "idle" ? null : (
        <motion.span
          key={status}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.18 }}
          aria-live="polite"
          className={`flex items-center gap-1.5 rounded-(--radius-control) border px-2.5 py-1 text-[0.6875rem] ${
            status === "failed"
              ? "border-danger/30 bg-danger/10 text-danger"
              : "border-success/25 bg-success/10 text-success"
          }`}
        >
          {status === "saving" ? (
            <Spinner size={11} label="Saving" />
          ) : status === "saved" ? (
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} strokeWidth={2} />
          ) : null}
          {status === "saving" ? "Saving" : status === "saved" ? "Saved" : "Not saved"}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export function Runtime() {
  const { settings, status, error, update, reset } = useSettings();

  return (
    <AdminScreen
      title="Runtime settings"
      blurb="Stored on the director and shared by every session. Saved as you change them."
      loading={settings === null && error === null}
      error={error}
      trailing={
        settings === null ? null : (
          <div className="flex items-center gap-2">
            <SaveStatus status={status} />
            <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
              <HugeiconsIcon icon={RefreshIcon} size={13} strokeWidth={1.5} />
              Defaults
            </Button>
          </div>
        )
      }
    >
      {settings === null
        ? null
        : RUNTIME_SETTING_GROUPS.map((group, index) => (
            <SettingsGroup key={group} meta={GROUP_META[group]} index={index} defaultOpen={false}>
              {group === "image" ? (
                <DiffusionPresets
                  image={settings.image}
                  onApply={(values) => update({ image: values })}
                />
              ) : null}

              {Object.entries(settings[group]).map(([field, value]) => (
                <SettingRow
                  key={field}
                  field={field}
                  meta={fieldMeta(group, field)}
                  value={value as number | boolean | string}
                  bound={boundFor(group, field)}
                  onChange={(next) => update({ [group]: { [field]: next } })}
                />
              ))}
            </SettingsGroup>
          ))}
    </AdminScreen>
  );
}
