"use client";

import React, { forwardRef } from "react";

interface StatusToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
  error?: any;
}

export const StatusToggle = forwardRef<HTMLInputElement, StatusToggleProps>(
  ({ label, description, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3 py-1">
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              ref={ref}
              className="sr-only peer"
              {...props}
            />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:bg-slate-950 peer-checked:bg-slate-900 dark:peer-checked:bg-slate-50"></div>
          </label>
          <div className="flex flex-col">
            {label && (
              <span className="text-sm font-bold text-slate-700 dark:text-slate-350">
                {label}
              </span>
            )}
            {description && (
              <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                {description}
              </span>
            )}
          </div>
        </div>
        {error && error.message && (
          <span className="text-xs text-red-500 mt-0.5">{String(error.message)}</span>
        )}
      </div>
    );
  }
);

StatusToggle.displayName = "StatusToggle";
