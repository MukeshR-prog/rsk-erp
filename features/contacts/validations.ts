import * as z from "zod";

export const contactSchema = z.object({
  name: z.string().min(1, "Contact name is required").max(100),
  type: z.enum(["CUSTOMER", "SUPPLIER"]),
  contactPerson: z.string().max(100).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  altPhone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  gstNumber: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) =>
        !val ||
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/.test(val),
      {
        message: "Invalid GSTIN format (e.g. 22AAAAA1111A1Z1)",
      }
    ),
  address: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(50).optional().or(z.literal("")),
  state: z.string().max(50).optional().or(z.literal("")),
  pincode: z.string().max(10).optional().or(z.literal("")),
  openingBalance: z.coerce
    .number()
    .min(0, "Opening balance must be positive")
    .default(0),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
