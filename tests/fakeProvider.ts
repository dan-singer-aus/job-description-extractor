import type { GenerationResult } from "@/lib/providers/types";

export function makeFakeProvider(results: GenerationResult[]) {
  let calls = 0;

  return {
    generate: async () => {
      calls++;
      return results[calls - 1];
    },
    getCalls: () => calls,
  };
}
