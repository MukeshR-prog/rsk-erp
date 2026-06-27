import React from "react";
import { Card, CardContent } from "@heroui/react";
import { ClipboardList, LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export default function EmptyState({
  title = "No results found",
  description = "There are no records matching your query or search filter.",
  icon: Icon = ClipboardList,
  action,
}: EmptyStateProps) {
  return (
    <Card className="w-full shadow-sm border border-dashed border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/20 py-10 px-4">
      <CardContent className="flex flex-col items-center justify-center text-center gap-4">
        <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl dark:bg-slate-900 dark:text-slate-500 shadow-inner">
          <Icon className="w-8 h-8" />
        </div>
        <div className="flex flex-col gap-1 max-w-sm">
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {title}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
            {description}
          </p>
        </div>
        {action && <div className="mt-2">{action}</div>}
      </CardContent>
    </Card>
  );
}
