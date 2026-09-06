import type { LLMProvider, GenerationParams, TokenUsage, GenerationResult, GenerationOutcome } from "@/lib/providers/types";
import type { ExtractionParams } from "./types";
import { JobDescriptionSchema, JobDescription } from "@/validators/jobDescriptionSchema";
import { toStrictJsonSchema } from "@/lib/toStrictJsonSchema";
import { ZodError } from "zod";
import { ExtractionRefused, ExtractionFailed } from "./extractionErrors";
import { makeTelemetryEmitter, consoleTelemetrySink } from "@/lib/telemetry";
import type { TelemetryOutcome, TelemetrySink } from "@/lib/telemetry";
import type { ProviderName, ModelPricing } from "@/lib/providers/providerCatalog";
import { PROVIDER_CATALOG } from "@/lib/providers/providerCatalog";

type AttemptOutcome = { kind: "success"; value: JobDescription } | { kind: "retry"; error: ExtractionFailed };

type ParseOutcome = { kind: "valid"; value: JobDescription } | { kind: "invalid"; error: Error };

type ExtractionContext = {
  provider: LLMProvider;
  providerName: ProviderName;
  promptVersion: number;
  generation: GenerationParams;
  telemetrySink: TelemetrySink;
};

type TelemetryEmitter = (outcome: TelemetryOutcome) => void;


const INPUT_PLACEHOLDER = "{job_description}";
const MAX_ATTEMPTS = 2;
const TOKENS_PER_MILLION = 1_000_000;

export async function extractStructuredData(params: ExtractionParams): Promise<JobDescription> {
  const context = makeExtractionContext(params);
  return await extractWithRetries(context);
}

async function extractWithRetries(context: ExtractionContext) {
  let error: ExtractionFailed | undefined = undefined;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const outcome = await attemptExtraction(context);
    if (outcome.kind === "success") {
      return outcome.value;
    }
  error = outcome.error;
  }

  throw error ?? new ExtractionFailed("Extraction failed after multiple attempts.");
}

async function attemptExtraction(context: ExtractionContext): Promise<AttemptOutcome> {
  const { result, latencyMs } = await timedGenerate(context);
  const cost = calculateCost(result.usage, context.providerName, context.generation.model);
  const emit = makeTelemetryEmitter(
    {
      providerName: context.providerName,
      model: context.generation.model,
      promptVersion: context.promptVersion,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      cost,
      latencyMs,
    },
    context.telemetrySink,
  );

  return resolveAttemptOutcome(result.outcome, emit);
}

function makeExtractionContext(params: ExtractionParams): ExtractionContext {
  const generationParams = {
    input: renderInput(params.prompt.input, params.jobDescriptionData),
    responseFormat: toStrictJsonSchema(JobDescriptionSchema),
    instructions: params.prompt.instructions,
    model: params.model,
  };

  const context: ExtractionContext = {
    promptVersion: params.prompt.version,
    providerName: params.providerName,
    provider: params.provider,
    generation: generationParams,
    telemetrySink: params.telemetrySink ?? consoleTelemetrySink,
  };
  return context;
}

function renderInput(input: string, jobDescriptionData: string): string {
  return input.replace(INPUT_PLACEHOLDER, jobDescriptionData);
}

async function timedGenerate(context: ExtractionContext): Promise<{ result: GenerationResult; latencyMs: number }> {
  const start = performance.now();
  const result = await context.provider.generate(context.generation);
  const latencyMs = performance.now() - start;
  return { result, latencyMs };
}

function resolveAttemptOutcome(generationOutcome: GenerationOutcome,  emit: TelemetryEmitter): AttemptOutcome {
  switch (generationOutcome.kind) {
    case "refusal":
      emit("refusal");
      throw new ExtractionRefused(`Provider refused to complete: ${generationOutcome.reason}`);
    case "incomplete":
      emit("incomplete");
      return {
        kind: "retry",
        error: new ExtractionFailed(`Result is incomplete: ${generationOutcome.reason}`),
      };
    case "content": {
      const parseResult = parseJobDescription(generationOutcome.text);
      if (parseResult.kind === "invalid") {
        emit("malformed");
        return {
          kind: "retry",
          error: new ExtractionFailed(`Validation failed: ${parseResult.error}`, { cause: parseResult.error }),
        };
      }
      emit("success");
      return { kind: "success", value: parseResult.value };
    }

    default: {
      const _exhaustive: never = generationOutcome;
      throw _exhaustive;
    }
  }
}

function parseJobDescription(text: string): ParseOutcome {
  try {
    const parsed = JobDescriptionSchema.parse(JSON.parse(text));
    return { kind: "valid", value: parsed };
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return { kind: "invalid", error };
    }
    throw error;
  }
}

function calculateCost(usage: TokenUsage, providerName: ProviderName, model: string): number {
  const pricing = (PROVIDER_CATALOG[providerName] as Record<string, ModelPricing>)[model];
  if (!pricing) throw new Error(`No pricing for ${providerName}/${model}`);
  return (
    (usage.inputTokens * pricing.inputUsdPerMTok) / TOKENS_PER_MILLION +
    (usage.outputTokens * pricing.outputUsdPerMTok) / TOKENS_PER_MILLION
  );
}


