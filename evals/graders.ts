import type { JobDescription } from "@/validators/jobDescriptionSchema";
import type { RedFlagCategory, Fixture } from "./types";

export type CheckResult = {
  name: string;
  expected: unknown;
  actual: unknown;
  passed: boolean;
};

// The correctness result of grading one fixture. The runner enriches this with
// telemetry (cost/latency) to produce a FixtureReport (see report.ts).
export type FixtureGrade = {
  id: number;
  name: string;
  results: CheckResult[];
  error?: string;
};

export function gradeFixture(fixture: Fixture, modelOutput: JobDescription, inputText: string): FixtureGrade {
  const results: CheckResult[] = [];

  // Each check runs only when its expectation is populated — undefined = "skip this check".
  if (fixture.expectedSeniority !== undefined)
    results.push(checkSeniority(fixture.expectedSeniority, modelOutput.seniority.level));
  if (fixture.expectedRoleType !== undefined)
    results.push(checkRoleType(fixture.expectedRoleType, modelOutput.roleType));
  if (fixture.expectedRequiredHardSkillsMin !== undefined)
    results.push(checkRequiredHardSkillsMin(fixture.expectedRequiredHardSkillsMin, modelOutput.requiredSkills));
  if (fixture.expectedRequiredHardSkillsMax !== undefined)
    results.push(checkRequiredHardSkillsMax(fixture.expectedRequiredHardSkillsMax, modelOutput.requiredSkills));
  if (fixture.expectedWorkArrangement !== undefined)
    results.push(checkWorkArrangement(fixture.expectedWorkArrangement, modelOutput.workArrangement));
  if (fixture.expectedWorkType !== undefined)
    results.push(checkWorkType(fixture.expectedWorkType, modelOutput.workType));
  if (fixture.expectedLocationIncludes !== undefined)
    results.push(checkLocation(fixture.expectedLocationIncludes, modelOutput.location));
  if (fixture.expectedKeyResponsibilitiesMin !== undefined)
    results.push(checkKeyResponsibilitiesMin(fixture.expectedKeyResponsibilitiesMin, modelOutput.keyResponsibilities));
  if (fixture.expectedEligibilityMin !== undefined)
    results.push(checkEligibilityMin(fixture.expectedEligibilityMin, modelOutput.eligibility));
  if (fixture.expectedQualificationsMin !== undefined)
    results.push(checkQualificationsMin(fixture.expectedQualificationsMin, modelOutput.qualifications));
  if (fixture.expectedQualificationsInclude !== undefined)
    results.push(checkQualificationsInclude(fixture.expectedQualificationsInclude, modelOutput.qualifications));

  // Per-category flag checks: gate + map in one (?. skips when the list is undefined).
  fixture.expectedFlagsPresent?.forEach((category) =>
    results.push(checkRedFlagPresent(category, modelOutput.redFlags)),
  );
  fixture.expectedFlagsAbsent?.forEach((category) => results.push(checkRedFlagAbsent(category, modelOutput.redFlags)));

  // Universal faithfulness invariant — always runs.
  results.push(checkQuotesGrounded(inputText, modelOutput.redFlags));

  return { id: fixture.id, name: fixture.name, results };
}

// Shared by containment + grounding checks: the model alters whitespace and quote
// characters when it extracts text, so compare on a normalised form, not raw.
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['"`‘’“”]/g, "") // drop quote chars — models swap ' for " etc.
    .replace(/\s+/g, " ") // collapse all whitespace runs to one space
    .trim();
}

export function checkSeniority(expected: string, actual: string): CheckResult {
  return {
    name: "Seniority",
    expected,
    actual,
    passed: expected === actual,
  };
}

export function checkRoleType(expected: string, actual: string[]): CheckResult {
  return {
    name: "Role Type",
    expected,
    actual,
    passed: actual.includes(expected),
  };
}

export function checkRequiredHardSkillsMin(expected: number, actual: JobDescription["requiredSkills"]): CheckResult {
  const hardCount = actual.filter((s) => s.category === "hard").length;
  return {
    name: "Required Hard Skills Min",
    expected,
    actual: hardCount,
    passed: hardCount >= expected,
  };
}

export function checkRequiredHardSkillsMax(expected: number, actual: JobDescription["requiredSkills"]): CheckResult {
  const hardCount = actual.filter((s) => s.category === "hard").length;
  return {
    name: "Required Hard Skills Max",
    expected,
    actual: hardCount,
    passed: hardCount <= expected,
  };
}

export function checkWorkArrangement(expected: string, actual: string): CheckResult {
  return {
    name: "Work Arrangement",
    expected,
    actual,
    passed: expected === actual,
  };
}

export function checkWorkType(expected: string, actual: string): CheckResult {
  return {
    name: "Work Type",
    expected,
    actual,
    passed: expected === actual,
  };
}

export function checkLocation(expected: string, actual: string | null): CheckResult {
  return {
    name: "Location",
    expected,
    actual,
    passed: actual !== null && normalize(actual).includes(normalize(expected)),
  };
}

export function checkKeyResponsibilitiesMin(expected: number, actual: string[]): CheckResult {
  return {
    name: "Key Responsibilities Min",
    expected,
    actual: actual.length,
    passed: actual.length >= expected,
  };
}

export function checkEligibilityMin(expected: number, actual: string[]): CheckResult {
  return {
    name: "Eligibility Min",
    expected,
    actual: actual.length,
    passed: actual.length >= expected,
  };
}

export function checkQualificationsMin(expected: number, actual: JobDescription["qualifications"]): CheckResult {
  return {
    name: "Qualifications Min",
    expected,
    actual: actual.length,
    passed: actual.length >= expected,
  };
}

export function checkQualificationsInclude(expected: string[], actual: JobDescription["qualifications"]): CheckResult {
  const options = actual.flatMap((q) => q.options);
  const normalizedOptions = options.map(normalize);
  return {
    name: "Qualifications Include",
    expected,
    actual: options,
    passed: expected.every((token) => normalizedOptions.some((option) => option.includes(normalize(token)))),
  };
}

export function checkRedFlagPresent(expected: RedFlagCategory, actual: JobDescription["redFlags"]): CheckResult {
  // Category is in `name`; expected/actual carry the polarity + the present set so the
  // failure display reads sensibly ("expected: present · actual: <categories>").
  return {
    name: `Red Flag Present: ${expected}`,
    expected: "present",
    actual: [...new Set(actual.map((flag) => flag.category))],
    passed: actual.some((flag) => flag.category === expected),
  };
}

export function checkRedFlagAbsent(expected: RedFlagCategory, actual: JobDescription["redFlags"]): CheckResult {
  return {
    name: `Red Flag Absent: ${expected}`,
    expected: "absent",
    actual: [...new Set(actual.map((flag) => flag.category))],
    passed: !actual.some((flag) => flag.category === expected),
  };
}

// Faithfulness invariant (runs on every fixture, no expected field): every non-null
// red-flag quote must appear verbatim (after normalisation) in the source text.
// `actual` carries the ungrounded quotes so the report shows which were invented.
export function checkQuotesGrounded(jobText: string, actual: JobDescription["redFlags"]): CheckResult {
  const normalizedText = normalize(jobText);
  const quotes = actual.map((flag) => flag.quote).filter((quote): quote is string => quote !== null);
  const ungrounded = quotes.filter((quote) => !normalizedText.includes(normalize(quote)));
  return {
    name: "Quotes Grounded",
    expected: quotes.length,
    actual: ungrounded,
    passed: ungrounded.length === 0,
  };
}
