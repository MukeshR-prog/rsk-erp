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
    statusBadgeClass = "bg-green-500/10 text-green-600 border-green-200/50 dark:bg-green-500/10 dark:text-green-400 dark:border-green-900/50";
    statusText = "Fully Paid";
  } else if (paymentStatus === "PARTIALLY_PAID") {
    statusBadgeClass = "bg-amber-500/10 text-amber-600 border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-900/50";
    statusText = "Partially Paid";
  } else {
    statusBadgeClass = "bg-rose-500/10 text-rose-600 border-rose-200/50 dark:bg-rose-500/10 dark:text-rose-450 dark:border-rose-900/50";
    statusText = "Unpaid";
  }

  return (
    <Card title="Payment Summary" subtitle="Invoice settlement statistics">
      <div className="flex flex-col gap-3 mt-2">
        {/* Total Grand */}
        <div className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-850">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Grand Total
          </span>
          <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Total Paid */}
        <div className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-850">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Paid
          </span>
          <span className="text-base font-extrabold text-green-600 dark:text-green-400">
            ₹{totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Balance Due */}
        <div className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-850">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Balance Due
          </span>
          <span className={`text-base font-extrabold ${remainingBalance > 0.01 ? "text-rose-600 dark:text-rose-450" : "text-slate-650 dark:text-slate-405"}`}>
            ₹{remainingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Current Settlement Status */}
        <div className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-850">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Status
          </span>
          <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${statusBadgeClass}`}>
            {statusText}
          </span>
        </div>
      </div>
    </Card>
  );
}
