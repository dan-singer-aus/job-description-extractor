import { ProviderName } from "./providers/providerCatalog";

export type TelemetryOutcome =
  | "success"
  | "refusal"
  | "incomplete"
  | "malformed";

export type CallTelemetry = {
  providerName: ProviderName;
  model: string;
  promptVersion: number;
  inputTokens: number;
  outputTokens: number;
  cost: number; // USD
  latencyMs: number;
  outcome: TelemetryOutcome;
};

// Where an assembled telemetry record goes. Callers inject the destination:
// the route uses the console sink; the eval runner collects into an array.
export type TelemetrySink = (telemetry: CallTelemetry) => void;

export const consoleTelemetrySink: TelemetrySink = (telemetry) => {
  console.log(telemetry);
};

export function makeTelemetryEmitter(
  params: Omit<CallTelemetry, "outcome">,
  sink: TelemetrySink,
) {
  return (outcome: TelemetryOutcome) => {
    sink({ ...params, outcome });
  };
}
