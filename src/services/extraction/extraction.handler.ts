import { ExtractionRequestSchema } from "@/validators/extractionRequestSchema";
import { extractStructuredData } from "./extract";
import type { ExtractionHandlerDeps, ParsedResult } from "./types";
import { ExtractionRefused, ExtractionFailed } from "./extractionErrors";

export function makeExtractionHandler({ providers, prompt }: ExtractionHandlerDeps) {
  return async function POST(request: Request) {
    const parsed = await parseRequest(request);
    if (!parsed.ok) {
      return new Response(parsed.error, { status: 400 });
    }

    try {
      const result = await extractStructuredData({
        provider: providers[parsed.data.provider],
        providerName: parsed.data.provider,
        prompt: prompt,
        jobDescriptionData: parsed.data.jobDescription,
        model: parsed.data.model,
      });
      return new Response(JSON.stringify(result), { status: 200 });
    } catch (error) {
      return mapExtractionError(error);
    }
  };
}

async function parseRequest(request: Request): Promise<ParsedResult> {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return { ok: false, error: "Malformed JSON body" };
  }

  const result = ExtractionRequestSchema.safeParse(input);
  if (!result.success) {
    return { ok: false, error: "Invalid request body" };
  }

  return { ok: true, data: result.data };
}

function mapExtractionError(error: unknown): Response {
  if (error instanceof ExtractionRefused) {
    return new Response("The model declined to process this input", {
      status: 422,
    });
  }

  if (error instanceof ExtractionFailed) {
    return new Response("Extraction failed, please try again", { status: 502 });
  }

  throw error;
}
