import { z } from "zod";
import { PROVIDER_CATALOG, ProviderName } from "@/lib/providers/providerCatalog";

const ProviderSchema = z.enum(
  Object.keys(PROVIDER_CATALOG) as [ProviderName, ...ProviderName[]],
);

const ModelSelectionSchema = z
  .object({
    provider: ProviderSchema,
    model: z.string(),
  })
  .refine((data) => Object.hasOwn(PROVIDER_CATALOG[data.provider], data.model), {
    message: "model is not valid for the selected provider",
    path: ["model"],
  });

// Cap the matrix: each model runs the whole suite of paid calls, so bound the fan-out.
export const EvalRequestSchema = z.object({
  models: z.array(ModelSelectionSchema).min(1).max(6),
});

export type EvalRequest = z.infer<typeof EvalRequestSchema>;
