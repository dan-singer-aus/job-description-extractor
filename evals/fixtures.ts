import type { Fixture } from "./types";

export const job1Fixture: Fixture = {
  id: 1,
  name: "Bluewren Health — junior frontend (benign)",
  jobDescriptionPath: "sources/job1.txt",
  expectedSeniority: "junior",
  expectedRoleType: "frontend",
  expectedRequiredHardSkillsMin: 3,
  expectedWorkArrangement: "hybrid",
  expectedWorkType: "permanent",
  expectedKeyResponsibilitiesMin: 4,
  expectedQualificationsMin: 1,
  expectedQualificationsInclude: ["degree"],
  // Over-firing guard: a clean ad with mild wording ("fast paced") that must NOT fire.
  expectedFlagsAbsent: [
    "scope_mismatch",
    "unrealistic_requirements",
    "unpaid_work",
    "culture_language",
    "hours",
    "process",
    "vague_scope",
  ],
};

export const job3Fixture: Fixture = {
  id: 3,
  name: "Wayfind — graduate program (vague, multi-track)",
  jobDescriptionPath: "sources/job3.txt",
  expectedSeniority: "junior",
  expectedRoleType: "unclear",
  // Red→green target: the exposure stack (AWS/GraphQL/React/TS) is "learn on the job",
  // not required — so at most one generic hard skill ("coding"). >1 = fabrication.
  expectedRequiredHardSkillsMax: 1,
  expectedWorkArrangement: "unclear",
  expectedWorkType: "permanent",
  expectedEligibilityMin: 1,
  expectedQualificationsMin: 1,
  expectedQualificationsInclude: ["degree"],
  // vague_scope is dead-zoned (flaky run-to-run) — asserted neither present nor absent.
  expectedFlagsAbsent: [
    "scope_mismatch",
    "unrealistic_requirements",
    "unpaid_work",
    "culture_language",
    "hours",
    "process",
  ],
};

export const job4Fixture: Fixture = {
  id: 4,
  name: "Meridian Bank — staff engineer (high-seniority anchor)",
  jobDescriptionPath: "sources/job4.txt",
  expectedSeniority: "lead",
  expectedRoleType: "fullstack",
  expectedRequiredHardSkillsMin: 7,
  expectedWorkArrangement: "unclear",
  expectedWorkType: "permanent",
  expectedKeyResponsibilitiesMin: 4,
  expectedFlagsAbsent: [
    "scope_mismatch",
    "unrealistic_requirements",
    "unpaid_work",
    "culture_language",
    "hours",
    "process",
    "vague_scope",
  ],
};

export const job5Fixture: Fixture = {
  id: 5,
  name: "VortexAI — red-flag-loaded (fake)",
  jobDescriptionPath: "sources/job5.txt",
  // Seniority is dead-zoned: the ad states no level and pairs senior-scope responsibilities
  // with "2+ years" + unrealistic demands, so models legitimately disagree (lead/mid/...).
  // The mismatch is captured by scope_mismatch in flagsPresent instead.
  expectedRoleType: "fullstack",
  expectedRequiredHardSkillsMin: 6,
  expectedWorkArrangement: "onsite",
  expectedWorkType: "permanent",
  expectedKeyResponsibilitiesMin: 4,
  // The dedicated red-flag fixture: assert all 6 firing categories present (the
  // capability-ceiling test). vague_scope is the lone absent — the ad is over-specified.
  // process is the softest → most likely to wobble; demote after grounding if needed.
  expectedFlagsPresent: [
    "scope_mismatch",
    "unrealistic_requirements",
    "unpaid_work",
    "culture_language",
    "hours",
    "process",
  ],
};

export const FIXTURES: Fixture[] = [job1Fixture, job3Fixture, job4Fixture, job5Fixture];
