"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { TableSkeleton } from "@/components/ui/Skeleton";
import {
  Button,
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tab,
  Tabs,
} from "@heroui/react";
import { Search, Plus, Edit, Trash2, CheckCircle, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  getProducts,
  upsertProduct,
  toggleProductStatus,
  getProductCategoriesList,
  getUnitsList,
} from "@/features/master-data/products/actions";
import { productSchema, ProductFormValues } from "@/features/master-data/products/validations";
import CategorySelector from "@/components/ui/CategorySelector";
import UnitSelector from "@/components/ui/UnitSelector";
import { PriceInput } from "@/components/ui/form/PriceInput";
import { QuantityInput } from "@/components/ui/form/QuantityInput";

interface ProductData {
  id: string;
  code: string;
  name: string;
  type: "RAW_MATERIAL" | "FINISHED_GOOD" | "TRADING_PRODUCT";
  description?: string | null;
  volumeMl?: string | null;
  color?: string | null;
  currentStock: number;
  averageCost: number;
  purchasePrice?: number | null;
  sellingPrice?: number | null;
  minStockAlert?: number | null;
  categoryId?: string | null;
  unitId?: string | null;
  isActive: boolean;
  category?: { name: string } | null;
  unit?: { name: string } | null;
}

interface DropdownOption {
  id: string;
  name: string;
}

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");

  const [products, setProducts] = useState<ProductData[]>([]);
  const [categories, setCategories] = useState<DropdownOption[]>([]);
  const [units, setUnits] = useState<DropdownOption[]>([]);

  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [activeTab, setActiveTab] = useState<ProductData["type"] | "ALL">("ALL");

  useEffect(() => {
    if (typeParam === "RAW_MATERIAL" || typeParam === "FINISHED_GOOD" || typeParam === "TRADING_PRODUCT") {
      setActiveTab(typeParam);
    } else {
      setActiveTab("ALL");
    }
  }, [typeParam]);

  const [isPending, startTransition] = useTransition();

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [formPending, setFormPending] = useState(false);

  // Deactivate States
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deactivatingProduct, setDeactivatingProduct] = useState<ProductData | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(productSchema),
  });

  const renderError = (err: any) => {
    if (!err || !err.message) return null;
    return <span className="text-xs text-red-500 mt-0.5">{String(err.message)}</span>;
  };

  const selectedType = watch("type");

  const loadDataOptions = async () => {
    const [catsRes, unitsRes] = await Promise.all([
      getProductCategoriesList(),
      getUnitsList(),
    ]);
    setCategories(catsRes);
    setUnits(unitsRes);
  };

  const loadProducts = () => {
    startTransition(async () => {
      const res = await getProducts({
        search,
        page,
        pageSize: 10,
        showInactive,
        type: activeTab,
      });

      if (res.success && res.data) {
        setProducts(res.data as ProductData[]);
        setTotal(res.meta.total);
        setTotalPages(res.meta.totalPages);
      } else {
        toast.error("Failed to load products");
      }
    });
  };

  useEffect(() => {
    loadDataOptions();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [page, showInactive, activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const handleOpenForm = (product: any | null = null, e?: any) => {
    if (e) e.stopPropagation();
    setEditingProduct(product);
    if (product) {
      setValue("code", product.code);
      setValue("name", product.name);
      setValue("type", product.type);
      setValue("description", product.description || "");
      setValue("volumeMl", product.volumeMl || "");
      setValue("color", product.color || "");
      setValue("purchasePrice", product.purchasePrice || null);
      setValue("sellingPrice", product.sellingPrice || null);
      setValue("minStockAlert", product.minStockAlert || null);
      setValue("categoryId", product.categoryId || "");
      setValue("unitId", product.unitId || "");
      setValue("piecesPerBox", product.piecesPerBox || null);
    } else {
      reset({
        code: "",
        name: "",
        type: "RAW_MATERIAL",
        description: "",
        volumeMl: "",
        color: "",
        purchasePrice: null,
        sellingPrice: null,
        minStockAlert: null,
        categoryId: "",
        unitId: "",
        piecesPerBox: null,
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
    reset();
  };

  const onSave = async (values: any) => {
    try {
      setFormPending(true);
      const res = await upsertProduct({
        id: editingProduct?.id,
        ...values,
      });

      if (res.success) {
        toast.success(editingProduct ? "Product updated" : "Product created");
        handleCloseForm();
        loadProducts();
      } else {
        toast.error(res.error || "Failed to save product");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setFormPending(false);
    }
  };

  const handleToggleActiveClick = (product: ProductData, e: any) => {
    e.stopPropagation();
    setDeactivatingProduct(product);
    setConfirmOpen(true);
  };

  const handleConfirmToggleActive = async () => {
    if (!deactivatingProduct) return;
    try {
      const targetState = !deactivatingProduct.isActive;
      const res = await toggleProductStatus(deactivatingProduct.id, targetState);

      if (res.success) {
        toast.success(targetState ? "Product activated" : "Product soft-deleted");
        loadProducts();
      } else {
        toast.error(res.error || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setConfirmOpen(false);
      setDeactivatingProduct(null);
    }
  };

  const tableHeaders = [
    { key: "code", label: "Code", isRowHeader: true },
    { key: "name", label: "Product Name" },
    { key: "type", label: "Type" },
    { key: "category", label: "Category" },
    { key: "currentStock", label: "Stock" },
    { key: "purchasePrice", label: "Purchase Price" },
    { key: "sellingPrice", label: "Selling Price" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions", className: "w-28 text-right" },
  ];

  const renderCell = (item: ProductData, columnKey: string) => {
    switch (columnKey) {
      case "type":
        return (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
              item.type === "RAW_MATERIAL"
                ? "bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-400"
                : item.type === "FINISHED_GOOD"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                : "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
            }`}
          >
            {item.type.replace("_", " ")}
          </span>
        );
      case "category":
        return <span>{item.category?.name || "—"}</span>;
      case "currentStock":
        return (
          <span className="font-bold text-slate-800 dark:text-slate-100">
            {item.currentStock} {item.unit?.name || ""}
          </span>
        );
      case "purchasePrice":
        return (item.purchasePrice !== null && item.purchasePrice !== undefined) ? <span>₹{item.purchasePrice.toLocaleString()}</span> : <span>—</span>;
      case "sellingPrice":
        return (item.sellingPrice !== null && item.sellingPrice !== undefined) ? <span>₹{item.sellingPrice.toLocaleString()}</span> : <span>—</span>;
      case "status":
        return (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
              item.isActive
                ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
            }`}
          >
            {item.isActive ? "Active" : "Inactive"}
          </span>
        );
      case "actions":
        return (
          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              variant="ghost"
              onPress={(e) => handleOpenForm(item, e)}
              aria-label="Edit product"
              className="min-w-0 p-1.5 text-slate-500 border-none shadow-none hover:bg-slate-100"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onPress={(e) => handleToggleActiveClick(item, e)}
              aria-label={item.isActive ? "Deactivate product" : "Activate product"}
              className="min-w-0 p-1.5 border-none shadow-none hover:bg-slate-150"
            >
              {item.isActive ? (
                <Trash2 className="w-4 h-4 text-red-655" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-655" />
              )}
            </Button>
          </div>
        );
      default:
        return <span>{String(item[columnKey as keyof ProductData]) || "—"}</span>;
    }
  };

  const renderMobileCard = (item: ProductData) => {
    return (
      <div className="flex flex-col gap-2.5 w-full">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              {item.code}
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-50 text-base">{item.name}</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-slate-50 text-sm">
            Stock: {item.currentStock} {item.unit?.name || ""}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-1">
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
              item.type === "RAW_MATERIAL"
                ? "bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-400"
                : item.type === "FINISHED_GOOD"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                : "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
            }`}
          >
            {item.type.replace("_", " ")}
          </span>
          {item.category && (
            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-350">
              {item.category.name}
            </span>
          )}
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
              item.isActive
                ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
            }`}
          >
            {item.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-900 pt-2.5 mt-1">
          <div>Buy Price: {(item.purchasePrice !== null && item.purchasePrice !== undefined) ? `₹${item.purchasePrice.toLocaleString()}` : "—"}</div>
          <div>Sell Price: {(item.sellingPrice !== null && item.sellingPrice !== undefined) ? `₹${item.sellingPrice.toLocaleString()}` : "—"}</div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-50 dark:border-slate-905/30 pt-2 mt-1">
          <Button size="sm" variant="ghost" onPress={(e) => handleOpenForm(item, e)} className="border-none min-w-0 p-1 text-slate-650">
            <Edit className="w-4 h-4 mr-1 text-slate-650" />
            <span>Edit</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={(e) => handleToggleActiveClick(item, e)}
            className="border-none min-w-0 p-1"
          >
            {item.isActive ? (
              <Trash2 className="w-4 h-4 mr-1 text-red-500" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
            )}
            <span>{item.isActive ? "Disable" : "Enable"}</span>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3.5 sm:gap-6">
      <Header
        title="Products Catalog"
        subtitle="Manage raw materials, finished outputs, and trading items"
        action={
          <Button
            variant="primary"
            onPress={() => handleOpenForm(null)}
            className="w-full sm:w-auto font-bold rounded-xl h-11"
            size="md"
          >
            <Plus className="w-4.5 h-4.5 mr-1.5" />
            <span>Add Product</span>
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => {
            setPage(1);
            setActiveTab(key as any);
          }}
          aria-label="Product Types Filters"
        >
          <Tab key="ALL">All Products</Tab>
          <Tab key="RAW_MATERIAL">Raw Materials</Tab>
          <Tab key="FINISHED_GOOD">Finished Goods</Tab>
          <Tab key="TRADING_PRODUCT">Trading Items</Tab>
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <form onSubmit={handleSearch} className="flex gap-2 w-full sm:max-w-xs">
            <div className="relative flex items-center w-full">
              <Search className="absolute left-3.5 text-slate-400 w-4.5 h-4.5" />
              <input
                type="text"
                placeholder="Search by code or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-800 dark:bg-slate-950 dark:focus:border-slate-100 outline-none text-sm transition-all font-semibold"
              />
            </div>
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>

          <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-900 shadow-sm">
            <span className="text-sm font-semibold text-slate-650 dark:text-slate-400">Show Inactive</span>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => {
                  setPage(1);
                  setShowInactive(e.target.checked);
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900 dark:peer-checked:bg-slate-50"></div>
            </label>
          </div>
        </div>
      </div>

      <Card>
        {isPending ? (
          <TableSkeleton rows={5} />
        ) : (
          <Table<ProductData>
            headers={tableHeaders}
            data={products}
            renderCell={renderCell}
            renderMobileCard={renderMobileCard}
            keyField="id"
            onRowClick={(item) => router.push(`/master-data/products/${item.id}`)}
            emptyState={
              <div className="py-12 text-center text-slate-500 font-medium">
                No raw materials or finished products found.
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

      {/* Add / Edit Form Modal */}
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
          className={`relative w-full max-w-2xl h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between transform transition-transform duration-300 ease-out ${
            isFormOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <form onSubmit={handleSubmit(onSave)} className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-lg font-bold text-slate-900 dark:text-slate-50">
                {editingProduct ? "Edit Product" : "Add Product"}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        Product Code *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. PC-150-RED"
                        {...register("code")}
                        className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-955 ${
                          errors.code ? "border-red-500" : "border-slate-200 dark:border-slate-800"
                        }`}
                      />
                      {renderError(errors.code)}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Paper Cup 150ml Red"
                        {...register("name")}
                        className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-950 ${
                          errors.name ? "border-red-500" : "border-slate-200 dark:border-slate-800"
                        }`}
                      />
                      {renderError(errors.name)}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        Product Type *
                      </label>
                      <select
                        {...register("type")}
                        className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950 dark:focus:border-slate-100 transition-all font-semibold"
                      >
                        <option value="RAW_MATERIAL">RAW MATERIAL</option>
                        <option value="FINISHED_GOOD">FINISHED GOOD</option>
                        <option value="TRADING_PRODUCT">TRADING PRODUCT</option>
                      </select>
                      {renderError(errors.type)}
                    </div>
                            <Controller
                      name="categoryId"
                      control={control}
                      render={({ field }) => (
                        <CategorySelector
                          categories={categories}
                          selectedKey={field.value || ""}
                          onSelectionChange={field.onChange}
                          isInvalid={!!errors.categoryId}
                          errorMessage={errors.categoryId?.message as string}
                          label="Product Category"
                        />
                      )}
                    />

                    <Controller
                      name="unitId"
                      control={control}
                      render={({ field }) => (
                        <UnitSelector
                          units={units}
                          selectedKey={field.value || ""}
                          onSelectionChange={field.onChange}
                          isInvalid={!!errors.unitId}
                          errorMessage={errors.unitId?.message as string}
                          label="Unit of Measure"
                        />
                      )}
                    />

                    <QuantityInput
                      label="Min Stock Alert Level"
                      placeholder="e.g. 50"
                      error={errors.minStockAlert}
                      {...register("minStockAlert", { valueAsNumber: true })}
                    />

                    <PriceInput
                      label="Default Buy Price (₹)"
                      placeholder="e.g. 1.20"
                      error={errors.purchasePrice}
                      {...register("purchasePrice", { valueAsNumber: true })}
                    />

                    <PriceInput
                      label="Default Sell Price (₹)"
                      placeholder="e.g. 1.80"
                      error={errors.sellingPrice}
                      {...register("sellingPrice", { valueAsNumber: true })}
                    />

                    {(selectedType === "FINISHED_GOOD" || selectedType === "TRADING_PRODUCT") && (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                            Volume Capacity (ml)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 150ml"
                            {...register("volumeMl")}
                            className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-955 ${
                              errors.volumeMl ? "border-red-500" : "border-slate-200 dark:border-slate-800"
                            }`}
                          />
                          {renderError(errors.volumeMl)}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                            Color / Style
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Red / Multi-color"
                            {...register("color")}
                            className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-950 ${
                              errors.color ? "border-red-500" : "border-slate-200 dark:border-slate-800"
                            }`}
                          />
                          {renderError(errors.color)}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                            Pieces per Box
                          </label>
                          <input
                            type="number"
                            placeholder="e.g. 1000"
                            {...register("piecesPerBox", { valueAsNumber: true })}
                            className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-950 ${
                              errors.piecesPerBox ? "border-red-500" : "border-slate-200 dark:border-slate-800"
                            }`}
                          />
                          {renderError(errors.piecesPerBox)}
                        </div>
                      </>
                    )}

                    <div className="flex flex-col gap-1.5 col-span-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        Product Description
                      </label>
                      <input
                        type="text"
                        placeholder="Brief specifications or notes..."
                        {...register("description")}
                        className="flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                      />
                      {renderError(errors.description)}
                    </div>
                  </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
              <Button variant="ghost" onPress={handleCloseForm} type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit" isPending={formPending} className="px-5 font-semibold bg-emerald-600 hover:bg-emerald-700 border-none text-white">
                {editingProduct ? "Save Changes" : "Create"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Soft Delete confirmation */}
      {confirmOpen && deactivatingProduct && (
        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => {
            setConfirmOpen(false);
            setDeactivatingProduct(null);
          }}
          title={deactivatingProduct.isActive ? "Deactivate Product" : "Activate Product"}
          message={`Are you sure you want to ${
            deactivatingProduct.isActive ? "deactivate" : "activate"
          } the product "${deactivatingProduct.name}"?`}
          onConfirm={handleConfirmToggleActive}
          confirmText={deactivatingProduct.isActive ? "Deactivate" : "Activate"}
          isDanger={deactivatingProduct.isActive}
        />
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-slate-500">Loading products catalog...</div>}>
      <ProductsPageContent />
    </Suspense>
  );
}
