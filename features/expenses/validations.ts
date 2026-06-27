import * as z from "zod";

export const expenseCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
});

export type ExpenseCategoryFormValues = z.infer<typeof expenseCategorySchema>;
