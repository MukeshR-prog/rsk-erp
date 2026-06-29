import * as z from "zod";

export const unitSchema = z.object({
  name: z.string().min(1, "Unit name is required").max(50),
});

export type UnitFormValues = z.infer<typeof unitSchema>;
