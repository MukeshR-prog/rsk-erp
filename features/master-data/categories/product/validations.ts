import * as z from "zod";

export const productCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
});

export type ProductCategoryFormValues = z.infer<typeof productCategorySchema>;
