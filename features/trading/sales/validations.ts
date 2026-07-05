import { z } from "zod";

export const saleItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().positive("Quantity must be greater than zero"),
  sellingRate: z.number().min(0, "Selling rate must be non-negative"),
  discount: z.number().min(0, "Line discount must be non-negative").default(0),
  remarks: z.string().optional().nullable(),
});

export const saleSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  saleDate: z.string().or(z.date()).transform((val) => new Date(val)),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  discount: z.number().min(0, "Discount must be non-negative").default(0),
  transportCharges: z.number().min(0, "Transport charges must be non-negative").default(0),
  initialAmountPaid: z.number().min(0, "Initial payment must be non-negative").optional().default(0),
  status: z.enum(["DRAFT", "COMPLETED", "CANCELLED"]).default("COMPLETED"),
  items: z
    .array(saleItemSchema)
    .min(1, "At least one product item must be added")
    .superRefine((items, ctx) => {
      items.forEach((item, idx) => {
        if (item.quantity <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Item #${idx + 1} must have a positive quantity`,
            path: [idx, "quantity"],
          });
        }
        if (item.sellingRate < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Item #${idx + 1} must have a non-negative rate`,
            path: [idx, "sellingRate"],
          });
        }
      });
    }),
});

export type SaleFormValues = z.infer<typeof saleSchema>;
export type SaleItemFormValues = z.infer<typeof saleItemSchema>;
export type CreateSaleDTO = SaleFormValues;
export type EditSaleDTO = SaleFormValues;
