import React from "react";
import { Card as HeroUICard, CardHeader, CardContent, CardFooter } from "@heroui/react";

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
        <CardHeader className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex flex-col min-w-0">
            {title && (
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div className="flex-shrink-0 ml-4">{headerAction}</div>}
        </CardHeader>
      )}
      <CardContent className="px-6 py-4">{children}</CardContent>
      {footerAction && (
        <CardFooter className="px-6 py-4 border-t border-slate-50 bg-slate-50/50 dark:border-slate-900 dark:bg-slate-900/10">
          <div className="flex w-full items-center justify-end gap-3">{footerAction}</div>
        </CardFooter>
      )}
    </HeroUICard>
  );
}
