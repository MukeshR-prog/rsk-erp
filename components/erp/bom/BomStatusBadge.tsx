import React from "react";

interface BomStatusBadgeProps {
  isActive: boolean;
}

export default function BomStatusBadge({ isActive }: BomStatusBadgeProps) {
  if (!isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        <span>Inactive</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      <span>Active</span>
    </span>
  );
}
