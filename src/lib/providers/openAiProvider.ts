import {
  LLMProvider,
  GenerationResult,
  GenerationParams,
  TokenUsage,
  GenerationOutcome,
} from "./types";
import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("OPENAI_API_KEY is not set");
}

export function makeOpenAIProvider(): LLMProvider {
  const client = new OpenAI({ apiKey });

  return {
    generate: async (params: GenerationParams): Promise<GenerationResult> => {
      const response = await client.responses.create({
        model: params.model,
        instructions: params.instructions,
        input: params.input,
        text: {
          format: {
            type: "json_schema",
            name: "JobDescription",
            strict: true,
            schema: params.responseFormat,
          },
        },
      });
      return {
        usage: toUsage(response),
        outcome: toOutcome(response),
      };
    },
  };
}

function toOutcome(
  response: OpenAI.Responses.Response,
): GenerationOutcome {
  if (response.status === "incomplete") {
    return {
      kind: "incomplete",
      reason: response.incomplete_details?.reason ?? "unknown",
    };
  } else if (response.status !== "completed") {
    throw new Error(`Unexpected response status: ${response.status}`);
  }

  const message = response.output.find((item) => item.type === "message");
  const refusal = message?.content.find((part) => part.type === "refusal");

  if (refusal) {
    return { kind: "refusal", reason: refusal.refusal };
  }

  if (response.output_text) {
    return { kind: "content", text: response.output_text };
  } else {
    throw new Error("Unexpected response format");
  }
}

function toUsage(response: OpenAI.Responses.Response): TokenUsage {
  if (!response.usage) {
    throw new Error("Missing usage");
  }
  return {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}
