/**
 * Dev entry for the eval suite — runs all fixtures against one model and prints
 * the full ModelReport (checks + per-fixture cost/latency). Makes REAL billed calls.
 *
 *   npm run eval                          # defaults: openai / gpt-5.4-mini
 *   npm run eval -- openai gpt-5.4
 *   npm run eval -- anthropic claude-haiku-4-5
 *
 * The browser runner (POST /api/evals) is the multi-model version; this is the
 * single-model "run it and look" loop while building.
 */
import { runEvals } from "../evals/runner";
import type { ProviderName } from "@/lib/providers/providerCatalog";

const provider = (process.argv[2] ?? "openai") as ProviderName;
const model = process.argv[3] ?? "gpt-5.4-mini";

runEvals(provider, model).then((report) => console.dir(report, { depth: null }));
