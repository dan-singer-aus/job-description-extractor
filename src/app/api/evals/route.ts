import { EvalRequestSchema } from "@/validators/evalRequestSchema";
import { runEvals } from "../../../../evals/runner";
import type { EvalReport } from "../../../../evals/report";

// Runs the eval suite for each selected model and returns the matrix report.
// Models run sequentially (kinder to rate limits + cost than fanning out).
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Malformed JSON body", { status: 400 });
  }

  const parsed = EvalRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response("Invalid request body", { status: 400 });
  }

  const models = [];
  for (const { provider, model } of parsed.data.models) {
    models.push(await runEvals(provider, model));
  }

  const report: EvalReport = { models };
  return new Response(JSON.stringify(report), { status: 200 });
}
