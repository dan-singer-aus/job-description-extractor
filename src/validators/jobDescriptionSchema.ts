import { z } from "zod";

const RedFlagCategorySchema = z.enum([
  "scope_mismatch",
  "unrealistic_requirements",
  "unpaid_work",
  "culture_language",
  "hours",
  "process",
  "vague_scope",
]);

const RoleTypeSchema = z.enum([
  "frontend",
  "backend",
  "fullstack",
  "data",
  "ml",
  "ai",
  "devops",
  "mobile",
  "security",
  "embedded",
  "platform",
  "qa",
  "unclear",
]);

const SeniorityLevelSchema = z.object({
  reasoning: z.string(),
  level: z.enum(["junior", "mid", "senior", "lead", "unclear"]),
  confidence: z.enum(["high", "medium", "low"]),
});

const SkillSchema = z.object({
  options: z.array(z.string()),
  minYears: z.number().int().nullable(),
  category: z.enum(["hard", "soft"]),
});

const RedFlagSchema = z.object({
  quote: z.string().nullable(),
  explanation: z.string(),
  category: RedFlagCategorySchema,
});

const QualificationSchema = z.object({
  options: z.array(z.string()),
  requirementLevel: z.enum(["required", "preferred", "unclear"]),
});

export const JobDescriptionSchema = z.object({
  recruiter: z.boolean(),
  companyName: z.string(),
  companyDescription: z.string(),
  contactPerson: z.string().nullable(),
  workArrangement: z.enum(["onsite", "remote", "hybrid", "unclear"]),
  location: z.string().nullable(),
  workType: z.enum(["permanent", "contract", "part-time", "casual", "unclear"]),
  salary: z.string().nullable(),
  seniority: SeniorityLevelSchema,
  roleType: z.array(RoleTypeSchema).min(1).max(2),
  domain: z.string(),
  requiredSkills: z.array(SkillSchema),
  niceToHaveSkills: z.array(SkillSchema),
  keyResponsibilities: z.array(z.string()),
  eligibility: z.array(z.string()),
  qualifications: z.array(QualificationSchema),
  traits: z.array(z.string()).max(3),
  redFlags: z.array(RedFlagSchema),
});

export type JobDescription = z.infer<typeof JobDescriptionSchema>;
