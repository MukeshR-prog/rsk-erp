import { Skeleton as HeroUISkeleton } from "@heroui/react";

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 w-full">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4.5 rounded-2xl border border-slate-100 bg-white dark:border-slate-900 dark:bg-slate-950 flex flex-col gap-3">
          <HeroUISkeleton className="w-12 h-3.5 rounded-lg" />
          <HeroUISkeleton className="w-24 h-7 rounded-lg" />
          <HeroUISkeleton className="w-20 h-3 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full flex flex-col gap-4">
      {/* Mobile view skeletons */}
      <div className="flex flex-col gap-4 md:hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-5 rounded-2xl border border-slate-100 bg-white dark:border-slate-900 dark:bg-slate-950 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <HeroUISkeleton className="w-16 h-3 rounded-lg" />
              <HeroUISkeleton className="w-28 h-4.5 rounded-lg" />
            </div>
            <div className="flex justify-between items-center">
              <HeroUISkeleton className="w-20 h-3 rounded-lg" />
              <HeroUISkeleton className="w-24 h-4.5 rounded-lg" />
            </div>
            <div className="flex justify-between items-center">
              <HeroUISkeleton className="w-12 h-3 rounded-lg" />
              <HeroUISkeleton className="w-16 h-4.5 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop view skeleton */}
      <div className="hidden md:flex flex-col gap-4 border border-slate-100 dark:border-slate-900 rounded-2xl bg-white dark:bg-slate-950 p-6">
        <div className="flex gap-4 border-b border-slate-50 dark:border-slate-900 pb-3">
          <HeroUISkeleton className="w-1/4 h-4.5 rounded-lg" />
          <HeroUISkeleton className="w-1/4 h-4.5 rounded-lg" />
          <HeroUISkeleton className="w-1/4 h-4.5 rounded-lg" />
          <HeroUISkeleton className="w-1/4 h-4.5 rounded-lg" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center py-2.5">
            <HeroUISkeleton className="w-1/4 h-4 rounded-lg" />
            <HeroUISkeleton className="w-1/4 h-4 rounded-lg" />
            <HeroUISkeleton className="w-1/4 h-4 rounded-lg" />
            <HeroUISkeleton className="w-1/4 h-4 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-6 rounded-2xl border border-slate-100 bg-white dark:border-slate-900 dark:bg-slate-950 flex flex-col gap-4">
      <HeroUISkeleton className="w-1/3 h-5 rounded-lg" />
      <HeroUISkeleton className="w-2/3 h-3 rounded-lg" />
      <div className="flex flex-col gap-3.5 mt-2">
        <HeroUISkeleton className="w-full h-11 rounded-xl" />
        <HeroUISkeleton className="w-full h-11 rounded-xl" />
        <HeroUISkeleton className="w-full h-11 rounded-xl" />
      </div>
    </div>
  );
}
