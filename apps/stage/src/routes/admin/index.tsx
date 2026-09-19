import { RUNTIME_SETTING_GROUPS, SETTING_BOUNDS, type SettingBound } from "@chronicle/shared";
import { CheckmarkCircle02Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "react-router";
import { BackButton } from "~/components/common/BackButton";
import { PageHeader } from "~/components/common/PageHeader";
import { Screen } from "~/components/common/Screen";
import { SettingsGroup } from "~/components/common/SettingsGroup";
import { Spinner } from "~/components/common/Spinner";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
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
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6875rem] ${
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

export function Admin() {
  const navigate = useNavigate();
  const { settings, status, error, update, reset } = useSettings();
  const back = <BackButton onPress={() => void navigate(-1)} />;

  if (settings === null) {
    return (
      <Screen width="wide">
        <PageHeader title="Runtime settings" leading={back} />
        <div className="flex flex-1 items-center justify-center text-text-muted">
          {error === null ? (
            <Spinner size={22} label="Loading settings" />
          ) : (
            <p role="alert" className="text-danger">
              {error}
            </p>
          )}
        </div>
      </Screen>
    );
  }

  return (
    <Screen width="wide">
      <PageHeader
        title="Runtime settings"
        leading={back}
        trailing={
          <div className="flex items-center gap-2">
            <SaveStatus status={status} />
            <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
              <HugeiconsIcon icon={RefreshIcon} size={13} strokeWidth={1.5} />
              Defaults
            </Button>
          </div>
        }
      />

      {error !== null ? (
        <p role="alert" className="mb-3 shrink-0 text-[0.75rem] text-danger">
          {error}
        </p>
      ) : null}

      <ScrollArea className="-mr-3 min-h-0 flex-1 pr-3">
        <div className="flex flex-col gap-4 pb-8">
          {RUNTIME_SETTING_GROUPS.map((group, index) => (
            <SettingsGroup key={group} meta={GROUP_META[group]} index={index}>
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
        </div>
      </ScrollArea>
    </Screen>
  );
}
