"use client";

import React, { forwardRef } from "react";

interface PriceInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: any;
}

export const PriceInput = forwardRef<HTMLInputElement, PriceInputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-500 dark:text-slate-400 font-semibold text-sm">
            ₹
          </span>
          <input
            type="number"
            step="0.01"
            ref={ref}
            className={`flex h-10 w-full rounded-xl border bg-white pl-8 pr-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-955 ${
              error
                ? "border-red-500"
                : "border-slate-200 dark:border-slate-800 focus:border-slate-900 dark:focus:border-slate-100"
            } ${className}`}
            {...props}
          />
        </div>
        {error && error.message && (
          <span className="text-xs text-red-500 mt-0.5">{String(error.message)}</span>
        )}
      </div>
    );
  }
);

PriceInput.displayName = "PriceInput";
