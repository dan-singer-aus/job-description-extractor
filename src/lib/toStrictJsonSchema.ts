import { z } from "zod";

export function toStrictJsonSchema(schema: z.ZodType): Record<string, unknown> {
  return z.toJSONSchema(schema, {
    override(ctx) {
      const node = ctx.jsonSchema;
      if (node.type === "object") {
        node.additionalProperties = false;
      }
      if (node.type === "array") {
        delete node.minItems;
        delete node.maxItems;
      }
      if (node.type === "number" || node.type === "integer") {
        delete node.minimum;
        delete node.maximum;
        delete node.exclusiveMinimum;
        delete node.exclusiveMaximum;
      }
    },
  });
}
