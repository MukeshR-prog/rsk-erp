"use client";

import React from "react";
import { usePathname } from "next/navigation";

export default function Loading() {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname?.startsWith("/auth/");
  const isWorkspaceSelectPage = pathname === "/workspace";

  // Simple clean card skeleton for Auth and Workspace select pages
  if (isAuthPage || isWorkspaceSelectPage) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[70vh] p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-3xl p-6 shadow-sm space-y-6 animate-pulse">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
            <div className="w-40 h-5 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="w-56 h-3 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </div>
          <div className="space-y-3">
            <div className="w-full h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="w-full h-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Dashboard & listing page skeleton layout
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2.5">
          {/* Page Title */}
          <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          {/* Subtitle */}
          <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800/60 rounded-lg" />
        </div>
        {/* Header Action Button */}
        <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0" />
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850 p-2.5 sm:p-4 space-y-2 shadow-xs"
          >
            {/* Title */}
            <div className="h-3 w-16 sm:w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
            {/* Value */}
            <div className="flex items-center gap-2 mt-1 sm:mt-2">
              <div className="w-7 h-7 sm:w-9 sm:h-9 bg-slate-200 dark:bg-slate-800 rounded-lg shrink-0" />
              <div className="h-4 sm:h-6 w-16 sm:w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Main content grid/list area skeleton */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-900 rounded-2xl p-4 space-y-4">
        {/* Search / Filters Bar Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 items-center">
          {/* Search box */}
          <div className="h-10 w-full sm:max-w-md bg-slate-200 dark:bg-slate-800 rounded-xl" />
          {/* Filters */}
          <div className="flex w-full sm:w-auto gap-2.5">
            <div className="h-10 w-1/2 sm:w-36 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-10 w-1/2 sm:w-36 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>

        {/* Date presets block */}
        <div className="h-16 w-full bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-850/60" />

        {/* List/Table rows skeleton */}
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-100/60 dark:border-slate-850"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-200 dark:bg-slate-850 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-24 sm:w-36 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-2.5 w-16 sm:w-24 bg-slate-200 dark:bg-slate-800/60 rounded-md" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-4.5 w-16 sm:w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
                <div className="h-6 w-12 sm:w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
