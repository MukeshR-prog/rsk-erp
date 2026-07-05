import React from "react";

interface SaleItem {
  id: string;
  productId: string;
  quantity: number | any;
  sellingRate: number | any;
  discount: number | any;
  lineTotal: number | any;
  remarks?: string | null;
  product: {
    name: string;
    code: string;
    volumeMl?: string | null;
    color?: string | null;
  };
}

interface SaleItemsTableProps {
  items: SaleItem[];
}

export const SaleItemsTable: React.FC<SaleItemsTableProps> = ({ items }) => {
  return (
    <div className="overflow-x-auto w-full rounded-2xl border border-slate-150 dark:border-slate-850 bg-white dark:bg-slate-950/20 shadow-xs">
      <table className="w-full text-left border-collapse text-sm text-slate-700 dark:text-slate-300">
        <thead>
          <tr className="bg-slate-50/60 dark:bg-slate-900/50 border-b border-slate-150 dark:border-slate-850 text-slate-500 dark:text-slate-450 font-bold text-xs uppercase">
            <th className="p-3.5">Code</th>
            <th className="p-3.5">Product Name</th>
            <th className="p-3.5 text-right">Sold Qty</th>
            <th className="p-3.5 text-right">Rate</th>
            <th className="p-3.5 text-right">Discount</th>
            <th className="p-3.5 text-right">Line Total</th>
            <th className="p-3.5">Remarks</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-850/50">
          {items.map((item) => {
            const qty = Number(item.quantity);
            const rate = Number(item.sellingRate);
            const disc = Number(item.discount);
            const total = Number(item.lineTotal);

            const spec = [item.product.volumeMl, item.product.color].filter(Boolean).join(" | ");

            return (
              <tr key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors">
                <td className="p-3.5 font-mono text-xs text-slate-550 dark:text-slate-400 font-semibold">{item.product.code}</td>
                <td className="p-3.5">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{item.product.name}</span>
                    {spec && <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-semibold">{spec}</span>}
                  </div>
                </td>
                <td className="p-3.5 text-right font-bold text-slate-900 dark:text-slate-100">
                  {qty.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                </td>
                <td className="p-3.5 text-right font-semibold text-slate-700 dark:text-slate-300">
                  ₹{rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="p-3.5 text-right font-bold text-rose-600 dark:text-rose-455">
                  ₹{disc.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="p-3.5 text-right font-black text-emerald-600 dark:text-emerald-450">
                  ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="p-3.5 text-slate-500 dark:text-slate-400 truncate max-w-[180px] font-medium" title={item.remarks || ""}>
                  {item.remarks || "-"}
                </td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan={7} className="p-8 text-center text-slate-450 dark:text-slate-500 font-bold uppercase text-xs tracking-wider">
                No items found on this invoice.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
