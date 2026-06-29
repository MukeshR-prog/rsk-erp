import React from "react";
import Card from "@/components/ui/Card";

interface PaymentSummaryCardProps {
  grandTotal: number;
  totalPaid: number;
  remainingBalance: number;
  paymentStatus: "UNPAID" | "PARTIALLY_PAID" | "PAID";
}

export default function PaymentSummaryCard({
  grandTotal,
  totalPaid,
  remainingBalance,
  paymentStatus,
}: PaymentSummaryCardProps) {
  // Determine color matching status
  let statusBadgeClass = "";
  let statusText = "";
  if (paymentStatus === "PAID") {
    statusBadgeClass = "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50";
    statusText = "Fully Paid";
  } else if (paymentStatus === "PARTIALLY_PAID") {
    statusBadgeClass = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50";
    statusText = "Partially Paid";
  } else {
    statusBadgeClass = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50";
    statusText = "Unpaid";
  }

  return (
    <Card title="Payment Summary" subtitle="Invoice settlement statistics">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-2">
        {/* Total Grand */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Invoice Grand Total
          </span>
          <span className="text-xl font-bold text-slate-805 dark:text-slate-105 block mt-1">
            ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Total Paid */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Total Settled / Paid
          </span>
          <span className="text-xl font-bold text-green-600 dark:text-green-400 block mt-1">
            ₹{totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Balance Due */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Remaining Balance Due
          </span>
          <span className={`text-xl font-bold block mt-1 ${remainingBalance > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-500"}`}>
            ₹{remainingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Current Settlement Status */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-col justify-center">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
            Payment Status
          </span>
          <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-bold border ${statusBadgeClass}`}>
            {statusText}
          </span>
        </div>
      </div>
    </Card>
  );
}
