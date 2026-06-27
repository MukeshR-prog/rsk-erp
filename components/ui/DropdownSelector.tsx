"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, X, Loader2 } from "lucide-react";

export interface DropdownOption {
  id: string;
  name: string;
  subtext?: string;
}

interface DropdownSelectorProps {
  options: DropdownOption[];
  selectedId?: string;
  onChange: (id: string) => void;
  label?: string;
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  isClearable?: boolean;
  isInvalid?: boolean;
  errorMessage?: string;
  className?: string;
}

export default function DropdownSelector({
  options,
  selectedId = "",
  onChange,
  label,
  placeholder = "Select an option...",
  loading = false,
  disabled = false,
  isClearable = true,
  isInvalid = false,
  errorMessage,
  className = "",
}: DropdownSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset search when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.id === selectedId) || null;
  }, [options, selectedId]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.name.toLowerCase().includes(query) ||
        (opt.subtext && opt.subtext.toLowerCase().includes(query))
    );
  }, [options, searchQuery]);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div ref={containerRef} className={`flex flex-col gap-1.5 w-full relative ${className}`}>
      {label && (
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => setIsOpen(!isOpen)}
          className={`flex h-10 w-full items-center justify-between rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold text-left select-none dark:bg-slate-950 cursor-pointer ${
            disabled ? "opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900" : ""
          } ${
            isInvalid
              ? "border-red-500 focus:border-red-650"
              : "border-slate-200 focus:border-slate-900 dark:border-slate-800 dark:focus:border-slate-100"
          }`}
        >
          <span className={`truncate ${!selectedOption ? "text-slate-400 font-normal" : "text-slate-900 dark:text-slate-100"}`}>
            {selectedOption ? selectedOption.name : placeholder}
          </span>

          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            {!loading && isClearable && selectedOption && (
              <span
                onClick={handleClear}
                className="p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                role="button"
                aria-label="Clear selection"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </div>
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-950 animate-in fade-in-50 slide-in-from-top-1 duration-150">
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-955 pb-1 px-1.5 pt-1.5">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-full rounded-lg border border-slate-100 bg-slate-50 pl-8 pr-3 text-xs outline-none focus:border-slate-900 focus:bg-white dark:border-slate-850 dark:bg-slate-900 dark:focus:border-slate-100 dark:focus:bg-slate-950 transition-all font-semibold"
                />
              </div>
            </div>

            <div className="mt-1">
              {filteredOptions.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400 font-semibold italic">
                  No items found
                </div>
              ) : (
                filteredOptions.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    className={`flex flex-col px-3 py-2 rounded-lg text-sm font-semibold cursor-pointer select-none transition-colors ${
                      opt.id === selectedId
                        ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-950"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                    }`}
                  >
                    <span>{opt.name}</span>
                    {opt.subtext && (
                      <span className={`text-[10px] ${
                        opt.id === selectedId ? "text-slate-300 dark:text-slate-600" : "text-slate-400"
                      } mt-0.5 font-normal`}>
                        {opt.subtext}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {isInvalid && errorMessage && (
        <span className="text-xs text-red-500">{errorMessage}</span>
      )}
    </div>
  );
}
