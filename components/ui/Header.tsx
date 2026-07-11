"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@heroui/react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  backHref?: string;
}

export default function Header({ title, subtitle, action, backHref }: HeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 dark:border-slate-900 pb-5 mb-6">
      <div className="flex items-start gap-3 min-w-0">
        {backHref && (
          <Link href={backHref} className="flex-shrink-0">
            <Button
              variant="ghost"
              aria-label="Go back"
              className="text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-50 w-10 h-10 p-0 rounded-xl min-w-0 flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight leading-tight break-words">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex items-center gap-3 w-full sm:w-auto flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}
