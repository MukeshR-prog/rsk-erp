import { Spinner } from "@heroui/react";

export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[50vh] p-8">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" color="accent" />
        <p className="text-sm font-medium text-slate-400 dark:text-slate-500 animate-pulse">
          Loading page content...
        </p>
      </div>
    </div>
  );
}
