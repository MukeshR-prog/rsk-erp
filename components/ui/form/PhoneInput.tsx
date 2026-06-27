"use client";

import React, { forwardRef } from "react";

interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: any;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
      if (props.onChange) {
        props.onChange(e);
      }
    };

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
            {label}
          </label>
        )}
        <input
          type="tel"
          ref={ref}
          onChange={handleChange}
          className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-955 ${
            error
              ? "border-red-500"
              : "border-slate-200 dark:border-slate-800 focus:border-slate-900 dark:focus:border-slate-100"
          } ${className}`}
          {...props}
        />
        {error && error.message && (
          <span className="text-xs text-red-500 mt-0.5">{String(error.message)}</span>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
