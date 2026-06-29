import { PaymentType, PaymentMethod, PaymentStatus } from "@prisma/client";

export interface PaymentFilters {
  page?: number;
  limit?: number;
  search?: string;
  contactId?: string;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
  status?: PaymentStatus;
  paymentType?: PaymentType;
}

export interface CreateSupplierPaymentDTO {
  contactId: string;
  purchaseId?: string;
  saleId?: string;
  amount: number;
  paymentDate: string; // ISO String
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  paymentType: PaymentType;
}

export interface CancelSupplierPaymentDTO {
  paymentId: string;
  cancellationReason: string;
}
