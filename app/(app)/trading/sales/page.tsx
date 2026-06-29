"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  ShoppingBag,
  FileText,
  Calendar,
  User,
  ChevronRight,
} from "lucide-react";
import { Button } from "@heroui/react";
import toast from "react-hot-toast";

import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import EmptyState from "@/components/ui/EmptyState";
import { SaleForm } from "@/components/erp/sales/SaleForm";
import { SaleStatusBadge } from "@/components/erp/sales/SaleStatusBadge";

import {
  getSalesAction,
  getCustomersAction,
  getProductsAction,
  createSaleAction,
} from "@/features/trading/sales/actions";
import { getTradingDashboardData } from "@/features/trading/payments/actions";
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
        getTradingDashboardData(),
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
    return (
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 dark:text-slate-50">{item.saleNumber}</span>
            <span className="text-xs text-slate-500">{item.customer?.name}</span>
          </div>
          <span className="font-black text-slate-900 dark:text-slate-50">
            ₹{Number(item.grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            {new Date(item.saleDate).toLocaleDateString()}
          </span>
          <div className="flex gap-2">
            <SaleStatusBadge status={item.status} />
            <SaleStatusBadge paymentStatus={item.paymentStatus} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
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
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50">
              ₹{metrics.todaySales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </Card>

        <Card className="border-l-4 border-l-blue-500" title="Monthly Sales" subtitle="Aggregated sales for current month">
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50">
              ₹{metrics.monthlySales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </Card>

        <Card className="border-l-4 border-l-rose-500" title="Total Outstanding Receivables" subtitle="Dynamic customers outstanding summary">
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50">
              ₹{metrics.customerOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </Card>
      </div>

      {/* Filters and Table List */}
      <Card>
        <div className="flex flex-col gap-4">
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
            <div className="flex flex-col gap-2 py-8 items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-slate-350 border-t-slate-900 dark:border-slate-800 dark:border-t-slate-50 animate-spin" />
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Loading Sales Invoices...
              </span>
            </div>
          ) : (
            <Table
              headers={headers}
              data={sales}
              renderCell={renderCell}
              renderMobileCard={renderMobileCard}
              keyField="id"
              onRowClick={(item) => router.push(`/trading/sales/${item.id}`)}
              emptyState={
                <EmptyState
                  title="No Sales Invoices Registered"
                  description="Start by creating a new invoice estimate or completed sale."
                />
              }
            />
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
