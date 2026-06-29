export interface PaymentFilters {
  page?: number;
  limit?: number;
  search?: string;
  contactId?: string;
  paymentMethod?: "CASH" | "BANK_TRANSFER" | "UPI" | "CHEQUE";
  startDate?: string;
  endDate?: string;
  status?: "COMPLETED" | "CANCELLED";
}

export interface CreateSupplierPaymentDTO {
  contactId: string;
  purchaseId: string;
  amount: number;
  paymentDate: string; // ISO String
  paymentMethod: "CASH" | "BANK_TRANSFER" | "UPI" | "CHEQUE";
  referenceNumber?: string;
  notes?: string;
}

export interface CancelSupplierPaymentDTO {
  paymentId: string;
  cancellationReason: string;
}
