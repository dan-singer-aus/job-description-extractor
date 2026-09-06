export type ModelPricing = {
  inputUsdPerMTok: number; // USD per 1M input tokens
  outputUsdPerMTok: number; // USD per 1M output tokens
};

export const PROVIDER_CATALOG = {
  openai: {
    "gpt-5.5": { inputUsdPerMTok: 5, outputUsdPerMTok: 30 },
    "gpt-5.4": { inputUsdPerMTok: 2.5, outputUsdPerMTok: 15 },
    "gpt-5.4-mini": { inputUsdPerMTok: 0.75, outputUsdPerMTok: 4.5 },
  },
  anthropic: {
    "claude-opus-4-8": { inputUsdPerMTok: 5, outputUsdPerMTok: 25 },
    "claude-sonnet-4-6": { inputUsdPerMTok: 3, outputUsdPerMTok: 15 },
    "claude-haiku-4-5": { inputUsdPerMTok: 1, outputUsdPerMTok: 5 },
  },
} as const;

export type ProviderName = keyof typeof PROVIDER_CATALOG;
