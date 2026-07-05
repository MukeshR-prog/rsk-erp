"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import dayjs from "dayjs";
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
  ArrowRight,
  X
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
import CategorySelector from "@/components/ui/CategorySelector";
import UnitSelector from "@/components/ui/UnitSelector";
import { PriceInput } from "@/components/ui/form/PriceInput";
import { QuantityInput } from "@/components/ui/form/QuantityInput";

import {
  getPurchases,
  getSuppliersList,
  getProductsList,
  createPurchase
} from "@/features/trading/purchases/actions";
import {
  getProductCategoriesList,
  getUnitsList,
  upsertProduct
} from "@/features/master-data/products/actions";
import { getPurchaseDashboardMetricsAction } from "@/features/shared/dashboard/actions";
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
  const [categories, setCategories] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Product Modal State
  const [quickProductOpen, setQuickProductOpen] = useState(false);
  const [quickProductIndex, setQuickProductIndex] = useState<number | null>(null);
  const [quickProductName, setQuickProductName] = useState("");

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Date Preset Filter State
  const [datePreset, setDatePreset] = useState<string>("all"); // "all" | "today" | "week" | "month" | "year" | "custom"
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    const today = dayjs();
    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      const formatted = today.format("YYYY-MM-DD");
      setStartDate(formatted);
      setEndDate(formatted);
    } else if (preset === "week") {
      setStartDate(today.startOf("week").format("YYYY-MM-DD"));
      setEndDate(today.endOf("week").format("YYYY-MM-DD"));
    } else if (preset === "month") {
      setStartDate(today.startOf("month").format("YYYY-MM-DD"));
      setEndDate(today.endOf("month").format("YYYY-MM-DD"));
    } else if (preset === "year") {
      setStartDate(today.startOf("year").format("YYYY-MM-DD"));
      setEndDate(today.endOf("year").format("YYYY-MM-DD"));
    }
    setPage(1);
  };

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
      initialAmountPaid: 0,
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
      const [pRes, mRes, sRes, prRes, catsRes, unitsRes] = await Promise.all([
        getPurchases({
          search,
          status: statusFilter ? (statusFilter as PurchaseStatus) : undefined,
          paymentStatus: paymentFilter ? (paymentFilter as PurchasePaymentStatus) : undefined,
          page,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
        getPurchaseDashboardMetricsAction(startDate || undefined, endDate || undefined),
        getSuppliersList(),
        getProductsList(),
        getProductCategoriesList(),
        getUnitsList(),
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
      setCategories(catsRes || []);
      setUnits(unitsRes || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load page details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter, paymentFilter, page, startDate, endDate]);

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
      initialAmountPaid: 0,
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
    if (productId && productId.startsWith("NEW_OPTION:")) {
      const name = productId.replace("NEW_OPTION:", "").trim();
      setQuickProductName(name);
      setQuickProductIndex(index);
      setQuickProductOpen(true);
      setValue(`items.${index}.productId`, ""); // Reset selection temporarily
      return;
    }
    setValue(`items.${index}.productId`, productId);
    const selectedProd = products.find((p) => p.id === productId);
    if (selectedProd) {
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
    const isExpanded = expandedRows[item.id];
    return (
      <div key={item.id} className="flex flex-col gap-3">
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

        {isExpanded && item.items && item.items.length > 0 && (
          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] flex flex-col gap-1.5 mt-1">
            <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider mb-1">Items:</span>
            {item.items.map((it: any) => (
              <div key={it.id} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-1 last:border-0 last:pb-0">
                <span className="font-semibold text-slate-850 dark:text-slate-200">{it.productName}</span>
                <span className="text-slate-500 font-semibold">{it.quantity} {it.unitName} × ₹{it.purchaseRate}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center border-t border-slate-50 dark:border-slate-900 pt-2 mt-1">
          <div className="flex gap-2">
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

          <div className="flex gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleRow(item.id);
              }}
              className="text-xs font-bold text-slate-500 hover:text-slate-750"
            >
              {isExpanded ? "Hide Items" : "Show Items"}
            </button>
            <Link
              href={`/trading/purchases/${item.id}`}
              className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1"
            >
              <span>Report</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
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

          {/* Date Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-850/60 mb-2">
            <div className="flex flex-col gap-1.5 w-full">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date Period Filter</span>
              <select
                value={datePreset}
                onChange={(e) => handleDatePresetChange(e.target.value)}
                className="h-10 rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm focus:border-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950 font-semibold"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Weekly (This Week)</option>
                <option value="month">Monthly (This Month)</option>
                <option value="year">Yearly (This Year)</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            {datePreset === "custom" ? (
              <>
                <div className="flex flex-col gap-1.5 w-full">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">From Date</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="h-10 px-3 rounded-xl border border-slate-205 bg-white text-sm focus:border-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950 font-semibold"
                  />
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">To Date</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="h-10 px-3 rounded-xl border border-slate-205 bg-white text-sm focus:border-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950 font-semibold"
                  />
                </div>
              </>
            ) : datePreset !== "all" ? (
              <div className="sm:col-span-3 text-xs font-bold text-slate-500 dark:text-slate-450 self-center pb-2">
                Active Filter Range: <span className="text-slate-800 dark:text-slate-200 font-extrabold">{startDate}</span> to <span className="text-slate-800 dark:text-slate-200 font-extrabold">{endDate}</span>
              </div>
            ) : null}
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
            <div className="w-full">
              {/* Mobile View */}
              <div className="flex flex-col gap-4.5 md:hidden">
                {purchases.length === 0 ? (
                  <EmptyState
                    title="No Purchases Found"
                    description="Supplier bills or purchase records registered will show up here."
                  />
                ) : (
                  purchases.map((item) => renderMobileCard(item))
                )}
              </div>

              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse border border-slate-100 dark:border-slate-900 rounded-2xl bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
                  <thead>
                    <tr className="bg-slate-50/60 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px]">
                      <th className="py-3.5 px-4 text-left w-10"></th>
                      <th className="py-3.5 px-4 text-left">Purchase No</th>
                      <th className="py-3.5 px-4 text-left">Supplier</th>
                      <th className="py-3.5 px-4 text-left">Date</th>
                      <th className="py-3.5 px-4 text-right">Total Amount</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Payment</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500">
                          <EmptyState
                            title="No Purchases Found"
                            description="Supplier bills or purchase records registered will show up here."
                          />
                        </td>
                      </tr>
                    ) : (
                      purchases.map((item) => {
                        const isExpanded = expandedRows[item.id];
                        return (
                          <React.Fragment key={item.id}>
                            <tr
                              onClick={() => toggleRow(item.id)}
                              className="border-b border-slate-50 dark:border-slate-900 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors cursor-pointer"
                            >
                              <td className="py-4 px-4 text-center">
                                <button
                                  type="button"
                                  className="text-slate-400 hover:text-slate-600 transition-transform duration-200"
                                  style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleRow(item.id);
                                  }}
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </td>
                              <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                                {item.purchaseNumber}
                              </td>
                              <td className="py-4 px-4 font-medium text-slate-800 dark:text-slate-200">
                                {item.supplierName}
                              </td>
                              <td className="py-4 px-4 text-slate-650 dark:text-slate-400">
                                {new Date(item.purchaseDate).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </td>
                              <td className="py-4 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                                ₹{item.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span
                                  className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    item.status === "COMPLETED"
                                      ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                                      : item.status === "DRAFT"
                                      ? "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400"
                                      : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span
                                  className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    item.paymentStatus === "PAID"
                                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                                      : item.paymentStatus === "PARTIALLY_PAID"
                                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                                      : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                                  }`}
                                >
                                  {item.paymentStatus.replace("_", " ")}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <Link
                                  href={`/trading/purchases/${item.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-slate-900 hover:text-slate-700 dark:text-white dark:hover:text-slate-300 font-extrabold text-xs bg-slate-100 dark:bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors"
                                >
                                  <span>Report</span>
                                  <ArrowRight className="w-3 h-3" />
                                </Link>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-slate-50/30 dark:bg-slate-900/10">
                                <td colSpan={8} className="p-0">
                                  <div className="px-12 py-4 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-900">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                                      Items Log in Purchase:
                                    </h4>
                                    <table className="w-full text-xs text-left border-collapse">
                                      <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                                          <th className="pb-2 font-bold">Product Name</th>
                                          <th className="pb-2 font-bold text-right">Quantity</th>
                                          <th className="pb-2 font-bold text-right">Purchase Price</th>
                                          <th className="pb-2 font-bold text-right">Discount</th>
                                          <th className="pb-2 font-bold text-right">Total</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {item.items && item.items.length > 0 ? (
                                          item.items.map((it: any) => (
                                            <tr
                                              key={it.id}
                                              className="border-b border-slate-100 dark:border-slate-800/50 last:border-b-0"
                                            >
                                              <td className="py-2.5 font-bold text-slate-900 dark:text-slate-100">
                                                {it.productName}
                                              </td>
                                              <td className="py-2.5 text-right font-semibold">
                                                {it.quantity} {it.unitName}
                                              </td>
                                              <td className="py-2.5 text-right font-semibold">
                                                ₹{it.purchaseRate.toLocaleString("en-IN", {
                                                  minimumFractionDigits: 2,
                                                })}
                                              </td>
                                              <td className="py-2.5 text-right font-semibold text-amber-600">
                                                ₹{it.discount.toLocaleString("en-IN", {
                                                  minimumFractionDigits: 2,
                                                })}
                                              </td>
                                              <td className="py-2.5 text-right font-black text-slate-900 dark:text-white">
                                                ₹{it.lineTotal.toLocaleString("en-IN", {
                                                  minimumFractionDigits: 2,
                                                })}
                                              </td>
                                            </tr>
                                          ))
                                        ) : (
                                          <tr>
                                            <td colSpan={5} className="py-2 text-center text-slate-400">
                                              No items registered in this purchase invoice.
                                            </td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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
      <div
        className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
          isCreateOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {/* Backdrop overlay */}
        <div
          onClick={handleCloseCreate}
          className={`absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
            isCreateOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Drawer container */}
        <div
          className={`relative w-full max-w-4xl h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between transform transition-transform duration-300 ease-out ${
            isCreateOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <form onSubmit={handleSubmit(handleSave)} className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-900">
              <span className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                <span>Create Purchase Invoice</span>
              </span>
              <button
                type="button"
                onClick={handleCloseCreate}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
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
                        isCreatable={true}
                      />
                    )}
                  />
                </div>

                {/* Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-355">
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
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-355">
                    Supplier Invoice No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-1092"
                    {...register("supplierInvoiceNumber")}
                    className="flex h-10 w-full rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-slate-909 dark:border-slate-800 dark:bg-slate-950 font-semibold"
                  />
                </div>

                {/* Reference */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-355">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PO-8902"
                    {...register("reference")}
                    className="flex h-10 w-full rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-slate-909 dark:border-slate-800 dark:bg-slate-955 font-semibold"
                  />
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-355">
                    Invoice Status
                  </label>
                  <select
                    {...register("status")}
                    className="flex h-10 w-full rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm outline-none focus:border-slate-909 dark:border-slate-800 dark:bg-slate-955 font-semibold"
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
                                isCreatable={true}
                              />
                            </div>
                            <div className="md:col-span-4 flex justify-end">
                              <Button
                                variant="danger"
                                className="p-2 border-red-200 text-red-650 bg-red-300 hover:bg-red-500 dark:bg-red-950/20 dark:text-red-400 rounded-xl"
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

                            <div className="flex flex-col justify-end items-end p-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl h-10">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                                Line Total
                              </span>
                              <span className="text-sm font-black text-slate-900 dark:text-slate-50">
                                ₹{lineTotalVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>

                          {/* Quantity helper: Boxes × Pockets × Pieces per Pocket */}
                          <details className="group">
                            <summary className="text-[10px] font-bold text-blue-600 cursor-pointer select-none list-none flex items-center gap-1 mt-1">
                              <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                              Calculate quantity from boxes/pockets (optional)
                            </summary>
                            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900">
                              <p className="text-[10px] text-blue-600 mb-2 font-medium">Fill boxes, pockets and pieces per pocket — quantity will be calculated automatically. Or enter a direct total amount instead.</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] font-bold text-slate-600">Boxes</label>
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-blue-500"
                                    onChange={(e) => {
                                      const boxes = Number(e.target.value) || 0;
                                      const pockets = Number((document.getElementById(`pockets-${index}`) as HTMLInputElement)?.value) || 0;
                                      const ppp = Number((document.getElementById(`ppp-${index}`) as HTMLInputElement)?.value) || 0;
                                      const total = boxes * pockets * ppp;
                                      if (total > 0) setValue(`items.${index}.quantity`, total);
                                    }}
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] font-bold text-slate-600">Pockets/Box</label>
                                  <input
                                    id={`pockets-${index}`}
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-blue-500"
                                    onChange={(e) => {
                                      const pockets = Number(e.target.value) || 0;
                                      const boxes = Number((e.target.closest(".grid")?.children[0]?.querySelector("input") as HTMLInputElement)?.value) || 0;
                                      const ppp = Number((document.getElementById(`ppp-${index}`) as HTMLInputElement)?.value) || 0;
                                      const total = boxes * pockets * ppp;
                                      if (total > 0) setValue(`items.${index}.quantity`, total);
                                    }}
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] font-bold text-slate-600">Pcs/Pocket</label>
                                  <input
                                    id={`ppp-${index}`}
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-blue-500"
                                    onChange={(e) => {
                                      const ppp = Number(e.target.value) || 0;
                                      const pockets = Number((document.getElementById(`pockets-${index}`) as HTMLInputElement)?.value) || 0;
                                      const boxes = Number((e.target.closest(".grid")?.children[0]?.querySelector("input") as HTMLInputElement)?.value) || 0;
                                      const total = boxes * pockets * ppp;
                                      if (total > 0) setValue(`items.${index}.quantity`, total);
                                    }}
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] font-bold text-slate-600">Direct Total (₹)</label>
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="Quick total"
                                    className="h-8 w-full rounded-lg border border-blue-200 bg-blue-50 px-2 text-xs outline-none focus:border-blue-600 text-blue-800 font-semibold"
                                    onChange={(e) => {
                                      const total = Number(e.target.value);
                                      if (total > 0) {
                                        const qty = Number(watch(`items.${index}.quantity`)) || 1;
                                        setValue(`items.${index}.purchaseRate`, parseFloat((total / qty).toFixed(4)));
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </details>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-700 dark:text-slate-355 uppercase tracking-wider">
                              Remarks (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Batch code, specifications..."
                              {...register(`items.${index}.remarks`)}
                              className="flex h-9 w-full rounded-lg border border-slate-205 bg-white px-2.5 py-1 text-xs outline-none focus:border-slate-909 dark:border-slate-800 dark:bg-slate-950 font-medium"
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
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-355">
                      Purchase Remarks / Notes
                    </label>
                    <textarea
                      placeholder="Log terms, delivery notes..."
                      rows={3}
                      {...register("notes")}
                      className="flex w-full rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm outline-none focus:border-slate-909 dark:border-slate-800 dark:bg-slate-950 font-semibold"
                    />
                  </div>
                </div>

                {/* Right: Subtotal & Header Adjustments */}
                <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-955 rounded-2xl border border-slate-100 dark:border-slate-900">
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

                  {/* Initial Payment */}
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
                    <PriceInput
                      label="Initial Amount Paid (Optional)"
                      placeholder="0.00"
                      {...register("initialAmountPaid", { valueAsNumber: true })}
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      If you paid a portion upfront, enter it here. A payment record will be auto-created.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-900 gap-3 shrink-0 flex justify-end bg-slate-50 dark:bg-slate-900/50">
              <Button variant="ghost" onPress={handleCloseCreate} type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit" isPending={isPending} className="px-5 font-semibold bg-emerald-600 hover:bg-emerald-700 border-none text-white">
                Create Invoice
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Quick Product Creation Drawer */}
      {quickProductOpen && (
        <div
          className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
            quickProductOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          {/* Backdrop overlay */}
          <div
            onClick={() => setQuickProductOpen(false)}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 opacity-100"
          />

          {/* Drawer container */}
          <div className="relative w-full max-w-xl h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between transform transition-transform duration-300 ease-out translate-x-0">
            <QuickProductForm
              name={quickProductName}
              categories={categories}
              units={units}
              onClose={() => setQuickProductOpen(false)}
              onSubmit={async (values: any) => {
                const res = await upsertProduct(values);
                if (res.success && res.data) {
                  toast.success(`Product "${res.data.name}" created successfully!`);
                  const selectedUnit = units.find((u) => u.id === res.data.unitId);
                  const newProduct = {
                    id: res.data.id,
                    code: res.data.code,
                    name: res.data.name,
                    type: res.data.type,
                    volumeMl: res.data.volumeMl,
                    color: res.data.color,
                    purchasePrice: res.data.purchasePrice ? Number(res.data.purchasePrice) : 0,
                    unitId: res.data.unitId || "",
                    unitName: selectedUnit ? selectedUnit.name : "PCS",
                  };
                  setProducts((prev) => [...prev, newProduct]);

                  if (quickProductIndex !== null) {
                    setValue(`items.${quickProductIndex}.productId`, res.data.id);
                    setValue(`items.${quickProductIndex}.unitId`, res.data.unitId || "");
                    setValue(`items.${quickProductIndex}.purchaseRate`, Number(res.data.purchasePrice || 0));
                  }
                  setQuickProductOpen(false);
                } else {
                  toast.error(res.error || "Failed to create product");
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface QuickProductFormProps {
  name: string;
  categories: any[];
  units: any[];
  onClose: () => void;
  onSubmit: (values: any) => Promise<void>;
}

function QuickProductForm({ name, categories, units, onClose, onSubmit }: QuickProductFormProps) {
  const [productName, setProductName] = useState(name);
  const [productCode, setProductCode] = useState(`AUTO-TRA-${Math.floor(1000 + Math.random() * 9000)}`);
  const [productType, setProductType] = useState<"RAW_MATERIAL" | "FINISHED_GOOD" | "TRADING_PRODUCT">("TRADING_PRODUCT");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [unitId, setUnitId] = useState(units[0]?.id || "");
  const [piecesPerBox, setPiecesPerBox] = useState<number>(1000);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [volumeMl, setVolumeMl] = useState("");
  const [color, setColor] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !productCode) {
      toast.error("Name and Code are required.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        code: productCode,
        name: productName,
        type: productType,
        categoryId: categoryId || undefined,
        unitId: unitId || undefined,
        piecesPerBox: (productType === "FINISHED_GOOD" || productType === "TRADING_PRODUCT") ? piecesPerBox : null,
        purchasePrice: purchasePrice || null,
        sellingPrice: sellingPrice || null,
        volumeMl: volumeMl || null,
        color: color || null,
        description: description || null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
        <span className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <span>Create New Trading Product</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Product SKU / Code *</label>
            <input
              type="text"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-950 dark:border-slate-800"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-355">Product Name *</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-950 dark:border-slate-800"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-355">Product Type *</label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value as any)}
              className="flex h-10 w-full rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm outline-none focus:border-slate-909 dark:border-slate-800 dark:bg-slate-950 font-semibold"
            >
              <option value="TRADING_PRODUCT">TRADING PRODUCT (Default)</option>
              <option value="RAW_MATERIAL">RAW MATERIAL</option>
              <option value="FINISHED_GOOD">FINISHED GOOD</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <CategorySelector
              categories={categories}
              selectedKey={categoryId}
              onSelectionChange={setCategoryId}
              label="Product Category"
            />
          </div>

          <div className="flex flex-col gap-1">
            <UnitSelector
              units={units}
              selectedKey={unitId}
              onSelectionChange={setUnitId}
              label="Unit of Measure"
            />
          </div>

          {(productType === "FINISHED_GOOD" || productType === "TRADING_PRODUCT") && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-355">Pieces per Box</label>
                <input
                  type="number"
                  value={piecesPerBox}
                  onChange={(e) => setPiecesPerBox(Number(e.target.value) || 0)}
                  className="flex h-10 w-full rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-950 dark:border-slate-800"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-355">Volume capacity (ml)</label>
                <input
                  type="text"
                  placeholder="e.g. 150ml"
                  value={volumeMl}
                  onChange={(e) => setVolumeMl(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-955 dark:border-slate-800"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-355">Color / Style</label>
                <input
                  type="text"
                  placeholder="e.g. Red"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-950 dark:border-slate-800"
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-355">Default Buy Price (₹)</label>
            <input
              type="number"
              step="0.01"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(Number(e.target.value) || 0)}
              className="flex h-10 w-full rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-950 dark:border-slate-800"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-355">Default Sell Price (₹)</label>
            <input
              type="number"
              step="0.01"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(Number(e.target.value) || 0)}
              className="flex h-10 w-full rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-950 dark:border-slate-800"
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-355">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex w-full rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-950 dark:border-slate-800"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
        <Button variant="ghost" onPress={onClose} type="button">
          Cancel
        </Button>
        <Button variant="primary" type="submit" isPending={submitting} className="px-5 font-semibold bg-emerald-600 hover:bg-emerald-700 border-none text-white">
          Create Product
        </Button>
      </div>
    </form>
  );
}
