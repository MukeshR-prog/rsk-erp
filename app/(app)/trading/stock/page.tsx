"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useForm, Controller } from "react-hook-form";
import ProductSelector from "@/components/ui/ProductSelector";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import {
  Button,
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { Search, AlertTriangle, CheckCircle, SlidersHorizontal, Edit3, Settings, X } from "lucide-react";
import toast from "react-hot-toast";
import { getProducts } from "@/features/master-data/products/actions";
import { createStockAdjustmentAction } from "@/features/inventory/actions";
import { QuantityInput } from "@/components/ui/form/QuantityInput";

interface ProductStockData {
  id: string;
  code: string;
  name: string;
  type: "RAW_MATERIAL" | "FINISHED_GOOD" | "TRADING_PRODUCT";
  currentStock: number;
  minStockAlert?: number | null;
  piecesPerBox?: number | null;
  isActive: boolean;
}

function TradingStockPageContent() {
  const [stockList, setStockList] = useState<ProductStockData[]>([]);
  const [productListForLookup, setProductListForLookup] = useState<ProductStockData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL_TRADING");
  const [isPending, startTransition] = useTransition();

  // Form State
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [formPending, setFormPending] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<any>({
    defaultValues: {
      productId: "",
      direction: "INCREASE",
      qtyBoxes: 0,
      notes: "",
    },
  });

  const loadStock = () => {
    startTransition(async () => {
      // For list filters
      let apiType: any = "ALL";
      if (selectedTypeFilter === "FINISHED_GOOD") apiType = "FINISHED_GOOD";
      if (selectedTypeFilter === "TRADING_PRODUCT") apiType = "TRADING_PRODUCT";

      const res = await getProducts({
        search,
        page,
        pageSize: 10,
        showInactive: false,
        type: apiType,
      });

      if (res.success && res.data) {
        // Filter in UI if 'ALL_TRADING' is selected to ignore raw materials
        let filtered = res.data as any[];
        if (selectedTypeFilter === "ALL_TRADING") {
          filtered = filtered.filter(x => x.type === "FINISHED_GOOD" || x.type === "TRADING_PRODUCT");
        }
        setStockList(filtered);
        setTotal(res.meta.total);
        setTotalPages(res.meta.totalPages);
      } else {
        toast.error(res.error || "Failed to load stock data");
      }
    });
  };

  const loadLookupProducts = async () => {
    const res = await getProducts({
      pageSize: 100,
      showInactive: false,
      type: "ALL",
    });
    if (res.success && res.data) {
      // Only Finished Goods and Trading Products are adjustable on trading inventory
      const lookups = (res.data as any[]).filter(
        (x) => x.type === "FINISHED_GOOD" || x.type === "TRADING_PRODUCT"
      );
      setProductListForLookup(lookups);
    }
  };

  useEffect(() => {
    loadStock();
  }, [page, selectedTypeFilter]);

  useEffect(() => {
    loadLookupProducts();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadStock();
  };

  const handleOpenAdjustment = () => {
    reset({
      productId: productListForLookup[0]?.id || "",
      direction: "INCREASE",
      qtyBoxes: "",
      notes: "",
    });
    setIsAdjustmentOpen(true);
  };

  const onSaveAdjustment = async (values: any) => {
    try {
      setFormPending(true);
      const directionMult = values.direction === "INCREASE" ? 1 : -1;
      const quantity = Number(values.qtyBoxes) * directionMult;

      const res = await createStockAdjustmentAction({
        productId: values.productId,
        quantity,
        notes: values.notes || "Manual stock adjustment",
      });

      if (res.success) {
        toast.success("Stock adjusted successfully");
        setIsAdjustmentOpen(false);
        reset();
        loadStock();
      } else {
        toast.error(res.error || "Failed to adjust stock");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setFormPending(false);
    }
  };

  const tableHeaders = [
    { key: "code", label: "SKU / Code" },
    { key: "name", label: "Product Name" },
    { key: "type", label: "Product Type" },
    { key: "boxes", label: "Stock (Boxes)", className: "text-right" },
    { key: "piecesPerBox", label: "Pieces / Box", className: "text-right" },
    { key: "pieces", label: "Total Pieces", className: "text-right" },
    { key: "status", label: "Status", className: "w-36 text-right" },
  ];

  const renderCell = (item: ProductStockData, columnKey: string) => {
    const piecesPerBox = item.piecesPerBox || 1000;
    const totalPieces = item.currentStock * piecesPerBox;
    const isLow = item.minStockAlert !== null && item.minStockAlert !== undefined && item.currentStock <= item.minStockAlert;

    switch (columnKey) {
      case "type":
        return (
          <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-bold ${
            item.type === "FINISHED_GOOD" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
          }`}>
            {item.type === "FINISHED_GOOD" ? "Manufactured" : "Trading Goods"}
          </span>
        );
      case "boxes":
        return <span className="font-bold text-slate-900 dark:text-slate-100">{item.currentStock.toLocaleString()} Bxs</span>;
      case "piecesPerBox":
        return <span className="font-semibold text-slate-400">{piecesPerBox.toLocaleString()}</span>;
      case "pieces":
        return <span className="font-extrabold text-emerald-650">{totalPieces.toLocaleString()} Pcs</span>;
      case "status":
        return (
          <div className="flex justify-end">
            {isLow ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-605 dark:bg-red-950/20 dark:text-red-400">
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
            <span className="font-bold text-slate-900 dark:text-slate-55 text-base truncate max-w-[180px]">{item.name}</span>
          </div>
          {isLow ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-650">
              <AlertTriangle className="w-3 h-3" />
              <span>Low Stock</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-650">
              <CheckCircle className="w-3 h-3" />
              <span>Optimal</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-t border-slate-100 dark:border-slate-850 pt-2.5 mt-1 text-xs font-semibold text-slate-500">
          <div>Type: <span className="font-bold text-slate-855 dark:text-slate-350">{item.type}</span></div>
          <div>Boxes: <span className="font-bold text-slate-900 dark:text-slate-50">{item.currentStock} Bxs</span></div>
          <div>Pieces/Box: <span>{piecesPerBox.toLocaleString()}</span></div>
          <div className="col-span-2 border-t border-slate-50 pt-2 flex justify-between items-center text-sm">
            <span className="text-slate-400 text-xs">Total Pieces:</span>
            <span className="font-extrabold text-emerald-600">{totalPieces.toLocaleString()} Pcs</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Centralized stock ledger"
        subtitle="Manage finished goods and trading items safety alerts and manual audits"
        action={
          <Button
            variant="primary"
            onPress={handleOpenAdjustment}
            className="w-full sm:w-auto font-bold rounded-xl h-11 bg-slate-900 hover:bg-slate-850 text-white dark:bg-slate-50 dark:text-slate-950 border-none"
            size="md"
          >
            <SlidersHorizontal className="w-4.5 h-4.5 mr-1.5" />
            <span>Adjust Stock</span>
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        {/* Type Select filter */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-150 dark:border-slate-850 shadow-sm w-full md:w-auto">
          <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Type</span>
          <select
            value={selectedTypeFilter}
            onChange={(e) => {
              setPage(1);
              setSelectedTypeFilter(e.target.value);
            }}
            className="text-sm font-bold text-slate-800 dark:text-slate-200 bg-transparent border-none outline-none cursor-pointer"
          >
            <option value="ALL_TRADING">All Trading Items</option>
            <option value="FINISHED_GOOD">Manufactured finished goods</option>
            <option value="TRADING_PRODUCT">Trading Products</option>
          </select>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:max-w-xs">
          <div className="relative flex items-center w-full">
            <Search className="absolute left-3.5 text-slate-400 w-4.5 h-4.5" />
            <input
              type="text"
              placeholder="Search SKU or name..."
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
                No inventory items found. Adjust filters or search terms.
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

      {/* Stock Adjustment Modal */}
      <div
        className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
          isAdjustmentOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {/* Backdrop overlay */}
        <div
          onClick={() => setIsAdjustmentOpen(false)}
          className={`absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
            isAdjustmentOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Drawer container */}
        <div
          className={`relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between transform transition-transform duration-300 ease-out ${
            isAdjustmentOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <form onSubmit={handleSubmit(onSaveAdjustment)} className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" />
                <span>Perform Stock Adjustment</span>
              </span>
              <button
                type="button"
                onClick={() => setIsAdjustmentOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Controller
                    name="productId"
                    control={control}
                    rules={{ required: "Product is required" }}
                    render={({ field }) => (
                      <ProductSelector
                        products={productListForLookup}
                        selectedKey={field.value}
                        onSelectionChange={field.onChange}
                        label="Product *"
                        placeholder="Select or enter product name"
                        isCreatable={true}
                        isInvalid={!!errors.productId}
                        errorMessage={errors.productId?.message as string}
                      />
                    )}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-355">
                    Adjustment Type *
                  </label>
                  <select
                    {...register("direction")}
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-909 outline-none dark:border-slate-800 dark:bg-slate-955 dark:focus:border-slate-100 transition-all font-semibold"
                  >
                    <option value="INCREASE">Stock-In (+) Increase stock</option>
                    <option value="DECREASE">Stock-Out (-) Decrease stock</option>
                  </select>
                </div>

                <QuantityInput
                  label="Adjustment Quantity (Boxes) *"
                  placeholder="e.g. 5"
                  error={errors.qtyBoxes}
                  {...register("qtyBoxes", { required: "Quantity is required", valueAsNumber: true, min: { value: 1, message: "Must adjust by at least 1 box" } })}
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-355">
                    Remarks / Reason *
                  </label>
                  <textarea
                    placeholder="e.g. Annual stock audit correction / damaged box wastage..."
                    {...register("notes", { required: "Reason is required" })}
                    className={`flex min-h-[70px] w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-955 ${
                      errors.notes ? "border-red-500 focus:border-red-655" : "border-slate-202 focus:border-slate-900 dark:border-slate-808"
                    }`}
                  />
                  {errors.notes && <span className="text-xs text-red-500">{String(errors.notes.message)}</span>}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
              <Button variant="ghost" onPress={() => setIsAdjustmentOpen(false)} type="button" className="font-semibold">
                Cancel
              </Button>
              <Button variant="primary" type="submit" isPending={formPending} className="px-5 font-semibold">
                Submit Adjustment
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function TradingStockPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-slate-505">Loading stock inventory...</div>}>
      <TradingStockPageContent />
    </Suspense>
  );
}
