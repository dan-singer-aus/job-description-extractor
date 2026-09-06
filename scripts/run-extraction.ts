/**
 * Dev-runner — actually executes the extraction pipeline so you can SEE it work
 * (the result JSON + the telemetry record emit), not just compile it.
 *
 * This is NOT a test (no assertions) and NOT the eval harness — it's a manual
 * "run it and look" loop while building. It makes a REAL, billed API call.
 *
 *   npm run runner                              # defaults: openai / gpt-5.4-mini
 *   npm run runner -- anthropic claude-haiku-4-5
 *   npm run runner -- openai gpt-5.4
 *
 * Note: only the chosen provider is constructed, so you only need that vendor's
 * key in .env.local. Error branches (refusal / incomplete / malformed) won't
 * fire on a normal live call — those need the fake-provider harness.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadPrompt } from "@/lib/promptLoader";
import { extractStructuredData } from "@/services/extraction/extract";
import {
  PROVIDER_CATALOG,
  type ProviderName,
} from "@/lib/providers/providerCatalog";
import type { ExtractionParams } from "@/services/extraction/types";
import type { LLMProvider } from "@/lib/providers/types";

const DEFAULT_MODELS: Record<ProviderName, string> = {
  openai: "gpt-5.4-mini",
  anthropic: "claude-haiku-4-5",
};

async function makeProvider(name: ProviderName): Promise<LLMProvider> {
  // Dynamic + only-the-chosen-one: avoids constructing (and needing a key for)
  // the provider you're not using. Imported here, after env load, because the
  // provider modules read their keys at module init.
  if (name === "openai") {
    const { makeOpenAIProvider } = await import("@/lib/providers/openAiProvider");
    return makeOpenAIProvider();
  }
  const { makeAnthropicProvider } = await import(
    "@/lib/providers/anthropicProvider"
  );
  return makeAnthropicProvider();
}

async function main() {
  process.loadEnvFile(".env.local");

  const providerName = (process.argv[2] ?? "openai") as ProviderName;
  const model = process.argv[3] ?? DEFAULT_MODELS[providerName];

  // Validate the pair up front so a typo fails clearly, not as a vendor 400.
  if (!Object.hasOwn(PROVIDER_CATALOG, providerName)) {
    throw new Error(`Unknown provider: ${providerName}`);
  }
  if (!Object.hasOwn(PROVIDER_CATALOG[providerName], model)) {
    throw new Error(`Unknown model for ${providerName}: ${model}`);
  }

  const params: ExtractionParams = {
    provider: await makeProvider(providerName),
    providerName,
    prompt: loadPrompt(
      join(process.cwd(), "prompts", "job_description_extraction.yaml"),
    ),
    jobDescriptionData: readFileSync(
      join(process.cwd(), "sources", "job1.txt"),
      "utf8",
    ),
    model,
  };

  console.log(`\n▶ Running extraction: ${providerName} / ${model}\n`);
  const result = await extractStructuredData(params);
  console.log("\n✅ Extracted JobDescription:\n");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error("\n❌ Run failed:\n", error);
  process.exitCode = 1;
});
