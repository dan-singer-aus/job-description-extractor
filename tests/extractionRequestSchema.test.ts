import { describe, expect, it } from "vitest";
import { ExtractionRequestSchema } from "@/validators/extractionRequestSchema";

const valid = {
  jobDescription: "We are hiring a frontend engineer.",
  provider: "openai",
  model: "gpt-5.4-mini",
};

describe("ExtractionRequestSchema", () => {
  it("accepts a valid provider/model pair", () => {
    expect(ExtractionRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty jobDescription", () => {
    const parsed = ExtractionRequestSchema.safeParse({ ...valid, jobDescription: "" });
    expect(parsed.success).toBe(false);
  });

  it("rejects an unknown provider", () => {
    const parsed = ExtractionRequestSchema.safeParse({ ...valid, provider: "cohere" });
    expect(parsed.success).toBe(false);
  });

  it("rejects a model that doesn't belong to the provider (cross-field refine)", () => {
    // anthropic is a real provider, but gpt-5.4-mini is an OpenAI model.
    const parsed = ExtractionRequestSchema.safeParse({
      ...valid,
      provider: "anthropic",
      model: "gpt-5.4-mini",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0].path).toEqual(["model"]);
    }
  });

  it("rejects a model that exists nowhere in the catalog", () => {
    const parsed = ExtractionRequestSchema.safeParse({ ...valid, model: "gpt-9-ultra" });
    expect(parsed.success).toBe(false);
  });
});
