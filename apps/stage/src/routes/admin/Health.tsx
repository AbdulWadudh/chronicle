import type { AdminHealthReport, ServiceProbe, ServiceState } from "@chronicle/utils";
import { Alert02Icon, CheckmarkCircle02Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "motion/react";
import { SettingsGroup } from "~/components/common/SettingsGroup";
import { Button } from "~/components/ui/button";
import { useReducedMotion } from "~/hooks/useReducedMotion";
import { AdminScreen } from "./AdminScreen";
import { useHealth } from "./useHealth";

const GROUP_META = {
  title: "Services",
  blurb: "Live reachability for each backing service, refreshed every 15 seconds.",
  icon: CheckmarkCircle02Icon,
};

const STATE_META: Record<
  ServiceState,
  { label: string; icon: typeof CheckmarkCircle02Icon; tone: string; chip: string }
> = {
  up: {
    label: "Up",
    icon: CheckmarkCircle02Icon,
    tone: "text-success",
    chip: "border-success/25 bg-success/10 text-success",
  },
  down: {
    label: "Down",
    icon: Alert02Icon,
    tone: "text-danger",
    chip: "border-danger/30 bg-danger/10 text-danger",
  },
};

function formatLatency(latencyMs: number | null): string {
  if (latencyMs === null) return "—";
  return latencyMs < 1 ? "<1 ms" : `${latencyMs} ms`;
}

function formatCheckedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function ServiceRow({ service, index }: { service: ServiceProbe; index: number }) {
  const meta = STATE_META[service.state];
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03, ease: "easeOut" }}
      className="flex items-center gap-3 rounded-control border-(length:--border-width-card) border-hairline bg-raised px-3 py-2.5"
    >
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-control border ${meta.chip}`}
      >
        <HugeiconsIcon icon={meta.icon} size={15} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.8125rem] font-medium text-text-primary">{service.name}</span>
        <span className="mt-0.5 block truncate font-mono text-[0.6875rem] text-text-muted">
          {service.detail}
          {service.error !== null ? ` · ${service.error}` : ""}
        </span>
      </span>
      <span className="shrink-0 font-mono text-[0.6875rem] text-text-secondary">
        {formatLatency(service.latencyMs)}
      </span>
      <span
        className={`shrink-0 rounded-control border px-2 py-0.5 text-[0.625rem] font-semibold tracking-[0.06em] uppercase ${meta.chip}`}
      >
        {meta.label}
      </span>
    </motion.div>
  );
}

function HealthBody({ report }: { report: AdminHealthReport }) {
  const overall = STATE_META[report.overall];
  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-card border-(length:--border-width-card) border-hairline bg-card px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span
            className={`flex size-9 items-center justify-center rounded-control border ${overall.chip}`}
          >
            <HugeiconsIcon icon={overall.icon} size={17} strokeWidth={2} />
          </span>
          <div>
            <p className="text-[0.875rem] font-semibold text-text-primary">
              {report.overall === "up" ? "All systems up" : "Some services are down"}
            </p>
            <p className="mt-0.5 text-[0.75rem] text-text-muted">
              {report.up} of {report.total} reachable · checked {formatCheckedAt(report.checkedAt)}
            </p>
          </div>
        </div>
        <span
          className={`rounded-control border px-2.5 py-1 text-[0.6875rem] font-semibold tracking-[0.06em] uppercase ${overall.chip}`}
        >
          {overall.label}
        </span>
      </div>

      <SettingsGroup meta={GROUP_META} index={1} defaultOpen={false}>
        {report.services.map((service, index) => (
          <ServiceRow key={service.id} service={service} index={index} />
        ))}
      </SettingsGroup>
    </>
  );
}

export function Health() {
  const { phase, report, refreshing, reload } = useHealth();

  return (
    <AdminScreen
      title="Health"
      blurb="Live reachability and latency for the LLM, diffusion, TTS, cache, database and storage. Refreshes every 15 seconds."
      loading={phase === "loading"}
      error={
        phase === "unreachable" && report === null
          ? "The director is unreachable. Start it and reload."
          : null
      }
      trailing={
        <Button
          variant="outline"
          size="sm"
          onClick={reload}
          disabled={refreshing}
          className="gap-1.5"
        >
          <span className={refreshing ? "animate-spin" : undefined}>
            <HugeiconsIcon icon={RefreshIcon} size={13} strokeWidth={1.5} />
          </span>
          Refresh
        </Button>
      }
    >
      {report === null ? null : <HealthBody report={report} />}
    </AdminScreen>
  );
}
