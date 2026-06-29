import { z } from "zod";

export const bomItemSchema = z.object({
  materialId: z.string().min(1, "Raw material is required"),
  quantity: z.number().positive("Quantity must be greater than zero"),
});

export const bomRecipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required").max(100),
  finishedProductId: z.string().min(1, "Finished product is required"),
  wasteFactorPercent: z.number().min(0, "Waste factor cannot be negative").max(100, "Waste factor cannot exceed 100%").default(0),
  items: z.array(bomItemSchema).min(1, "At least one raw material item must be added"),
}).superRefine((data, ctx) => {
  // 1. Check if finished product is included as raw material
  const includesFinishedProduct = data.items.some((item) => item.materialId === data.finishedProductId);
  if (includesFinishedProduct) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Finished product cannot be included as a raw material in its own recipe.",
      path: ["items"],
    });
  }

  // 2. Check for duplicate raw materials
  const materialIds = data.items.map((item) => item.materialId);
  const duplicates = materialIds.filter((id, index) => materialIds.indexOf(id) !== index);
  if (duplicates.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Duplicate raw materials are not allowed.",
      path: ["items"],
    });
  }
});

export type BOMRecipeFormValues = z.infer<typeof bomRecipeSchema>;
export type BOMRecipeItemValues = z.infer<typeof bomItemSchema>;
