import React from "react";

interface SaleSummaryCardProps {
  subtotal: number;
  discount: number;
  transportCharges: number;
  grandTotal: number;
  paidAmount?: number;
}

export const SaleSummaryCard: React.FC<SaleSummaryCardProps> = ({
  subtotal,
  discount,
  transportCharges,
  grandTotal,
  paidAmount = 0,
}) => {
  const dueAmount = Math.max(0, grandTotal - paidAmount);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
      <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">
        Invoice Payment Summary
      </h3>
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex justify-between text-slate-300">
          <span>Subtotal</span>
          <span>₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-rose-500">
          <span>Discount (-)</span>
          <span>₹{discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>Transport Charges (+)</span>
          <span>₹{transportCharges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="border-t border-slate-800 my-1"></div>
        <div className="flex justify-between text-base font-bold text-white">
          <span>Grand Total</span>
          <span className="text-emerald-500">
            ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>Amount Paid</span>
          <span className="text-blue-500">
            ₹{paidAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between text-sm font-bold text-slate-300">
          <span>Remaining Due</span>
          <span className="text-amber-500">
            ₹{dueAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
};
