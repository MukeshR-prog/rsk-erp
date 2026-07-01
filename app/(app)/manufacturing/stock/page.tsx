"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import { Search, AlertTriangle, CheckCircle, Package } from "lucide-react";
import toast from "react-hot-toast";
import { getProducts } from "@/features/master-data/products/actions";
import { Button } from "@heroui/react";

interface ProductStockData {
  id: string;
  code: string;
  name: string;
  type: string;
  currentStock: number;
  minStockAlert?: number | null;
  piecesPerBox?: number | null;
  isActive: boolean;
  unit?: {
    name: string;
  } | null;
}

function StockPageContent() {
  const [stockList, setStockList] = useState<ProductStockData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const loadStock = () => {
    startTransition(async () => {
      const res = await getProducts({
        search,
        page,
        pageSize: 10,
        showInactive: false,
        type: "FINISHED_GOOD",
      });

      if (res.success && res.data) {
        setStockList(res.data as any);
        setTotal(res.meta.total);
        setTotalPages(res.meta.totalPages);
      } else {
        toast.error(res.error || "Failed to load stock data");
      }
    });
  };

  useEffect(() => {
    loadStock();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadStock();
  };

  const tableHeaders = [
    { key: "code", label: "SKU / Code" },
    { key: "name", label: "Product Name" },
    { key: "boxes", label: "Available Boxes", className: "text-right" },
    { key: "piecesPerBox", label: "Pieces / Box", className: "text-right" },
    { key: "pieces", label: "Available Pieces", className: "text-right" },
    { key: "minAlert", label: "Safety Alert Limit", className: "text-right" },
    { key: "status", label: "Stock Status", className: "w-36 text-right" },
  ];

  const renderCell = (item: ProductStockData, columnKey: string) => {
    const piecesPerBox = item.piecesPerBox || 1000;
    const totalPieces = item.currentStock * piecesPerBox;
    const isLow = item.minStockAlert !== null && item.minStockAlert !== undefined && item.currentStock <= item.minStockAlert;

    switch (columnKey) {
      case "boxes":
        return <span className="font-bold text-slate-900 dark:text-slate-100">{item.currentStock.toLocaleString()} Bxs</span>;
      case "piecesPerBox":
        return <span className="font-semibold text-slate-400">{piecesPerBox.toLocaleString()}</span>;
      case "pieces":
        return <span className="font-extrabold text-emerald-600">{totalPieces.toLocaleString()} Pcs</span>;
      case "minAlert":
        return <span className="font-semibold text-slate-500">{item.minStockAlert !== null ? `${item.minStockAlert} Bxs` : "—"}</span>;
      case "status":
        return (
          <div className="flex justify-end">
            {isLow ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400">
                <AlertTriangle className="w-3 h-3" />
                <span>Low Stock</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400">
                <CheckCircle className="w-3 h-3" />
                <span>Optimal</span>
              </span>
            )}
          </div>
        );
      default:
        return <span>{String(item[columnKey as keyof ProductStockData] || "—")}</span>;
    }
  };

  const renderMobileCard = (item: ProductStockData) => {
    const piecesPerBox = item.piecesPerBox || 1000;
    const totalPieces = item.currentStock * piecesPerBox;
    const isLow = item.minStockAlert !== null && item.minStockAlert !== undefined && item.currentStock <= item.minStockAlert;

    return (
      <div className="flex flex-col gap-2.5 w-full">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              {item.code}
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-50 text-base">{item.name}</span>
          </div>
          {isLow ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-650 dark:bg-red-950/20 dark:text-red-400">
              <AlertTriangle className="w-3 h-3" />
              <span>Low Stock</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-650 dark:bg-green-950/20 dark:text-green-400">
              <CheckCircle className="w-3 h-3" />
              <span>Optimal</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-t border-slate-100 dark:border-slate-850 pt-2.5 mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <div>Boxes: <span className="font-bold text-slate-800 dark:text-slate-200">{item.currentStock.toLocaleString()} Bxs</span></div>
          <div>Pieces/Box: <span className="font-semibold">{piecesPerBox.toLocaleString()}</span></div>
          <div className="col-span-2 border-t border-slate-50 dark:border-slate-900 pt-2 flex justify-between items-center text-sm">
            <span className="text-slate-400 text-xs">Total Pieces:</span>
            <span className="font-extrabold text-emerald-600">{totalPieces.toLocaleString()} Pcs</span>
          </div>
          {item.minStockAlert !== null && (
            <div className="col-span-2 text-[10px] text-slate-400 italic">
              Safety alert threshold is set to {item.minStockAlert} Boxes.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Finished Goods Stock"
        subtitle="Centralized inventory tracking for manufactured cups and paper rolls"
      />

      <div className="flex justify-end items-center">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:max-w-xs">
          <div className="relative flex items-center w-full">
            <Search className="absolute left-3.5 text-slate-400 w-4.5 h-4.5" />
            <input
              type="text"
              placeholder="Search by code or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-800 dark:bg-slate-955 dark:focus:border-slate-100 outline-none text-sm transition-all font-semibold"
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      <Card>
        {isPending ? (
          <div className="py-20 text-center font-medium text-slate-500">Loading stock inventory...</div>
        ) : (
          <Table<ProductStockData>
            headers={tableHeaders}
            data={stockList}
            renderCell={renderCell}
            renderMobileCard={renderMobileCard}
            keyField="id"
            emptyState={
              <div className="py-12 text-center text-slate-500 font-medium">
                No finished goods stock items found.
              </div>
            }
          />
        )}

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <span className="text-xs text-slate-500 dark:text-slate-400">Total items: {total}</span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                isDisabled={page === 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                isDisabled={page === totalPages}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function StockPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-slate-500">Loading stock inventory...</div>}>
      <StockPageContent />
    </Suspense>
  );
}
