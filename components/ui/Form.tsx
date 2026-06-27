import React from "react";

interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  const hasHeader = title || description;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-10 border-b border-slate-100 dark:border-slate-900 pb-6 mb-6 last:border-b-0 last:pb-0 last:mb-0">
      {hasHeader && (
        <div className="md:col-span-1">
          {title && (
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}
      <div className={hasHeader ? "md:col-span-2 flex flex-col gap-4.5" : "col-span-3 flex flex-col gap-4.5"}>
        {children}
      </div>
    </div>
  );
}

interface FormGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
}

export function FormGrid({ children, cols = 2 }: FormGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid ${gridCols[cols]} gap-5 w-full`}>
      {children}
    </div>
  );
}
