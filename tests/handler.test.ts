import { describe, expect, it } from "vitest";
import { makeFakeProvider } from "./fakeProvider";
import { PROMPT, result, validJobDescription } from "./fixtures";
import { makeExtractionHandler } from "@/services/extraction/extraction.handler";
import type { GenerationResult } from "@/lib/providers/types";
import type { ProviderRegistry } from "@/lib/providers/types";

// Build a handler whose (both) providers are the same scripted fake.
function makeHandler(results: GenerationResult[]) {
  const provider = makeFakeProvider(results);
  const providers: ProviderRegistry = { openai: provider, anthropic: provider };
  return { handler: makeExtractionHandler({ providers, prompt: PROMPT }), provider };
}

// A POST Request. Pass a string body to simulate a raw (possibly malformed) payload.
function postRequest(body: unknown): Request {
  return new Request("http://test/api/extraction", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const validBody = {
  jobDescription: "We are hiring a frontend engineer.",
  provider: "openai",
  model: "gpt-5.4-mini",
};

describe("extraction handler", () => {
  it("returns 400 on a malformed JSON body", async () => {
    const { handler } = makeHandler([]);

    const response = await handler(postRequest("{not json"));

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Malformed JSON body");
  });

  it("returns 400 when the body fails request validation", async () => {
    const { handler } = makeHandler([]);

    // Well-formed JSON, but empty jobDescription → schema rejects it.
    const response = await handler(postRequest({ ...validBody, jobDescription: "" }));

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Invalid request body");
  });

  it("returns 422 when the model refuses", async () => {
    const { handler } = makeHandler([result({ kind: "refusal", reason: "no good" })]);

    const response = await handler(postRequest(validBody));

    expect(response.status).toBe(422);
  });

  it("returns 502 when extraction fails after retries", async () => {
    const { handler } = makeHandler([
      result({ kind: "incomplete", reason: "cut off" }),
      result({ kind: "incomplete", reason: "cut off" }),
    ]);

    const response = await handler(postRequest(validBody));

    expect(response.status).toBe(502);
  });

  it("returns 200 with the extracted job description on success", async () => {
    const { handler } = makeHandler([
      result({ kind: "content", text: JSON.stringify(validJobDescription) }),
    ]);

    const response = await handler(postRequest(validBody));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(validJobDescription);
  });

  it("lets an unexpected (non-extraction) error propagate instead of swallowing it", async () => {
    // A provider that throws a generic error simulates an unhandled fault;
    // mapExtractionError rethrows anything that isn't ExtractionRefused/Failed.
    const provider = {
      generate: async () => {
        throw new Error("kaboom");
      },
    };
    const providers: ProviderRegistry = { openai: provider, anthropic: provider };
    const handler = makeExtractionHandler({ providers, prompt: PROMPT });

    await expect(handler(postRequest(validBody))).rejects.toThrow("kaboom");
  });
});
