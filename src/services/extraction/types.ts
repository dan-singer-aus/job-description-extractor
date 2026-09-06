import type { LLMProvider } from "@/lib/providers/types";
import type { Prompt } from "@/lib/promptLoader";
import type { ExtractionRequest } from "@/validators/extractionRequestSchema";
import type { ProviderName } from "@/lib/providers/providerCatalog";
import type { TelemetrySink } from "@/lib/telemetry";

export type ExtractionHandlerDeps = {
  providers: Record<ProviderName, LLMProvider>
  prompt: Prompt;
};

export type ParsedResult =
  | { ok: true; data: ExtractionRequest }
  | { ok: false; error: string };

export type ExtractionParams = {
  provider: LLMProvider;
  providerName: ProviderName;
  prompt: Prompt;
  jobDescriptionData: string;
  model: string;
  // Optional: defaults to the console sink, so existing callers (route) are unaffected;
  // the eval runner injects a collector to capture cost/latency.
  telemetrySink?: TelemetrySink;
};

