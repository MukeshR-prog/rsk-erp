"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
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
  Tab,
  Tabs,
  TextField,
  Label,
  Input,
} from "@heroui/react";
import { Search, Plus, CreditCard, Calendar, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";
import {
  getSupplierPayments,
  getPaymentDashboardMetrics,
  getSuppliersForPayments,
  cancelSupplierPaymentAction,
} from "@/features/trading/payments/actions";
import PaymentHistoryTable from "@/components/erp/payments/PaymentHistoryTable";
import PaymentForm from "@/components/erp/payments/PaymentForm";
import ContactSelector from "@/components/ui/ContactSelector";
import dayjs from "dayjs";

interface PaymentItem {
  id: string;
  paymentNumber: string;
  amount: number;
  paymentDate: Date | string;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "UPI" | "CHEQUE";
  referenceNumber?: string | null;
  notes?: string | null;
  status: "COMPLETED" | "CANCELLED";
  cancellationReason?: string | null;
}

interface SupplierOption {
  id: string;
  name: string;
  type: string;
  phone?: string | null;
}

interface DashboardMetrics {
  todayPayments: number;
  totalPayments: number;
  pendingBillsCount: number;
  suppliersWithOutstanding: number;
}

function PaymentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filters state
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    todayPayments: 0,
    totalPayments: 0,
    pendingBillsCount: 0,
    suppliersWithOutstanding: 0,
  });

  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [search, setSearch] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "COMPLETED" | "CANCELLED">("ALL");

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [cancellingPayment, setCancellingPayment] = useState<PaymentItem | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  // Sync route prefill "new=true" or preselected supplier / purchase
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setIsNewModalOpen(true);
    }
    const supplierParam = searchParams.get("supplierId");
    if (supplierParam) {
      setSelectedSupplierId(supplierParam);
    }
  }, [searchParams]);

  // Load suppliers list
  useEffect(() => {
    async function loadSuppliers() {
      const res = await getSuppliersForPayments();
      if (res.success && res.data) {
        setSuppliers(res.data);
      }
    }
    loadSuppliers();
  }, []);

  // Fetch payments list and dashboard metrics
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [paymentsRes, metricsRes] = await Promise.all([
        getSupplierPayments({
          page,
          limit: 10,
          search: search || undefined,
          contactId: selectedSupplierId || undefined,
          paymentMethod: (selectedMethod as any) || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          status: activeTab === "ALL" ? undefined : activeTab,
        }),
        getPaymentDashboardMetrics(),
      ]);

      if (paymentsRes.success && paymentsRes.data) {
        setPayments(paymentsRes.data as any[]);
        setTotal(paymentsRes.meta?.total || 0);
        setTotalPages(paymentsRes.meta?.totalPages || 1);
      } else {
        toast.error(paymentsRes.error || "Failed to load payments");
      }

      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred loading dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [page, search, selectedSupplierId, selectedMethod, startDate, endDate, activeTab]);

  const handleCancelPaymentSubmit = () => {
    if (!cancellingPayment) return;
    if (!cancellationReason.trim()) {
      toast.error("Please enter a cancellation reason.");
      return;
    }

    startTransition(async () => {
      const res = await cancelSupplierPaymentAction(cancellingPayment.id, cancellationReason);
      if (res.success) {
        toast.success("Payment cancelled successfully.");
        setCancellingPayment(null);
        setCancellationReason("");
        fetchDashboardData();
      } else {
        toast.error(res.error || "Failed to cancel payment.");
      }
    });
  };

  const handleCreateSuccess = () => {
    setIsNewModalOpen(false);
    fetchDashboardData();
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedSupplierId("");
    setSelectedMethod("");
    setStartDate("");
    setEndDate("");
    setActiveTab("ALL");
    setPage(1);
    router.replace("/trading/payments");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <Header
        title="Supplier Payments"
        subtitle="Log and track supplier bill settlements"
        action={
          <Button
            variant="primary"
            onPress={() => setIsNewModalOpen(true)}
            className="w-full sm:w-auto font-bold rounded-xl"
            size="md"
          >
            <Plus className="w-4.5 h-4.5 mr-1.5" />
            <span>Record Supplier Payment</span>
          </Button>
        }
      />

      {/* KPI Widgets */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card
          title="Today's Payments"
          subtitle="Cleared payments today"
          className="border-l-4 border-l-slate-900 dark:border-l-slate-100"
        >
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white block mt-1">
            ₹{metrics.todayPayments.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </Card>

        <Card
          title="Total Paid Settled"
          subtitle="Cumulative settlements"
          className="border-l-4 border-l-green-600"
        >
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-green-600 dark:text-green-400 block mt-1">
            ₹{metrics.totalPayments.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </Card>

        <Card
          title="Pending Bills"
          subtitle="Outstanding invoices count"
          className="border-l-4 border-l-amber-500"
        >
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-amber-500 block mt-1">
            {metrics.pendingBillsCount} Invoices
          </span>
        </Card>

        <Card
          title="Vendors Outstanding"
          subtitle="Active suppliers count"
          className="border-l-4 border-l-rose-500"
        >
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-rose-500 block mt-1">
            {metrics.suppliersWithOutstanding} Vendors
          </span>
        </Card>
      </div>

      {/* Filters and List */}
      <Card title="Payment Records Logs" subtitle="Query and filter payment receipts database">
        <div className="flex flex-col gap-4">
          {/* Main filters grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            {/* Search */}
            <div className="sm:col-span-2">
              <TextField className="flex flex-col gap-1 w-full">
                <Label className="text-xs font-semibold text-slate-500 uppercase">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search payment number, ref #, or supplier..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-850 dark:bg-slate-950 outline-none text-sm"
                  />
                </div>
              </TextField>
            </div>

            {/* Supplier Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">
                Supplier
              </label>
              <ContactSelector
                contacts={suppliers}
                selectedKey={selectedSupplierId}
                onSelectionChange={setSelectedSupplierId}
                placeholder="All Suppliers"
                label=""
              />
            </div>

            {/* Payment Method */}
            <div className="flex flex-col gap-1 w-full">
              <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">
                Method
              </label>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-850 dark:bg-slate-950 outline-none text-sm h-10"
              >
                <option value="">All Payment Methods</option>
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            {/* Start Date */}
            <TextField className="flex flex-col gap-1 w-full">
              <Label className="text-xs font-semibold text-slate-500 uppercase">From Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-850 dark:bg-slate-950 outline-none text-sm h-10"
              />
            </TextField>

            {/* End Date */}
            <TextField className="flex flex-col gap-1 w-full">
              <Label className="text-xs font-semibold text-slate-500 uppercase">To Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-850 dark:bg-slate-950 outline-none text-sm h-10"
              />
            </TextField>

            {/* Reset / Actions */}
            <div className="flex gap-2">
              <Button
                variant="tertiary"
                onPress={handleClearFilters}
                className="font-bold border border-slate-150 rounded-xl flex-1"
              >
                Clear Filters
              </Button>
              <Button
                variant="tertiary"
                onPress={fetchDashboardData}
                className="font-bold border border-slate-150 rounded-xl"
                aria-label="Refresh logs"
              >
                <RefreshCcw className="w-4.5 h-4.5" />
              </Button>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="border-b border-slate-100 dark:border-slate-850 mt-2">
            <Tabs
              selectedKey={activeTab}
              onSelectionChange={(key) => setActiveTab(key as any)}
              aria-label="Payment Status Filters"
            >
              <Tab key="ALL">All Payments</Tab>
              <Tab key="COMPLETED">Completed</Tab>
              <Tab key="CANCELLED">Cancelled</Tab>
            </Tabs>
          </div>

          {/* Table list */}
          {loading ? (
            <div className="text-center py-12 text-slate-500 font-medium">
              Loading payment receipts logs...
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <PaymentHistoryTable
                payments={payments}
                onCancelClick={(p) => setCancellingPayment(p)}
              />

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4 border-t border-slate-50 dark:border-slate-900 pt-4">
                  <span className="text-xs text-slate-450 dark:text-slate-500 font-medium">
                    Showing {(page - 1) * 10 + 1} - {Math.min(page * 10, total)} of {total} payments
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="tertiary"
                      size="sm"
                      isDisabled={page === 1}
                      onPress={() => setPage((p) => Math.max(1, p - 1))}
                      className="font-bold rounded-lg px-3 py-1 text-xs"
                    >
                      Prev
                    </Button>
                    <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="tertiary"
                      size="sm"
                      isDisabled={page === totalPages}
                      onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="font-bold rounded-lg px-3 py-1 text-xs"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* New Supplier Payment Modal */}
      <Modal isOpen={isNewModalOpen} onOpenChange={(open) => { if (!open) setIsNewModalOpen(false); }}>
        <ModalBackdrop />
        <ModalContainer>
          <ModalDialog className="bg-white dark:bg-slate-950 p-6 rounded-2xl max-w-lg w-full">
            <ModalHeader className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
              Record Supplier Payment
            </ModalHeader>
            <ModalBody>
              <PaymentForm
                suppliers={suppliers}
                onSuccess={handleCreateSuccess}
                onCancel={() => setIsNewModalOpen(false)}
              />
            </ModalBody>
          </ModalDialog>
        </ModalContainer>
      </Modal>

      {/* Cancel Payment Confirmation dialog */}
      {cancellingPayment && (
        <Modal isOpen={!!cancellingPayment} onOpenChange={(open) => { if (!open) setCancellingPayment(null); }}>
          <ModalBackdrop />
          <ModalContainer>
            <ModalDialog className="bg-white dark:bg-slate-950 p-6 rounded-2xl max-w-md w-full text-left">
              <ModalHeader className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
                Cancel Payment Receipt
              </ModalHeader>
              <ModalBody className="flex flex-col gap-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Are you sure you want to cancel payment receipt{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {cancellingPayment.paymentNumber}
                  </strong>{" "}
                  for ₹
                  {cancellingPayment.amount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                  ? This will increase the supplier's outstanding invoice balance.
                </p>

                <TextField className="flex flex-col gap-1 w-full">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-350">
                    Reason for Cancellation
                  </Label>
                  <Input
                    placeholder="Enter why this payment is being cancelled"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-850 dark:bg-slate-950 outline-none text-sm"
                  />
                </TextField>
              </ModalBody>
              <ModalFooter className="flex gap-3 justify-end mt-6">
                <Button
                  variant="tertiary"
                  onPress={() => {
                    setCancellingPayment(null);
                    setCancellationReason("");
                  }}
                  className="font-bold border border-slate-150 rounded-xl"
                >
                  Keep Active
                </Button>
                <Button
                  variant="primary"
                  isPending={isPending}
                  onPress={handleCancelPaymentSubmit}
                  className="font-bold rounded-xl px-5 bg-red-600 hover:bg-red-700 text-white"
                >
                  {isPending ? "Cancelling..." : "Cancel Payment"}
                </Button>
              </ModalFooter>
            </ModalDialog>
          </ModalContainer>
        </Modal>
      )}
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-slate-500 font-medium">Loading payments ledger...</div>}>
      <PaymentsPageContent />
    </Suspense>
  );
}
