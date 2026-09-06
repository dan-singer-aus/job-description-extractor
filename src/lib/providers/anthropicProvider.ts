import {
  LLMProvider,
  GenerationResult,
  GenerationParams,
  TokenUsage,
  GenerationOutcome,
} from "./types";
import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  throw new Error("ANTHROPIC_API_KEY is not set");
}

const MAX_TOKENS = 5000;

export function makeAnthropicProvider(): LLMProvider {
  const client = new Anthropic({ apiKey });

  return {
    generate: async (params: GenerationParams): Promise<GenerationResult> => {
      const response = await client.messages.create({
        system: params.instructions,
        model: params.model,
        max_tokens: MAX_TOKENS,
        messages: [
          {
            role: "user",
            content: params.input,
          },
        ],
        output_config: {
          format: { type: "json_schema", schema: params.responseFormat },
        },
      });
      return {
        usage: toUsage(response),
        outcome: toOutcome(response),
      };
    },
  };
}

function toOutcome(response: Anthropic.Messages.Message): GenerationOutcome {
  if (response.stop_reason === "max_tokens") {
    return {
      kind: "incomplete",
      reason: "exceeded max_tokens",
    };
  }
  if (response.stop_reason === "refusal") {
    return {
      kind: "refusal",
      reason: response.stop_details?.explanation ?? "unknown",
    };
  }
  if (
    response.stop_reason !== "end_turn" &&
    response.stop_reason !== "stop_sequence"
  ) {
    throw new Error(`Unexpected stop_reason: ${response.stop_reason}`);
  }
  for (const block of response.content) {
    if (block.type === "text") {
      return { kind: "content", text: block.text };
    }
  }
  throw new Error("Unexpected response format");
}

function toUsage(response: Anthropic.Messages.Message): TokenUsage {
  if (!response.usage) {
    throw new Error("Missing usage");
  }
  return {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };
}
