"use client";

import React from "react";
import { Table as HeroUITable } from "@heroui/react";

interface HeaderItem {
  key: string;
  label: string;
  className?: string;
}

interface TableProps<T> {
  headers: HeaderItem[];
  data: T[];
  renderCell: (item: T, columnKey: string) => React.ReactNode;
  renderMobileCard?: (item: T) => React.ReactNode;
  keyField: keyof T;
  onRowClick?: (item: T) => void;
  emptyState?: React.ReactNode;
}

export default function Table<T>({
  headers,
  data,
  renderCell,
  renderMobileCard,
  keyField,
  onRowClick,
  emptyState,
}: TableProps<T>) {
  const isClickable = !!onRowClick;

  if (data.length === 0 && emptyState) {
    return <div className="py-4">{emptyState}</div>;
  }

  // Fallback default mobile card if no renderMobileCard is specified
  const defaultMobileCard = (item: T) => {
    return (
      <div className="flex flex-col gap-2">
        {headers.map((col) => (
          <div key={col.key} className="flex justify-between items-start gap-3 text-sm border-b border-slate-50 dark:border-slate-900/50 pb-1.5 last:border-b-0 last:pb-0">
            <span className="font-bold text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider shrink-0 mt-0.5">
              {col.label}
            </span>
            <span className="text-slate-800 dark:text-slate-200 text-right text-xs font-semibold break-words min-w-0 flex-1">
              {renderCell(item, col.key)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Mobile Card Stack Layout (hidden on tablet/desktop) */}
      <div className="flex flex-col gap-2.5 md:hidden">
        {data.map((item) => {
          const key = String(item[keyField]);
          return (
            <div
              key={key}
              onClick={() => onRowClick?.(item)}
              className={`p-3.5 rounded-xl bg-white border border-slate-100 dark:bg-slate-955 dark:border-slate-900 shadow-sm transition-all duration-200 ${
                isClickable ? "active:scale-[0.98] cursor-pointer hover:bg-slate-50/55 dark:hover:bg-slate-900/40" : ""
              }`}
            >
              {renderMobileCard ? renderMobileCard(item) : defaultMobileCard(item)}
            </div>
          );
        })}
      </div>

      {/* Desktop Grid Layout (hidden on mobile) */}
      <div className="hidden md:block">
        <HeroUITable className="shadow-sm border border-slate-100 dark:border-slate-900 rounded-2xl bg-white dark:bg-slate-950">
          <HeroUITable.ScrollContainer>
            <HeroUITable.Content aria-label="Responsive data grid">
              <HeroUITable.Header>
                {headers.map((header, idx) => (
                  <HeroUITable.Column
                    key={header.key}
                    isRowHeader={idx === 0}
                    className={`bg-slate-50/60 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs py-3.5 ${
                      header.className || ""
                    }`}
                  >
                    {header.label}
                  </HeroUITable.Column>
                ))}
              </HeroUITable.Header>
              <HeroUITable.Body>
                {data.map((item) => {
                  const key = String(item[keyField]);
                  return (
                    <HeroUITable.Row
                      key={key}
                      onClick={() => onRowClick?.(item)}
                      className={`border-b border-slate-50 dark:border-slate-900 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors ${
                        isClickable ? "cursor-pointer" : ""
                      }`}
                    >
                      {headers.map((col) => (
                        <HeroUITable.Cell key={col.key} className="py-4 text-slate-800 dark:text-slate-200">
                          {renderCell(item, col.key)}
                        </HeroUITable.Cell>
                      ))}
                    </HeroUITable.Row>
                  );
                })}
              </HeroUITable.Body>
            </HeroUITable.Content>
          </HeroUITable.ScrollContainer>
        </HeroUITable>
      </div>
    </div>
  );
}
