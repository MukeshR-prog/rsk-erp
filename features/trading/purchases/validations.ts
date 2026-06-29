import { z } from "zod";

export const purchaseItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().positive("Quantity must be greater than zero"),
  unitId: z.string().min(1, "Unit of measure is required"),
  purchaseRate: z.number().min(0, "Purchase rate must be non-negative"),
  discount: z.number().min(0, "Line discount must be non-negative").default(0),
  remarks: z.string().optional().nullable(),
});

export const purchaseSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  purchaseDate: z.string().or(z.date()).transform((val) => new Date(val)),
  supplierInvoiceNumber: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  discount: z.number().min(0, "Discount must be non-negative").default(0),
  transportCharges: z.number().min(0, "Transport charges must be non-negative").default(0),
  status: z.enum(["DRAFT", "COMPLETED", "CANCELLED"]).default("COMPLETED"),
  items: z
    .array(purchaseItemSchema)
    .min(1, "At least one product item must be added")
    .superRefine((items, ctx) => {
      // Validate that quantities and rates are positive
      items.forEach((item, idx) => {
        if (item.quantity <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Item #${idx + 1} must have a positive quantity`,
            path: [idx, "quantity"],
          });
        }
        if (item.purchaseRate < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Item #${idx + 1} must have a non-negative rate`,
            path: [idx, "purchaseRate"],
          });
        }
      });
    }),
});

export type PurchaseFormValues = z.infer<typeof purchaseSchema>;
export type PurchaseItemFormValues = z.infer<typeof purchaseItemSchema>;
