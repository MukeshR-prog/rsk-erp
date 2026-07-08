"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Search,
  ShoppingBag,
  FileText,
  Calendar,
  User,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Button } from "@heroui/react";
import toast from "react-hot-toast";
import dayjs from "dayjs";

import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import EmptyState from "@/components/ui/EmptyState";
import { SaleForm } from "@/components/erp/sales/SaleForm";
import { SaleStatusBadge } from "@/components/erp/sales/SaleStatusBadge";
import { TableSkeleton } from "@/components/ui/Skeleton";

import {
  getSalesAction,
  getCustomersAction,
  getProductsAction,
  createSaleAction,
} from "@/features/trading/sales/actions";
import { getTradingDashboardAction } from "@/features/shared/dashboard/actions";
import { SaleStatus, SalePaymentStatus } from "@prisma/client";

export default function SalesPage() {
  const router = useRouter();

  // Core State
  const [sales, setSales] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ todaySales: 0, monthlySales: 0, customerOutstanding: 0 });
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Accordion State
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Fetch Page Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, mRes, cRes, pRes] = await Promise.all([
        getSalesAction({
          search,
          status: statusFilter ? (statusFilter as SaleStatus) : undefined,
          paymentStatus: paymentFilter ? (paymentFilter as SalePaymentStatus) : undefined,
          page,
        }),
        getTradingDashboardAction(),
        getCustomersAction(),
        getProductsAction(),
      ]);

      if (sRes.success && sRes.data) {
        setSales(sRes.data.items || []);
        setTotalPages(sRes.data.pages || 1);
      }
      if (mRes.success && mRes.data?.metrics) {
        setMetrics({
          todaySales: mRes.data.metrics.todaySales || 0,
          monthlySales: mRes.data.metrics.monthlySales || 0,
          customerOutstanding: mRes.data.metrics.customerOutstanding || 0,
        });
      }
      if (cRes.success && cRes.data) {
        setCustomers(cRes.data);
      }
      if (pRes.success && pRes.data) {
        setProducts(pRes.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load sales database registers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter, paymentFilter, page]);

  // Handlers
  const handleOpenCreate = () => {
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (values: any) => {
    setIsPending(true);
    try {
      const res = await createSaleAction(values);
      if (res.success) {
        toast.success(`Sale logged successfully: ${res.data?.saleNumber}`);
        setIsCreateOpen(false);
        loadData();
      } else {
        toast.error(res.error || "Failed to create sale invoice.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Internal transaction submission error.");
    } finally {
      setIsPending(false);
    }
  };

  // Table Configuration
  const headers = [
    { label: "Invoice details", key: "saleNumber" },
    { label: "Customer", key: "customer" },
    { label: "Date", key: "saleDate" },
    { label: "Status", key: "status" },
    { label: "Payment Status", key: "paymentStatus" },
    { label: "Total Amount", key: "grandTotal", className: "text-right" },
    { label: "", key: "actions", className: "w-10" },
  ];

  const renderCell = (item: any, key: string) => {
    switch (key) {
      case "saleNumber":
        return (
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <FileText className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 dark:text-slate-50">
                {item.saleNumber}
              </span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                Ref: {item.reference || "None"}
              </span>
            </div>
          </div>
        );
      case "customer":
        return (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-350">
              {item.customer?.name}
            </span>
          </div>
        );
      case "saleDate":
        return (
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
            <Calendar className="w-4 h-4 text-slate-450" />
            <span>{new Date(item.saleDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
        );
      case "status":
        return <SaleStatusBadge status={item.status} />;
      case "paymentStatus":
        return <SaleStatusBadge paymentStatus={item.paymentStatus} />;
      case "grandTotal":
        return (
          <span className="font-bold text-slate-900 dark:text-slate-50 text-right block">
            ₹{Number(item.grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        );
      case "actions":
        return <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />;
      default:
        return null;
    }
  };

  const renderMobileCard = (item: any) => {
    const isExpanded = expandedRows[item.id];
    return (
      <div key={item.id} className="flex flex-col gap-2.5 bg-white dark:bg-slate-955 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-850 shadow-xs">
        <div
          onClick={() => toggleRow(item.id)}
          className="flex justify-between items-start cursor-pointer"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate max-w-[140px] sm:max-w-none block">
              {item.customer?.name}
            </span>
            <span className="font-bold text-sm text-slate-900 dark:text-slate-50">{item.saleNumber}</span>
          </div>
          <div className="text-right">
            <span className="font-extrabold text-sm text-slate-900 dark:text-slate-50 block">
              ₹{Number(item.grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-slate-405 dark:text-slate-500 font-semibold">
              {dayjs(item.saleDate).format("DD/MM/YYYY")}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 mt-0.5">
          <div className="flex gap-1.5 shrink-0">
            <SaleStatusBadge status={item.status} />
            <SaleStatusBadge paymentStatus={item.paymentStatus} />
          </div>
          <div className="flex gap-2 items-center shrink-0">
            <button
              type="button"
              onClick={() => toggleRow(item.id)}
              className="text-[10px] font-bold text-blue-650 hover:underline px-2 py-1 bg-blue-50/50 dark:bg-blue-955/20 rounded-lg shrink-0"
            >
              {isExpanded ? "Hide items" : "Show items"}
            </button>
            <Link
              href={`/trading/sales/${item.id}`}
              className="text-[10px] font-bold text-slate-900 dark:text-white flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0"
            >
              <span>Report</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {isExpanded && item.items && item.items.length > 0 && (
          <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px] flex flex-col gap-1.5 mt-1">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-0.5">
              Items Sold:
            </span>
            {item.items.map((it: any) => (
              <div key={it.id} className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/40 last:border-b-0">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {it.productName}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {it.quantity} Bxs • ₹{Number(it.lineTotal).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3.5 sm:gap-6">
      <Header
        title="Sales Invoices"
        subtitle="Track customer bills, receipts, outstanding, and dispatch stock level logs"
        action={
          <Button
            variant="primary"
            onPress={handleOpenCreate}
            className="w-full sm:w-auto font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-none"
            size="md"
          >
            <Plus className="w-4.5 h-4.5 mr-1.5" />
            <span>Create Invoice</span>
          </Button>
        }
      />

      {/* KPI metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-emerald-500" title="Today's Sales" subtitle="Completed customer dispatch value">
          <div className="flex items-baseline gap-1 mt-1.5">
            {loading ? (
              <div className="h-7 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            ) : (
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50">
                ₹{metrics.todaySales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </Card>

        <Card className="border-l-4 border-l-blue-500" title="Monthly Sales" subtitle="Aggregated sales for current month">
          <div className="flex items-baseline gap-1 mt-1.5">
            {loading ? (
              <div className="h-7 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            ) : (
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50">
                ₹{metrics.monthlySales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </Card>

        <Card className="border-l-4 border-l-rose-500" title="Total Outstanding Receivables" subtitle="Dynamic customers outstanding summary">
          <div className="flex items-baseline gap-1 mt-1.5">
            {loading ? (
              <div className="h-7 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            ) : (
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50">
                ₹{metrics.customerOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </Card>
      </div>

      {/* Filters and Table List */}
      <Card>
        <div className="flex flex-col gap-2.5 sm:gap-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3 items-center">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Invoice No, Customer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10 pr-4 h-10 w-full rounded-xl border border-slate-200 bg-white text-sm outline-none transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-slate-100 font-semibold"
              />
            </div>

            {/* Select Dropdowns */}
            <div className="flex w-full sm:w-auto items-center gap-2.5">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white font-semibold w-1/2 sm:w-36"
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
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white font-semibold w-1/2 sm:w-36"
              >
                <option value="">All Payment</option>
                <option value="UNPAID">UNPAID</option>
                <option value="PARTIALLY_PAID">PART COMP</option>
                <option value="PAID">PAID</option>
              </select>
            </div>
          </div>

          {loading ? (
            <TableSkeleton rows={5} />
          ) : (
            <div className="w-full">
              {/* Mobile View */}
              <div className="flex flex-col gap-4.5 md:hidden">
                {sales.length === 0 ? (
                  <EmptyState
                    title="No Sales Invoices Registered"
                    description="Start by creating a new invoice estimate or completed sale."
                  />
                ) : (
                  sales.map((item) => renderMobileCard(item))
                )}
              </div>

              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse border border-slate-100 dark:border-slate-900 rounded-2xl bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
                  <thead>
                    <tr className="bg-slate-50/60 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px]">
                      <th className="py-3.5 px-4 text-left w-10"></th>
                      <th className="py-3.5 px-4 text-left">Invoice No</th>
                      <th className="py-3.5 px-4 text-left">Customer</th>
                      <th className="py-3.5 px-4 text-left">Date</th>
                      <th className="py-3.5 px-4 text-right">Total Amount</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Payment Status</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500">
                          <EmptyState
                            title="No Sales Invoices Registered"
                            description="Start by creating a new invoice estimate or completed sale."
                          />
                        </td>
                      </tr>
                    ) : (
                      sales.map((item) => {
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
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="p-2 bg-emerald-500/10 rounded-xl">
                                    <FileText className="w-5 h-5 text-emerald-500" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-900 dark:text-white">
                                      {item.saleNumber}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                                      Ref: {item.reference || "None"}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-slate-400" />
                                  <span className="font-semibold text-slate-700 dark:text-slate-350">
                                    {item.customer?.name}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-medium">
                                  <Calendar className="w-4 h-4 text-slate-450" />
                                  <span>{new Date(item.saleDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                                ₹{Number(item.grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-4 px-4 text-center">
                                <SaleStatusBadge status={item.status} />
                              </td>
                              <td className="py-4 px-4 text-center">
                                <SaleStatusBadge paymentStatus={item.paymentStatus} />
                              </td>
                              <td className="py-4 px-4 text-right">
                                <Link
                                  href={`/trading/sales/${item.id}`}
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
                                      Items Sold to Customer:
                                    </h4>
                                    <table className="w-full text-xs text-left border-collapse">
                                      <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                                          <th className="pb-2 font-bold">Product Name</th>
                                          <th className="pb-2 font-bold text-right">Quantity Sold</th>
                                          <th className="pb-2 font-bold text-right">Selling Rate</th>
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
                                              <td className="py-2.5 text-right font-bold text-slate-800 dark:text-slate-200">
                                                {it.quantity} Bxs
                                              </td>
                                              <td className="py-2.5 text-right text-slate-600 dark:text-slate-400 font-semibold">
                                                ₹{Number(it.sellingRate).toFixed(2)}
                                              </td>
                                              <td className="py-2.5 text-right text-slate-500 dark:text-slate-450 font-semibold">
                                                ₹{Number(it.discount).toFixed(2)}
                                              </td>
                                              <td className="py-2.5 text-right font-black text-slate-900 dark:text-white">
                                                ₹{Number(it.lineTotal).toFixed(2)}
                                              </td>
                                            </tr>
                                          ))
                                        ) : (
                                          <tr>
                                            <td colSpan={5} className="py-3 text-center text-slate-400 italic font-semibold">
                                              No details logged.
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

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-bold">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-lg text-xs"
                  isDisabled={page === 1}
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-lg text-xs"
                  isDisabled={page === totalPages}
                  onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Sale Form Modal */}
      <SaleForm
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreateSubmit}
        customers={customers}
        products={products}
        isPending={isPending}
      />
    </div>
  );
}
