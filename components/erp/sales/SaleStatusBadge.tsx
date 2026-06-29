import React from "react";
import { SaleStatus, SalePaymentStatus } from "@prisma/client";

interface SaleStatusBadgeProps {
  status?: SaleStatus;
  paymentStatus?: SalePaymentStatus;
}

export const SaleStatusBadge: React.FC<SaleStatusBadgeProps> = ({ status, paymentStatus }) => {
  if (status) {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500">
            Completed
          </span>
        );
      case "DRAFT":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500">
            Draft
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  }

  if (paymentStatus) {
    switch (paymentStatus) {
      case "PAID":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500">
            Paid
          </span>
        );
      case "PARTIALLY_PAID":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500">
            Partially Paid
          </span>
        );
      case "UNPAID":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500">
            Unpaid
          </span>
        );
      default:
        return null;
    }
  }

  return null;
};
