"use client";

import nextDynamic from "next/dynamic";
import { Suspense } from "react";

const ReportsPageContent = nextDynamic(
  () => import("./content"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[80vh] items-center justify-center bg-slate-50 dark:bg-slate-955">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-slate-350 border-t-slate-900 animate-spin" />
          <span className="text-xs text-slate-550 font-semibold tracking-wider uppercase">Loading chart engine...</span>
        </div>
      </div>
    )
  }
);

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-slate-500">Loading manufacturing reports...</div>}>
      <ReportsPageContent />
    </Suspense>
  );
}

export const dynamic = "force-dynamic";
