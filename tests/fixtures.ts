import type { GenerationOutcome, GenerationResult } from "@/lib/providers/types";
import type { JobDescription } from "@/validators/jobDescriptionSchema";

/** Wraps an outcome in a GenerationResult with throwaway usage (tests don't assert on cost). */
export function result(outcome: GenerationOutcome): GenerationResult {
  return { usage: { inputTokens: 0, outputTokens: 0 }, outcome };
}

/** A minimal but schema-complete JobDescription. Typed so the compiler enforces the shape. */
export const validJobDescription: JobDescription = {
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

/** A prompt stub — the fake provider ignores its contents. */
export const PROMPT = { version: 1, instructions: "foo", input: "bar" };
