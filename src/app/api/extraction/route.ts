import { makeExtractionHandler } from "@/services/extraction/extraction.handler";
import { makeOpenAIProvider } from "@/lib/providers/openAiProvider";
import { makeAnthropicProvider } from "@/lib/providers/anthropicProvider";
import { loadPrompt } from "@/lib/promptLoader";
import type { ProviderRegistry } from "@/lib/providers/types";
import { join } from "node:path";

const providers: ProviderRegistry = {
  openai: makeOpenAIProvider(),
  anthropic: makeAnthropicProvider(),
};
const prompt = loadPrompt(
  join(process.cwd(), "prompts", "job_description_extraction.yaml"),
);

export const POST = makeExtractionHandler({ providers, prompt });
