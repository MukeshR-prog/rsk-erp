import React from "react";

interface PaymentStatusBadgeProps {
  status: "COMPLETED" | "CANCELLED";
}

export default function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  if (status === "CANCELLED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        <span>Cancelled</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
      <span>Completed</span>
    </span>
  );
}
