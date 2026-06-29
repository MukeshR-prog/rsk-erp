"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  Filter,
  ShoppingBag,
  FileText,
  Calendar,
  User,
  Trash2,
  AlertCircle,
  TrendingDown,
  Info,
  DollarSign,
  ChevronRight,
  ArrowRight
} from "lucide-react";
import {
  Button,
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@heroui/react";

import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import EmptyState from "@/components/ui/EmptyState";
import ContactSelector from "@/components/ui/ContactSelector";
import ProductSelector from "@/components/ui/ProductSelector";
import { PriceInput } from "@/components/ui/form/PriceInput";
import { QuantityInput } from "@/components/ui/form/QuantityInput";

import {
  getPurchases,
  getPurchaseDashboardMetrics,
  getSuppliersList,
  getProductsList,
  createPurchase
} from "@/features/trading/purchases/actions";
import { purchaseSchema, PurchaseFormValues } from "@/features/trading/purchases/validations";
import { PurchaseStatus, PurchasePaymentStatus } from "@prisma/client";

interface PurchaseItemField {
  productId: string;
  quantity: number;
  unitId: string;
  purchaseRate: number;
  discount: number;
  remarks?: string | null;
}

export default function PurchasesPage() {
  const router = useRouter();

  // Core State
  const [purchases, setPurchases] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ totalPurchases: 0, todayPurchases: 0, pendingPayments: 0 });
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // React Hook Form
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      supplierId: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      supplierInvoiceNumber: "",
      reference: "",
      notes: "",
      discount: 0,
      transportCharges: 0,
      status: "COMPLETED",
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Local helper to track current items for line totals
  const watchedItems = watch("items") || [];
  const watchedHeaderDiscount = watch("discount") || 0;
  const watchedHeaderTransport = watch("transportCharges") || 0;

  // Fetch Page Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, mRes, sRes, prRes] = await Promise.all([
        getPurchases({
          search,
          status: statusFilter ? (statusFilter as PurchaseStatus) : undefined,
          paymentStatus: paymentFilter ? (paymentFilter as PurchasePaymentStatus) : undefined,
          page,
        }),
        getPurchaseDashboardMetrics(),
        getSuppliersList(),
        getProductsList(),
      ]);

      if (pRes.success && pRes.data) {
        setPurchases(pRes.data);
        if (pRes.pagination) {
          setTotalPages(pRes.pagination.totalPages || 1);
        }
      }
      if (mRes.success && mRes.data) {
        setMetrics(mRes.data);
      }
      if (sRes.success && sRes.data) {
        setSuppliers(sRes.data);
      }
      if (prRes.success && prRes.data) {
        setProducts(prRes.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load page details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter, paymentFilter, page]);

  // Form Calculations
  const calculateTotals = () => {
    let subtotal = 0;
    watchedItems.forEach((item: any) => {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.purchaseRate) || 0;
      const disc = Number(item.discount) || 0;
      subtotal += qty * rate - disc;
    });

    const sub = Math.max(0, subtotal);
    const grand = Math.max(0, sub - Number(watchedHeaderDiscount) + Number(watchedHeaderTransport));

    return { subtotal: sub, grandTotal: grand };
  };

  const { subtotal, grandTotal } = calculateTotals();

  // Handlers
  const handleOpenCreate = () => {
    reset({
      supplierId: "",
      purchaseDate: new Date().toISOString().split("T")[0],
      supplierInvoiceNumber: "",
      reference: "",
      notes: "",
      discount: 0,
      transportCharges: 0,
      status: "COMPLETED",
      items: [],
    });
    // Start with 1 empty item
    append({ productId: "", quantity: 1, unitId: "", purchaseRate: 0, discount: 0, remarks: "" });
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
  };

  const handleSave = async (data: any) => {
    setIsPending(true);
    try {
      const res = await createPurchase(data);
      if (res.success) {
        toast.success(`Purchase ${res.data?.purchaseNumber} created successfully!`);
        setIsCreateOpen(false);
        loadData();
      } else {
        toast.error(res.error || "Failed to create purchase.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create purchase.");
    } finally {
      setIsPending(false);
    }
  };

  const handleProductChange = (index: number, productId: string) => {
    const selectedProd = products.find((p) => p.id === productId);
    if (selectedProd) {
      setValue(`items.${index}.productId`, productId);
      setValue(`items.${index}.unitId`, selectedProd.unitId);
      setValue(`items.${index}.purchaseRate`, selectedProd.purchasePrice || 0);
    }
  };

  // Table Configuration
  const headers = [
    { key: "purchaseNumber", label: "Purchase No" },
    { key: "supplierName", label: "Supplier" },
    { key: "purchaseDate", label: "Date" },
    { key: "grandTotal", label: "Total Amount" },
    { key: "status", label: "Status" },
    { key: "paymentStatus", label: "Payment" },
  ];

  const renderCell = (item: any, columnKey: string) => {
    switch (columnKey) {
      case "purchaseNumber":
        return <span className="font-bold text-slate-900 dark:text-white">{item.purchaseNumber}</span>;
      case "purchaseDate":
        return <span>{new Date(item.purchaseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>;
      case "grandTotal":
        return <span className="font-bold">₹{item.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>;
      case "status": {
        const isCompleted = item.status === "COMPLETED";
        const isDraft = item.status === "DRAFT";
        return (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
              isCompleted
                ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                : isDraft
                ? "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400"
                : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
            }`}
          >
            {item.status}
          </span>
        );
      }
      case "paymentStatus": {
        const isPaid = item.paymentStatus === "PAID";
        const isPartial = item.paymentStatus === "PARTIALLY_PAID";
        return (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${
              isPaid
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                : isPartial
                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
            }`}
          >
            {item.paymentStatus.replace("_", " ")}
          </span>
        );
      }
      default:
        return <span>{String(item[columnKey])}</span>;
    }
  };

  const renderMobileCard = (item: any) => {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {item.supplierName}
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-50">{item.purchaseNumber}</span>
          </div>
          <div className="text-right">
            <span className="font-extrabold text-slate-900 dark:text-slate-50 block">
              ₹{item.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
              {new Date(item.purchaseDate).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex justify-between items-center border-t border-slate-50 dark:border-slate-900 pt-2">
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
              item.status === "COMPLETED"
                ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                : item.status === "DRAFT"
                ? "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400"
                : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
            }`}
          >
            {item.status}
          </span>
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
              item.paymentStatus === "PAID"
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                : item.paymentStatus === "PARTIALLY_PAID"
                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
            }`}
          >
            {item.paymentStatus.replace("_", " ")}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Purchase Invoices"
        subtitle="Manage supplier invoices, purchase orders, and items logs"
        action={
          <Button
            variant="primary"
            onPress={handleOpenCreate}
            className="w-full sm:w-auto font-bold rounded-xl shadow-md"
            size="md"
          >
            <Plus className="w-4.5 h-4.5 mr-1.5" />
            <span>Create Purchase</span>
          </Button>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Total Purchases" subtitle="Value of completed invoices">
          <div className="flex items-center gap-2.5 mt-1.5">
            <div className="p-2 bg-slate-900 text-white rounded-xl dark:bg-slate-50 dark:text-slate-900 shadow-sm">
              <ShoppingBag className="w-4.5 h-4.5" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50">
              ₹{metrics.totalPurchases.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </Card>

        <Card title="Today's Purchases" subtitle="Total purchases registered today">
          <div className="flex items-center gap-2.5 mt-1.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl dark:bg-emerald-950/20 dark:text-emerald-400">
              <Calendar className="w-4.5 h-4.5" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50">
              ₹{metrics.todayPurchases.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </Card>

        <Card title="Pending Payments" subtitle="Outstanding purchase due value">
          <div className="flex items-center gap-2.5 mt-1.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl dark:bg-amber-950/20 dark:text-amber-400">
              <TrendingDown className="w-4.5 h-4.5" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50">
              ₹{metrics.pendingPayments.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </Card>
      </div>

      {/* Filters & Listing panel */}
      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3 items-center">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Invoice No, Supplier..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10 pr-4 h-10 w-full rounded-xl border border-slate-205 bg-white text-sm outline-none transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:focus:border-slate-100 font-semibold"
              />
            </div>

            {/* Quick Filter Controls */}
            <div className="flex w-full sm:w-auto items-center gap-2.5">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm focus:border-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950 font-semibold w-1/2 sm:w-36"
              >
                <option value="">All Status</option>
                <option value="DRAFT">DRAFT</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>

              <select
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm focus:border-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950 font-semibold w-1/2 sm:w-36"
              >
                <option value="">All Payment</option>
                <option value="UNPAID">UNPAID</option>
                <option value="PARTIALLY_PAID">PART COMP</option>
                <option value="PAID">PAID</option>
              </select>
            </div>
          </div>

          {/* Table Listing */}
          {loading ? (
            <div className="flex flex-col gap-2 py-8 items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-800 dark:border-t-slate-50 animate-spin" />
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Loading Purchases...
              </span>
            </div>
          ) : (
            <Table
              headers={headers}
              data={purchases}
              renderCell={renderCell}
              renderMobileCard={renderMobileCard}
              keyField="id"
              onRowClick={(item) => router.push(`/trading/purchases/${item.id}`)}
              emptyState={
                <EmptyState
                  title="No Purchases Found"
                  description="Supplier bills or purchase records registered will show up here."
                />
              }
            />
          )}

          {/* Simple Pagination Footer */}
          {!loading && totalPages > 1 && (
            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-900 pt-4 mt-2">
              <Button
                variant="ghost"
                size="sm"
                isDisabled={page === 1}
                onPress={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <span className="text-xs font-bold text-slate-500">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                isDisabled={page === totalPages}
                onPress={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Create Purchase Form Modal */}
      {isCreateOpen && (
        <Modal isOpen={isCreateOpen} onOpenChange={(open) => { if (!open) handleCloseCreate(); }}>
          <ModalBackdrop />
          <ModalContainer>
            <ModalDialog className="max-w-4xl mx-4">
              <form onSubmit={handleSubmit(handleSave)}>
                <ModalHeader className="pt-6 px-6 border-b border-slate-100 dark:border-slate-900">
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    <span>Create Purchase Invoice</span>
                  </span>
                </ModalHeader>

                <ModalBody className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
                    {/* Supplier Selector */}
                    <div className="md:col-span-2">
                      <Controller
                        name="supplierId"
                        control={control}
                        render={({ field }) => (
                          <ContactSelector
                            contacts={suppliers}
                            selectedKey={field.value || ""}
                            onSelectionChange={field.onChange}
                            isInvalid={!!errors.supplierId}
                            errorMessage={errors.supplierId?.message as string}
                            label="Supplier *"
                            placeholder="Select vendor or supplier"
                          />
                        )}
                      />
                    </div>

                    {/* Date */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        Purchase Date *
                      </label>
                      <input
                        type="date"
                        {...register("purchaseDate")}
                        className="flex h-10 w-full rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 font-semibold"
                      />
                      {errors.purchaseDate && (
                        <span className="text-xs text-red-500 mt-0.5">
                          {String(errors.purchaseDate.message)}
                        </span>
                      )}
                    </div>

                    {/* Supplier Invoice No */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        Supplier Invoice No
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. INV-1092"
                        {...register("supplierInvoiceNumber")}
                        className="flex h-10 w-full rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 font-semibold"
                      />
                    </div>

                    {/* Reference */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        Reference Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. PO-8902"
                        {...register("reference")}
                        className="flex h-10 w-full rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 font-semibold"
                      />
                    </div>

                    {/* Status */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        Invoice Status
                      </label>
                      <select
                        {...register("status")}
                        className="flex h-10 w-full rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 font-semibold"
                      >
                        <option value="COMPLETED">COMPLETED (Adjusts stock & outstanding)</option>
                        <option value="DRAFT">DRAFT (Saves header only)</option>
                      </select>
                    </div>
                  </div>

                  {/* Items Panel */}
                  <div className="border-t border-slate-100 dark:border-slate-900 pt-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-55">
                        Purchase Items
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="font-bold border border-slate-200 dark:border-slate-800"
                        onPress={() =>
                          append({ productId: "", quantity: 1, unitId: "", purchaseRate: 0, discount: 0, remarks: "" })
                        }
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Line
                      </Button>
                    </div>

                    {fields.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-200 dark:border-slate-850 rounded-2xl">
                        <AlertCircle className="w-6 h-6 text-slate-400 mb-1" />
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                          No items added yet. Click "Add Line" to add product details.
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {fields.map((field, index) => {
                          const itemValues = watchedItems[index] || {};
                          const qty = Number(itemValues.quantity) || 0;
                          const rate = Number(itemValues.purchaseRate) || 0;
                          const disc = Number(itemValues.discount) || 0;
                          const lineTotalVal = Math.max(0, qty * rate - disc);

                          return (
                            <div
                              key={field.id}
                              className="relative flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-2xl"
                            >
                              {/* Product & Action Row */}
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                <div className="md:col-span-8">
                                  <ProductSelector
                                    products={products}
                                    selectedKey={itemValues.productId || ""}
                                    onSelectionChange={(val) => handleProductChange(index, val)}
                                    label={`Product #${index + 1} *`}
                                    placeholder="Select raw materials or paper rolls"
                                  />
                                </div>
                                <div className="md:col-span-4 flex justify-end">
                                  <Button
                                    variant="danger"
                                    className="p-2 border-red-200 text-red-650 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 rounded-xl"
                                    size="sm"
                                    isDisabled={fields.length === 1}
                                    onPress={() => remove(index)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Remove
                                  </Button>
                                </div>
                              </div>

                              {/* Quantities, rate, discount, remarks */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <QuantityInput
                                  label="Quantity *"
                                  placeholder="e.g. 50"
                                  error={(errors.items as any)?.[index]?.quantity}
                                  {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                />

                                <PriceInput
                                  label="Rate (₹) *"
                                  placeholder="e.g. 1.20"
                                  error={(errors.items as any)?.[index]?.purchaseRate}
                                  {...register(`items.${index}.purchaseRate`, { valueAsNumber: true })}
                                />

                                <PriceInput
                                  label="Discount (₹)"
                                  placeholder="e.g. 10.00"
                                  error={(errors.items as any)?.[index]?.discount}
                                  {...register(`items.${index}.discount`, { valueAsNumber: true })}
                                />

                                <div className="flex flex-col justify-end items-end p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl h-10">
                                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                                    Line Total
                                  </span>
                                  <span className="text-sm font-black text-slate-900 dark:text-slate-50">
                                    ₹{lineTotalVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
                                  Remarks (Optional)
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Batch code, specifications..."
                                  {...register(`items.${index}.remarks`)}
                                  className="flex h-9 w-full rounded-lg border border-slate-205 bg-white px-2.5 py-1 text-xs outline-none focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 font-medium"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Calculations & Notes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 dark:border-slate-900 pt-4 mt-4">
                    {/* Left: Notes */}
                    <div className="flex flex-col gap-2.5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                          Purchase Remarks / Notes
                        </label>
                        <textarea
                          placeholder="Log terms, delivery notes..."
                          rows={3}
                          {...register("notes")}
                          className="flex w-full rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 font-semibold"
                        />
                      </div>
                    </div>

                    {/* Right: Subtotal & Header Adjustments */}
                    <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">Subtotal</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-50">
                          ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <PriceInput
                          label="Header Discount"
                          placeholder="0.00"
                          {...register("discount", { valueAsNumber: true })}
                        />

                        <PriceInput
                          label="Transport Charges"
                          placeholder="0.00"
                          {...register("transportCharges", { valueAsNumber: true })}
                        />
                      </div>

                      <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800 pt-3.5 mt-1.5">
                        <span className="text-sm font-black text-slate-905 dark:text-slate-105">
                          Grand Total
                        </span>
                        <span className="text-lg font-black text-slate-900 dark:text-slate-50">
                          ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </ModalBody>

                <ModalFooter className="px-6 pb-6 pt-4 border-t border-slate-100 dark:border-slate-900 gap-3">
                  <Button variant="ghost" onPress={handleCloseCreate} type="button">
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" isPending={isPending} className="px-5 font-semibold">
                    Create Invoice
                  </Button>
                </ModalFooter>
              </form>
            </ModalDialog>
          </ModalContainer>
        </Modal>
      )}
    </div>
  );
}
