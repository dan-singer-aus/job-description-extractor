import { z } from "zod";
import {
  PROVIDER_CATALOG,
  ProviderName
} from "@/lib/providers/providerCatalog";

const ProviderSchema = z.enum(
  Object.keys(PROVIDER_CATALOG) as [ProviderName, ...ProviderName[]]
);

export const ExtractionRequestSchema = z
  .object({
    jobDescription: z.string().min(1, "jobDescription must not be empty"),
    provider: ProviderSchema,
    model: z.string(),
  })
  .refine(
    (data) => Object.hasOwn(PROVIDER_CATALOG[data.provider], data.model),
    {
      message: "model is not valid for the selected provider",
      path: ["model"],
    },
  );

export type ExtractionRequest = z.infer<typeof ExtractionRequestSchema>;
