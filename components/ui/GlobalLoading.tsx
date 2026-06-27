"use client";

import { useUIStore } from "@/stores/useUIStore";
import { Spinner } from "@heroui/react";

export default function GlobalLoading() {
  const { globalLoading } = useUIStore();

  if (!globalLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm dark:bg-slate-950/70 transition-all duration-300">
      <div className="flex flex-col items-center gap-3 p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800">
        <Spinner size="lg" color="accent" />
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Processing transaction...</span>
      </div>
    </div>
  );
}
