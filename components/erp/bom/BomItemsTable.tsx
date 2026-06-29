import React from "react";

interface BomItem {
  id: string;
  materialId?: string;
  materialName: string;
  materialCode: string;
  materialUnit: string;
  quantity: number;
}

interface BomItemsTableProps {
  items: BomItem[];
}

export default function BomItemsTable({ items }: BomItemsTableProps) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 font-medium text-sm">
        No raw material items listed for this recipe.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-850">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-850">
            <th className="px-5 py-4 font-bold text-slate-600 dark:text-slate-400">#</th>
            <th className="px-5 py-4 font-bold text-slate-600 dark:text-slate-400">Raw Material</th>
            <th className="px-5 py-4 font-bold text-slate-600 dark:text-slate-400">SKU Code</th>
            <th className="px-5 py-4 font-bold text-slate-600 dark:text-slate-400 text-right">Required Quantity</th>
            <th className="px-5 py-4 font-bold text-slate-600 dark:text-slate-400">Unit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-850 bg-white dark:bg-slate-950">
          {items.map((item, index) => (
            <tr
              key={item.id || item.materialId || index}
              className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
            >
              <td className="px-5 py-4 font-semibold text-slate-500">{index + 1}</td>
              <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                {item.materialName}
              </td>
              <td className="px-5 py-4 font-medium text-slate-550 dark:text-slate-400">
                {item.materialCode}
              </td>
              <td className="px-5 py-4 font-extrabold text-slate-800 dark:text-slate-200 text-right text-base">
                {item.quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </td>
              <td className="px-5 py-4 font-bold text-slate-600 dark:text-slate-400">
                {item.materialUnit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
