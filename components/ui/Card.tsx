import React from "react";
import { Card as HeroUICard } from "@heroui/react";

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  footerAction?: React.ReactNode;
  className?: string;
}

export default function Card({
  children,
  title,
  subtitle,
  headerAction,
  footerAction,
  className = "",
}: CardProps) {
  const hasHeader = title || subtitle || headerAction;

  return (
    <HeroUICard className={`shadow-sm border border-slate-100 dark:border-slate-900 ${className}`}>
      {hasHeader && (
        <div className="flex items-center justify-between px-3 sm:px-6 pt-3 sm:pt-5 pb-1.5 sm:pb-3 border-b border-slate-100/50 dark:border-slate-900/50">
          <div className="flex flex-col min-w-0 w-full">
            {title && (
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-50 truncate" title={title}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate" title={subtitle}>
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div className="flex-shrink-0 ml-4">{headerAction}</div>}
        </div>
      )}
      <div className="px-3 sm:px-6 py-2 sm:py-4 flex-1 min-w-0">{children}</div>
      {footerAction && (
        <div className="px-3 sm:px-6 py-2 sm:py-4 border-t border-slate-50 bg-slate-50/50 dark:border-slate-900 dark:bg-slate-900/10">
          <div className="flex w-full items-center justify-end gap-3">{footerAction}</div>
        </div>
      )}
    </HeroUICard>
  );
}
