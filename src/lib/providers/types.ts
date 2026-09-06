import type { ProviderName } from "./providerCatalog";

export type GenerationOutcome =
  | { kind: "content"; text: string }
  | { kind: "refusal"; reason: string }
  | { kind: "incomplete"; reason: string };

export type TokenUsage = { inputTokens: number; outputTokens: number };

export type GenerationResult = {
  usage: TokenUsage;
  outcome: GenerationOutcome;
};

export type GenerationParams = {
  instructions: string;
  input: string;
  responseFormat: Record<string, unknown>;
  model: string;
};

export interface LLMProvider {
  generate(params: GenerationParams): Promise<GenerationResult>;
}

export type ProviderRegistry = Record<ProviderName, LLMProvider>;
