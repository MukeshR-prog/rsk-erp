"use client";

import React, { forwardRef } from "react";
import { Plus, Minus } from "lucide-react";

interface QuantityInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: any;
  onValueChange?: (val: number) => void;
}

export const QuantityInput = forwardRef<HTMLInputElement, QuantityInputProps>(
  ({ label, error, onValueChange, className = "", ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const handleRef = (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const handleStep = (step: number) => {
      if (!inputRef.current) return;
      const currentVal = parseFloat(inputRef.current.value) || 0;
      const nextVal = currentVal + step;
      inputRef.current.value = String(nextVal);
      
      // Trigger onChange to make it work with React Hook Form
      const event = new Event("input", { bubbles: true });
      inputRef.current.dispatchEvent(event);
      if (props.onChange) {
        const changeEvent = {
          target: inputRef.current
        } as React.ChangeEvent<HTMLInputElement>;
        props.onChange(changeEvent);
      }
      if (onValueChange) {
        onValueChange(nextVal);
      }
    };

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => handleStep(-1)}
            className="absolute left-1 flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            type="number"
            ref={handleRef}
            className={`flex h-10 w-full text-center rounded-xl border bg-white px-10 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-955 ${
              error
                ? "border-red-500"
                : "border-slate-200 dark:border-slate-800 focus:border-slate-900 dark:focus:border-slate-100"
            } ${className}`}
            {...props}
          />
          <button
            type="button"
            onClick={() => handleStep(1)}
            className="absolute right-1 flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {error && error.message && (
          <span className="text-xs text-red-500 mt-0.5">{String(error.message)}</span>
        )}
      </div>
    );
  }
);

QuantityInput.displayName = "QuantityInput";
