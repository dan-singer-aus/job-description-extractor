import { describe, expect, it } from "vitest";
import { makeFakeProvider } from "./fakeProvider";
import { ExtractionFailed, ExtractionRefused } from "@/services/extraction/extractionErrors";
import { extractStructuredData } from "@/services/extraction/extract";
import type { GenerationOutcome, GenerationResult } from "@/lib/providers/types";
import type { JobDescription } from "@/validators/jobDescriptionSchema";

const PROMPT = { version: 1, instructions: "foo", input: "bar" };

function runExtraction(provider: ReturnType<typeof makeFakeProvider>) {
  return extractStructuredData({
    provider,
    providerName: "openai",
    model: "gpt-5.4-mini",
    prompt: PROMPT,
    jobDescriptionData: "baz",
  });
}

function result(outcome: GenerationOutcome): GenerationResult {
  return { usage: { inputTokens: 0, outputTokens: 0 }, outcome };
}

const validJobDescription: JobDescription = {
  recruiter: false,
  companyName: "Acme",
  companyDescription: "A software company",
  contactPerson: null,
  workArrangement: "remote",
  location: null,
  workType: "permanent",
  salary: null,
  seniority: { reasoning: "Mid-level scope", level: "mid", confidence: "high" },
  roleType: ["frontend"],
  domain: "Software",
  requiredSkills: [],
  niceToHaveSkills: [],
  keyResponsibilities: [],
  eligibility: [],
  qualifications: [],
  traits: [],
  redFlags: [],
};

describe("extractStructuredData", () => {
  it("throws on extraction refusal, without retrying", async () => {
    const provider = makeFakeProvider([result({ kind: "refusal", reason: "no good" })]);

    await expect(runExtraction(provider)).rejects.toThrow(ExtractionRefused);
    expect(provider.getCalls()).toBe(1);
  });

  it("throws ExtractionFailed after retrying an incomplete response", async () => {
    const provider = makeFakeProvider([
      result({ kind: "incomplete", reason: "no good" }),
      result({ kind: "incomplete", reason: "no good" }),
    ]);

    await expect(runExtraction(provider)).rejects.toThrow(ExtractionFailed);
    expect(provider.getCalls()).toBe(2);
  });

  it("throws ExtractionFailed after retrying a malformed response", async () => {
    const provider = makeFakeProvider([
      result({ kind: "content", text: "{bad json" }),
      result({ kind: "content", text: "{bad json" }),
    ]);

    await expect(runExtraction(provider)).rejects.toThrow(ExtractionFailed);
    expect(provider.getCalls()).toBe(2);
  });

  it("recovers on the second attempt after a malformed first", async () => {
    const provider = makeFakeProvider([
      result({ kind: "content", text: "{bad json" }),
      result({ kind: "content", text: JSON.stringify(validJobDescription) }),
    ]);

    const extracted = await runExtraction(provider);

    expect(extracted).toEqual(validJobDescription);
    expect(provider.getCalls()).toBe(2);
  });
});
