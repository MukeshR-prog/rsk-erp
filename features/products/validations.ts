import * as z from "zod";

export const productSchema = z.object({
  code: z.string().min(1, "Product code is required").max(50),
  name: z.string().min(1, "Product name is required").max(100),
  type: z.enum(["RAW_MATERIAL", "FINISHED_GOOD", "TRADING_PRODUCT"]),
  description: z.string().max(300).optional().or(z.literal("")),
  imageUrl: z.string().optional().or(z.literal("")),
  volumeMl: z.string().max(50).optional().or(z.literal("")),
  color: z.string().max(50).optional().or(z.literal("")),
  purchasePrice: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? null : Number(val)),
    z.number().min(0, "Price must be positive").nullable().optional()
  ),
  sellingPrice: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? null : Number(val)),
    z.number().min(0, "Price must be positive").nullable().optional()
  ),
  minStockAlert: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? null : Number(val)),
    z.number().min(0, "Stock alert must be positive").nullable().optional()
  ),
  categoryId: z.string().optional().or(z.literal("")),
  unitId: z.string().optional().or(z.literal("")),
});

export type ProductFormValues = z.infer<typeof productSchema>;
