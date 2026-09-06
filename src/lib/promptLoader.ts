import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { z } from "zod";

const PromptSchema = z.object({
  version: z.number(),
  instructions: z.string(),
  input: z.string(),
});

export type Prompt = z.infer<typeof PromptSchema>;

export function loadPrompt(path: string): Prompt {
  const raw = readFileSync(path, "utf8");
  const parsed = parse(raw);
  return PromptSchema.parse(parsed);
}
