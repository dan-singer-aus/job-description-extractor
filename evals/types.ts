import type { JobDescription } from "@/validators/jobDescriptionSchema";

export type RedFlagCategory = JobDescription["redFlags"][number]["category"];

export type Fixture = {
  id: number;
  name: string;
  jobDescriptionPath: string;
  expectedSeniority?: JobDescription["seniority"]["level"];
  expectedRoleType?: JobDescription["roleType"][number];
  expectedRequiredHardSkillsMin?: number;
  expectedRequiredHardSkillsMax?: number;
  expectedWorkArrangement?: JobDescription["workArrangement"];
  expectedLocationIncludes?: string;
  expectedWorkType?: JobDescription["workType"];
  expectedKeyResponsibilitiesMin?: number;
  expectedEligibilityMin?: number;
  expectedQualificationsMin?: number;
  expectedQualificationsInclude?: string[];
  expectedFlagsPresent?: RedFlagCategory[];
  expectedFlagsAbsent?: RedFlagCategory[];
};
