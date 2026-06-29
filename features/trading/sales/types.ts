import { SaleStatus, SalePaymentStatus } from "@prisma/client";

export interface SaleFilters {
  search?: string;
  status?: SaleStatus;
  paymentStatus?: SalePaymentStatus;
  page?: number;
  limit?: number;
}

export interface SaleListItem {
  id: string;
  saleNumber: string;
  saleDate: Date;
  customerName: string;
  grandTotal: number;
  status: SaleStatus;
  paymentStatus: SalePaymentStatus;
  createdAt: Date;
}
