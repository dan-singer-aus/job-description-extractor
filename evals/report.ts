import type { FixtureGrade } from "./graders";
import type { ProviderName } from "@/lib/providers/providerCatalog";

// A graded fixture enriched with the run's telemetry. cost + latency are summed
// over this fixture's attempts (a retry contributes a second record).
export type FixtureReport = FixtureGrade & {
  cost: number; // USD
  latencyMs: number;
};

// One model's run over the whole fixture suite, plus the aggregates the UI shows.
export type ModelReport = {
  provider: ProviderName;
  model: string;
  fixtures: FixtureReport[];
  passedChecks: number;
  totalChecks: number;
  erroredFixtures: number;
  totalCost: number;
  avgLatencyMs: number;
};

// The whole matrix — one ModelReport per selected provider/model. The UI's input.
export type EvalReport = {
  models: ModelReport[];
};
