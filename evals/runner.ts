import { FIXTURES } from "./fixtures";
import { makeOpenAIProvider } from "@/lib/providers/openAiProvider";
import { makeAnthropicProvider } from "@/lib/providers/anthropicProvider";
import type { ProviderRegistry } from "@/lib/providers/types";
import { extractStructuredData } from "@/services/extraction/extract";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadPrompt } from "@/lib/promptLoader";
import type { ProviderName } from "@/lib/providers/providerCatalog";
import { gradeFixture } from "./graders";
import type { CallTelemetry } from "@/lib/telemetry";
import { ExtractionError } from "@/services/extraction/extractionErrors";
import type { FixtureReport, ModelReport } from "./report";

// Runs the whole fixture suite against one provider/model, returning a ModelReport.
// The route loops this over the selected models to assemble an EvalReport.
export async function runEvals(providerName: ProviderName, model: string): Promise<ModelReport> {
  const providers: ProviderRegistry = {
    openai: makeOpenAIProvider(),
    anthropic: makeAnthropicProvider(),
  };
  const prompt = loadPrompt(join(process.cwd(), "prompts", "job_description_extraction.yaml"));
  const fixtures: FixtureReport[] = [];

  for (const fixture of FIXTURES) {
    // Fresh collector per fixture so cost/latency can be attributed to it.
    const records: CallTelemetry[] = [];
    const jobDescription = readFileSync(join(process.cwd(), fixture.jobDescriptionPath), "utf8");

    try {
      const result = await extractStructuredData({
        provider: providers[providerName],
        providerName,
        prompt,
        jobDescriptionData: jobDescription,
        model,
        telemetrySink: (record) => records.push(record),
      });
      const grade = gradeFixture(fixture, result, jobDescription);
      fixtures.push({ ...grade, ...aggregateTelemetry(records) });
    } catch (error) {
      // Expected extraction failures become an errored report (still carrying the
      // telemetry of the attempts that ran). Anything else is an unexpected bug.
      if (!(error instanceof ExtractionError)) throw error;
      fixtures.push({
        id: fixture.id,
        name: fixture.name,
        results: [],
        error: error.message,
        ...aggregateTelemetry(records),
      });
    }
  }

  return buildModelReport(providerName, model, fixtures);
}

// cost + latency summed over a fixture's attempts (a retry adds a second record).
function aggregateTelemetry(records: CallTelemetry[]): { cost: number; latencyMs: number } {
  return {
    cost: records.reduce((sum, record) => sum + record.cost, 0),
    latencyMs: records.reduce((sum, record) => sum + record.latencyMs, 0),
  };
}

function buildModelReport(
  provider: ProviderName,
  model: string,
  fixtures: FixtureReport[],
): ModelReport {
  const passedChecks = fixtures.reduce(
    (sum, f) => sum + f.results.filter((check) => check.passed).length,
    0,
  );
  const totalChecks = fixtures.reduce((sum, f) => sum + f.results.length, 0);
  const erroredFixtures = fixtures.filter((f) => f.error !== undefined).length;
  const totalCost = fixtures.reduce((sum, f) => sum + f.cost, 0);
  const avgLatencyMs =
    fixtures.length > 0
      ? fixtures.reduce((sum, f) => sum + f.latencyMs, 0) / fixtures.length
      : 0;

  return {
    provider,
    model,
    fixtures,
    passedChecks,
    totalChecks,
    erroredFixtures,
    totalCost,
    avgLatencyMs,
  };
}
