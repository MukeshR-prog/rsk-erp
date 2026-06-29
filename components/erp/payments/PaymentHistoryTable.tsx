import React from "react";
import Link from "next/link";
import Table from "@/components/ui/Table";
import PaymentStatusBadge from "./PaymentStatusBadge";
import dayjs from "dayjs";
import { Button } from "@heroui/react";
import { Trash2, Eye } from "lucide-react";

interface PaymentItem {
  id: string;
  paymentNumber: string;
  amount: number;
  paymentDate: Date | string;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "UPI" | "CHEQUE";
  referenceNumber?: string | null;
  notes?: string | null;
  status: "COMPLETED" | "CANCELLED";
  cancellationReason?: string | null;
}

interface PaymentHistoryTableProps {
  payments: PaymentItem[];
  onCancelClick?: (payment: PaymentItem) => void;
  showInvoiceLink?: boolean;
}

export default function PaymentHistoryTable({
  payments,
  onCancelClick,
  showInvoiceLink = false,
}: PaymentHistoryTableProps) {
  if (payments.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-slate-450 dark:text-slate-500 font-medium">
        No payment history recorded for this transaction yet.
      </div>
    );
  }

  // Format methods
  const formatMethod = (method: string) => {
    return method.replace("_", " ");
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 dark:border-slate-850 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <th className="py-3 px-4">Transaction Date</th>
            <th className="py-3 px-4">Voucher No.</th>
            <th className="py-3 px-4">Method</th>
            <th className="py-3 px-4">Reference</th>
            <th className="py-3 px-4 text-right">Amount</th>
            <th className="py-3 px-4 text-center">Status</th>
            <th className="py-3 px-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-900 text-sm font-medium text-slate-700 dark:text-slate-350">
          {payments.map((payment) => {
            const dateObj = new Date(payment.paymentDate);
            const isCancelled = payment.status === "CANCELLED";

            return (
              <tr
                key={payment.id}
                className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors ${
                  isCancelled ? "opacity-60 bg-slate-50/20 dark:bg-slate-900/10" : ""
                }`}
              >
                {/* Date */}
                <td className="py-3 px-4">
                  {dayjs(payment.paymentDate).isValid()
                    ? dayjs(payment.paymentDate).format("DD MMM YYYY")
                    : "Invalid Date"}
                </td>

                {/* Number */}
                <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                  {payment.paymentNumber}
                </td>

                {/* Method */}
                <td className="py-3 px-4 text-xs font-bold uppercase">
                  {formatMethod(payment.paymentMethod)}
                </td>

                {/* Reference */}
                <td className="py-3 px-4 font-mono text-xs">
                  {payment.referenceNumber || "-"}
                </td>

                {/* Amount */}
                <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                  ₹{payment.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>

                {/* Status */}
                <td className="py-3 px-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <PaymentStatusBadge status={payment.status} />
                    {payment.cancellationReason && (
                      <span className="text-[10px] text-slate-400 italic max-w-[150px] truncate" title={payment.cancellationReason}>
                        Reason: {payment.cancellationReason}
                      </span>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {/* View Details */}
                    <Link href={`/trading/payments/${payment.id}`}>
                      <Button
                        variant="tertiary"
                        size="sm"
                        className="h-8 w-8 min-w-0 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="View Receipt"
                      >
                        <Eye className="w-4 h-4 text-slate-500" />
                      </Button>
                    </Link>

                    {/* Cancel Payment Action */}
                    {!isCancelled && onCancelClick && (
                      <Button
                        variant="tertiary"
                        size="sm"
                        className="h-8 w-8 min-w-0 p-0 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => onCancelClick(payment)}
                        aria-label="Cancel Payment"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
