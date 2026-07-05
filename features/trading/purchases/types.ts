import { PurchaseStatus, PurchasePaymentStatus } from "@prisma/client";

export interface PurchaseFilters {
  search?: string;
  status?: PurchaseStatus;
  paymentStatus?: PurchasePaymentStatus;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface PurchaseListItem {
  id: string;
  purchaseNumber: string;
  supplierInvoiceNumber: string | null;
  purchaseDate: Date;
  supplierName: string;
  grandTotal: number;
  status: PurchaseStatus;
  paymentStatus: PurchasePaymentStatus;
  createdAt: Date;
}
