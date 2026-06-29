import { z } from "zod";

export const createPaymentSchema = z.object({
  contactId: z.string().uuid("Please select a valid supplier."),
  purchaseId: z.string().uuid("Please select a valid purchase invoice."),
  amount: z
    .number()
    .positive("Payment amount must be greater than zero.")
    .max(99999999, "Amount is too large."),
  paymentDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid payment date.",
  }),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "UPI", "CHEQUE"]),
  referenceNumber: z
    .string()
    .max(50, "Reference number cannot exceed 50 characters.")
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .max(255, "Notes cannot exceed 255 characters.")
    .optional()
    .or(z.literal("")),
});

export const cancelPaymentSchema = z.object({
  paymentId: z.string().uuid("Invalid payment ID."),
  cancellationReason: z
    .string()
    .min(3, "Cancellation reason must be at least 3 characters long.")
    .max(255, "Reason cannot exceed 255 characters."),
});

export type CreatePaymentFormValues = z.infer<typeof createPaymentSchema>;
export type CancelPaymentFormValues = z.infer<typeof cancelPaymentSchema>;
