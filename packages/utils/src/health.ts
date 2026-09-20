export type ServiceState = "up" | "down";

export interface ServiceProbe {
  id: string;
  name: string;
  detail: string;
  state: ServiceState;
  latencyMs: number | null;
  error: string | null;
}

export interface AdminHealthReport {
  checkedAt: string;
  overall: ServiceState;
  up: number;
  total: number;
  services: ServiceProbe[];
}
