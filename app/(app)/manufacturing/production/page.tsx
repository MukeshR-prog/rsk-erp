"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
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
import { Search, Plus, Edit, Trash2, Calendar, Factory, Layers, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  createProductionEntryAction,
  updateProductionEntryAction,
  deleteProductionEntryAction,
  getProductionEntriesAction,
  getProductionProductsAction,
} from "@/features/manufacturing/actions";
import dayjs from "dayjs";
import { QuantityInput } from "@/components/ui/form/QuantityInput";

interface ProductionData {
  id: string;
  productionNumber: string;
  productId: string;
  boxesProduced: number;
  piecesPerBox: number;
  totalPieces: number;
  productionDate: string;
  notes?: string | null;
  product: {
    name: string;
    code: string;
  };
}

interface ProductOption {
  id: string;
  name: string;
  code: string;
  piecesPerBox: number;
}

function ProductionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const triggerNew = searchParams.get("new") === "true";

  const [entries, setEntries] = useState<ProductionData[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedProductFilter, setSelectedProductFilter] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  // Form Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ProductionData | null>(null);
  const [formPending, setFormPending] = useState(false);

  // Delete States
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState<ProductionData | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<any>({
    defaultValues: {
      productId: "",
      boxesProduced: 0,
      piecesPerBox: 1000,
      notes: "",
      productionDate: dayjs().format("YYYY-MM-DD"),
    },
  });

  const watchedProductId = watch("productId");
  const watchedBoxesProduced = watch("boxesProduced");
  const watchedPiecesPerBox = watch("piecesPerBox");

  const [computedTotalPieces, setComputedTotalPieces] = useState(0);

  // Autofill piecesPerBox when product changes
  useEffect(() => {
    if (watchedProductId && !editingEntry) {
      const prod = products.find((p) => p.id === watchedProductId);
      if (prod) {
        setValue("piecesPerBox", prod.piecesPerBox);
      }
    }
  }, [watchedProductId, products, editingEntry]);

  // Recalculate computed total pieces
  useEffect(() => {
    const boxes = Number(watchedBoxesProduced || 0);
    const pieces = Number(watchedPiecesPerBox || 0);
    setComputedTotalPieces(boxes * pieces);
  }, [watchedBoxesProduced, watchedPiecesPerBox]);

  const loadProducts = async () => {
    const res = await getProductionProductsAction();
    if (res.success && res.data) {
      setProducts(res.data as any);
    }
  };

  const loadEntries = () => {
    startTransition(async () => {
      const res = await getProductionEntriesAction({
        search,
        productId: selectedProductFilter,
        page,
        pageSize: 10,
      });

      if (res.success && res.data) {
        setEntries(res.data.items as any);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      } else {
        toast.error(res.error || "Failed to load production entries");
      }
    });
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadEntries();
  }, [page, selectedProductFilter]);

  useEffect(() => {
    if (triggerNew && products.length > 0 && !isFormOpen) {
      handleOpenForm(null);
      router.replace("/manufacturing/production");
    }
  }, [triggerNew, products]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadEntries();
  };

  const handleOpenForm = (entry: ProductionData | null = null) => {
    setEditingEntry(entry);
    if (entry) {
      setValue("productId", entry.productId);
      setValue("boxesProduced", entry.boxesProduced);
      setValue("piecesPerBox", entry.piecesPerBox);
      setValue("notes", entry.notes || "");
      setValue("productionDate", dayjs(entry.productionDate).format("YYYY-MM-DD"));
    } else {
      reset({
        productId: products[0]?.id || "",
        boxesProduced: "",
        piecesPerBox: products[0]?.piecesPerBox || 1000,
        notes: "",
        productionDate: dayjs().format("YYYY-MM-DD"),
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingEntry(null);
    reset();
  };

  const onSave = async (values: any) => {
    try {
      setFormPending(true);
      const payload = {
        ...values,
        boxesProduced: Number(values.boxesProduced),
        piecesPerBox: Number(values.piecesPerBox),
      };

      let res;
      if (editingEntry) {
        res = await updateProductionEntryAction({
          id: editingEntry.id,
          ...payload,
        });
      } else {
        res = await createProductionEntryAction(payload);
      }

      if (res.success) {
        toast.success(editingEntry ? "Production entry updated" : "Production recorded successfully");
        handleCloseForm();
        loadEntries();
      } else {
        toast.error(res.error || "Failed to save production log");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setFormPending(false);
    }
  };

  const handleDeleteClick = (entry: ProductionData, e: any) => {
    e.stopPropagation();
    setDeletingEntry(entry);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingEntry) return;
    try {
      const res = await deleteProductionEntryAction(deletingEntry.id);
      if (res.success) {
        toast.success("Production log deleted & inventory reversed");
        loadEntries();
      } else {
        toast.error(res.error || "Failed to delete entry");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setConfirmOpen(false);
      setDeletingEntry(null);
    }
  };

  const tableHeaders = [
    { key: "productionNumber", label: "Production No" },
    { key: "product", label: "Finished Product" },
    { key: "boxesProduced", label: "Boxes Produced", className: "text-right" },
    { key: "piecesPerBox", label: "Pieces/Box", className: "text-right" },
    { key: "totalPieces", label: "Total Pieces", className: "text-right" },
    { key: "productionDate", label: "Production Date" },
    { key: "actions", label: "Actions", className: "w-28 text-right" },
  ];

  const renderCell = (item: ProductionData, columnKey: string) => {
    switch (columnKey) {
      case "product":
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 dark:text-slate-100">{item.product?.name}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5">SKU: {item.product?.code}</span>
          </div>
        );
      case "boxesProduced":
        return <span className="font-bold text-emerald-600">{item.boxesProduced} Boxes</span>;
      case "piecesPerBox":
        return <span className="font-semibold text-slate-450">{item.piecesPerBox.toLocaleString()}</span>;
      case "totalPieces":
        return <span className="font-extrabold text-slate-900 dark:text-slate-50">{item.totalPieces.toLocaleString()} pcs</span>;
      case "productionDate":
        return <span className="font-semibold text-slate-550 dark:text-slate-400">{dayjs(item.productionDate).format("DD MMM YYYY")}</span>;
      case "actions":
        return (
          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              variant="ghost"
              onPress={() => handleOpenForm(item)}
              aria-label="Edit production log"
              className="min-w-0 p-1.5 text-slate-500 border-none shadow-none hover:bg-slate-100"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onPress={(e) => handleDeleteClick(item, e)}
              aria-label="Delete production log"
              className="min-w-0 p-1.5 text-red-550 border-none shadow-none hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      default:
        return <span>{String(item[columnKey as keyof ProductionData] || "—")}</span>;
    }
  };

  const renderMobileCard = (item: ProductionData) => {
    return (
      <div className="flex flex-col gap-2.5 w-full">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              {item.productionNumber}
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-50 text-base">{item.product?.name}</span>
            <span className="text-[10px] text-slate-400 font-semibold">SKU: {item.product?.code}</span>
          </div>
          <span className="font-bold text-emerald-600 text-sm">
            {item.boxesProduced} Boxes
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-850 pt-2.5 mt-1 font-semibold">
          <div>Pieces/Box: {item.piecesPerBox.toLocaleString()}</div>
          <div className="text-right font-extrabold text-slate-800 dark:text-slate-200">Total: {item.totalPieces.toLocaleString()} pcs</div>
        </div>

        <div className="flex justify-between items-center mt-1 text-xs">
          <div className="flex items-center gap-1 text-slate-400 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{dayjs(item.productionDate).format("DD MMM YYYY")}</span>
          </div>
        </div>

        {item.notes && (
          <p className="text-xs text-slate-450 italic mt-0.5 border-t border-slate-100 dark:border-slate-850 pt-2">
            Note: {item.notes}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-50 dark:border-slate-905/30 pt-2 mt-1">
          <Button size="sm" variant="ghost" onPress={() => handleOpenForm(item)} className="border-none min-w-0 p-1 text-slate-650">
            <Edit className="w-4 h-4 mr-1 text-slate-650" />
            <span>Edit</span>
          </Button>
          <Button size="sm" variant="ghost" onPress={(e) => handleDeleteClick(item, e)} className="border-none min-w-0 p-1 text-red-500 hover:text-red-650">
            <Trash2 className="w-4 h-4 mr-1 text-red-500" />
            <span>Delete</span>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Production Entries"
        subtitle="Log factory manufactured finished articles directly to stock"
        action={
          <Button
            variant="primary"
            onPress={() => handleOpenForm(null)}
            className="w-full sm:w-auto font-bold rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white border-none"
            size="md"
          >
            <Plus className="w-4.5 h-4.5 mr-1.5" />
            <span>Record Production</span>
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        {/* Product selector filter */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-150 dark:border-slate-850 shadow-sm w-full md:w-auto">
          <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Product</span>
          <select
            value={selectedProductFilter}
            onChange={(e) => {
              setPage(1);
              setSelectedProductFilter(e.target.value);
            }}
            className="text-sm font-bold text-slate-800 dark:text-slate-200 bg-transparent border-none outline-none cursor-pointer"
          >
            <option value="ALL">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:max-w-xs">
          <div className="relative flex items-center w-full">
            <Search className="absolute left-3.5 text-slate-400 w-4.5 h-4.5" />
            <input
              type="text"
              placeholder="Search product name..."
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
          <div className="py-20 text-center font-medium text-slate-500">Loading production history...</div>
        ) : (
          <Table<ProductionData>
            headers={tableHeaders}
            data={entries}
            renderCell={renderCell}
            renderMobileCard={renderMobileCard}
            keyField="id"
            emptyState={
              <div className="py-12 text-center text-slate-500 font-medium">
                No manufacturing runs recorded in this period.
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

      {/* Production Form Modal */}
      <div
        className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
          isFormOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {/* Backdrop overlay */}
        <div
          onClick={handleCloseForm}
          className={`absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
            isFormOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Drawer container */}
        <div
          className={`relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between transform transition-transform duration-300 ease-out ${
            isFormOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <form onSubmit={handleSubmit(onSave)} className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <Factory className="w-5 h-5 text-emerald-650" />
                <span>{editingEntry ? "Edit Production Entry" : "Record Finished Goods Production"}</span>
              </span>
              <button
                type="button"
                onClick={handleCloseForm}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Product Produced *
                  </label>
                  <select
                    {...register("productId")}
                    disabled={!!editingEntry}
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-900 outline-none dark:border-slate-800 dark:bg-slate-955 dark:focus:border-slate-100 transition-all font-semibold disabled:opacity-60"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                  {errors.productId && <span className="text-xs text-red-505">{String(errors.productId.message)}</span>}
                </div>

                <QuantityInput
                  label="Boxes Produced *"
                  placeholder="e.g. 25"
                  error={errors.boxesProduced}
                  {...register("boxesProduced", { required: "Boxes is required", valueAsNumber: true })}
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-355">
                    Pieces per Box *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1000"
                    {...register("piecesPerBox", { required: "Pieces/Box is required", valueAsNumber: true })}
                    className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-955 ${
                      errors.piecesPerBox ? "border-red-500 focus:border-red-655" : "border-slate-200 focus:border-slate-900 dark:border-slate-800"
                    }`}
                  />
                  {errors.piecesPerBox && <span className="text-xs text-red-500">{String(errors.piecesPerBox.message)}</span>}
                </div>

                {/* Auto calculated total pieces display */}
                <div className="flex flex-col gap-1 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-850">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    Auto Calculated Yield
                  </span>
                  <span className="text-base font-extrabold text-slate-850 dark:text-slate-200">
                    {computedTotalPieces.toLocaleString()} Pieces
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Total Pieces = Boxes Produced × Pieces Per Box
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-355">
                    Production Date *
                  </label>
                  <input
                    type="date"
                    {...register("productionDate", { required: "Date is required" })}
                    className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-955 ${
                      errors.productionDate ? "border-red-500 focus:border-red-600" : "border-slate-200 focus:border-slate-900 dark:border-slate-805"
                    }`}
                  />
                  {errors.productionDate && <span className="text-xs text-red-500">{String(errors.productionDate.message)}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-355">
                    Notes (optional)
                  </label>
                  <textarea
                    placeholder="Write any batch codes or operator remarks..."
                    {...register("notes")}
                    className="flex min-h-[60px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-955 dark:border-slate-808 focus:border-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
              <Button variant="ghost" onPress={handleCloseForm} type="button" className="font-semibold">
                Cancel
              </Button>
              <Button variant="primary" type="submit" isPending={formPending} className="px-5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white border-none">
                {editingEntry ? "Save Changes" : "Log Production"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation */}
      {confirmOpen && deletingEntry && (
        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => {
            setConfirmOpen(false);
            setDeletingEntry(null);
          }}
          title="Delete Production Entry"
          message={`Are you sure you want to permanently delete the production entry "${deletingEntry.productionNumber}" for "${deletingEntry.product?.name}"? Doing so will decrease the product's current stock by ${deletingEntry.boxesProduced} boxes.`}
          onConfirm={handleConfirmDelete}
          confirmText="Delete & Revert Stock"
          isDanger={true}
        />
      )}
    </div>
  );
}

export default function ProductionPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-slate-500">Loading production history...</div>}>
      <ProductionPageContent />
    </Suspense>
  );
}
