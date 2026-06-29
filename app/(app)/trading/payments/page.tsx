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
  getCustomersForPayments,
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

interface ContactOption {
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

  // Mode tab state: SUPPLIER or CUSTOMER
  const [mode, setMode] = useState<"SUPPLIER" | "CUSTOMER">("SUPPLIER");

  // Filters state
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [contacts, setContacts] = useState<ContactOption[]>([]);
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
  const [selectedContactId, setSelectedContactId] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusTab, setStatusTab] = useState<"ALL" | "COMPLETED" | "CANCELLED">("ALL");

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [cancellingPayment, setCancellingPayment] = useState<PaymentItem | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");

  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);

  // Sync route prefill "new=true" or preselected contact
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setIsNewModalOpen(true);
    }
    const contactParam = searchParams.get("contactId");
    if (contactParam) {
      setSelectedContactId(contactParam);
    }
    const modeParam = searchParams.get("mode");
    if (modeParam === "CUSTOMER" || modeParam === "SUPPLIER") {
      setMode(modeParam);
    }
  }, [searchParams]);

  // Load contacts list when mode changes
  useEffect(() => {
    async function loadContacts() {
      const res = mode === "SUPPLIER" ? await getSuppliersForPayments() : await getCustomersForPayments();
      if (res.success && res.data) {
        setContacts(res.data);
      }
    }
    setSelectedContactId("");
    setPage(1);
    loadContacts();
  }, [mode]);

  // Fetch payments list and dashboard metrics
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [paymentsRes, metricsRes] = await Promise.all([
        getSupplierPayments({
          page,
          limit: 10,
          search: search || undefined,
          contactId: selectedContactId || undefined,
          paymentMethod: (selectedMethod as any) || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          status: statusTab === "ALL" ? undefined : statusTab,
          paymentType: mode === "SUPPLIER" ? "SUPPLIER_PAYMENT" : "CUSTOMER_RECEIPT",
        }),
        getPaymentDashboardMetrics(mode),
      ]);

      if (paymentsRes.success && paymentsRes.data) {
        setPayments(paymentsRes.data as any[]);
        setTotal(paymentsRes.meta?.total || 0);
        setTotalPages(paymentsRes.meta?.totalPages || 1);
      } else {
        toast.error(paymentsRes.error || "Failed to load transactions");
      }

      if (metricsRes.success && metricsRes.data) {
        setMetrics(metricsRes.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred loading ledger data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [page, search, selectedContactId, selectedMethod, startDate, endDate, statusTab, mode]);

  const handleCancelPaymentSubmit = () => {
    if (!cancellingPayment) return;
    if (!cancellationReason.trim()) {
      toast.error("Please enter a cancellation reason.");
      return;
    }

    startTransition(async () => {
      const res = await cancelSupplierPaymentAction(cancellingPayment.id, cancellationReason);
      if (res.success) {
        toast.success("Transaction cancelled successfully.");
        setCancellingPayment(null);
        setCancellationReason("");
        fetchDashboardData();
      } else {
        toast.error(res.error || "Failed to cancel transaction.");
      }
    });
  };

  const handleCreateSuccess = () => {
    setIsNewModalOpen(false);
    fetchDashboardData();
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedContactId("");
    setSelectedMethod("");
    setStartDate("");
    setEndDate("");
    setStatusTab("ALL");
    setPage(1);
    router.replace("/trading/payments");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <Header
        title="Payments & Receipts Ledger"
        subtitle="Log and track customer receipts and supplier disbursements"
        action={
          <Button
            variant="primary"
            onPress={() => setIsNewModalOpen(true)}
            className="w-full sm:w-auto font-bold rounded-xl"
            size="md"
          >
            <Plus className="w-4.5 h-4.5 mr-1.5" />
            <span>{mode === "SUPPLIER" ? "Record Supplier Payment" : "Record Customer Receipt"}</span>
          </Button>
        }
      />

      {/* Main Tab Switcher */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <Tabs
          selectedKey={mode}
          onSelectionChange={(key) => setMode(key as any)}
          aria-label="Payment Mode Tabs"
          className="w-full"
        >
          <Tab key="SUPPLIER">Supplier Payments</Tab>
          <Tab key="CUSTOMER">Customer Receipts</Tab>
        </Tabs>
      </div>

      {/* KPI Widgets */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card
          title={mode === "SUPPLIER" ? "Today's Payments" : "Today's Collections"}
          subtitle="Cleared today"
          className="border-l-4 border-l-slate-900 dark:border-l-slate-100"
        >
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white block mt-1">
            ₹{metrics.todayPayments.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </Card>

        <Card
          title={mode === "SUPPLIER" ? "Total Paid Settled" : "Total Collected"}
          subtitle="Cumulative total"
          className="border-l-4 border-l-green-600"
        >
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-green-600 dark:text-green-400 block mt-1">
            ₹{metrics.totalPayments.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </Card>

        <Card
          title={mode === "SUPPLIER" ? "Pending Bills" : "Pending Invoices"}
          subtitle="Unpaid count"
          className="border-l-4 border-l-amber-500"
        >
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-amber-500 block mt-1">
            {metrics.pendingBillsCount} Invoices
          </span>
        </Card>

        <Card
          title={mode === "SUPPLIER" ? "Vendors Outstanding" : "Customers Outstanding"}
          subtitle="Active profiles"
          className="border-l-4 border-l-rose-500"
        >
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-rose-500 block mt-1">
            {metrics.suppliersWithOutstanding} Accounts
          </span>
        </Card>
      </div>

      {/* Filters and List */}
      <Card title="Transaction Records Logs" subtitle="Query and filter ERP transaction vouchers">
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
                    placeholder={mode === "SUPPLIER" ? "Search payment number, ref #, or supplier..." : "Search receipt number, ref #, or customer..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-850 dark:bg-slate-950 outline-none text-sm animate-none"
                  />
                </div>
              </TextField>
            </div>

            {/* Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">
                {mode === "SUPPLIER" ? "Supplier" : "Customer"}
              </label>
              <ContactSelector
                contacts={contacts}
                selectedKey={selectedContactId}
                onSelectionChange={setSelectedContactId}
                placeholder={mode === "SUPPLIER" ? "All Suppliers" : "All Customers"}
                label=""
              />
            </div>

            {/* Method */}
            <div className="flex flex-col gap-1 w-full">
              <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">
                Method
              </label>
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-850 dark:bg-slate-950 outline-none text-sm h-10"
              >
                <option value="">All Methods</option>
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
              selectedKey={statusTab}
              onSelectionChange={(key) => setStatusTab(key as any)}
              aria-label="Payment Status Filters"
            >
              <Tab key="ALL">All Records</Tab>
              <Tab key="COMPLETED">Completed</Tab>
              <Tab key="CANCELLED">Cancelled</Tab>
            </Tabs>
          </div>

          {/* Table list */}
          {loading ? (
            <div className="text-center py-12 text-slate-500 font-medium">
              Loading ledger data...
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
                    Showing {(page - 1) * 10 + 1} - {Math.min(page * 10, total)} of {total} items
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

      {/* Record Payment/Receipt Modal */}
      <Modal isOpen={isNewModalOpen} onOpenChange={(open) => { if (!open) setIsNewModalOpen(false); }}>
        <ModalBackdrop />
        <ModalContainer>
          <ModalDialog className="bg-white dark:bg-slate-950 p-6 rounded-2xl max-w-lg w-full">
            <ModalHeader className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
              {mode === "SUPPLIER" ? "Record Supplier Payment" : "Record Customer Receipt"}
            </ModalHeader>
            <ModalBody>
              <PaymentForm
                mode={mode}
                contacts={contacts}
                onSuccess={handleCreateSuccess}
                onCancel={() => setIsNewModalOpen(false)}
              />
            </ModalBody>
          </ModalDialog>
        </ModalContainer>
      </Modal>

      {/* Cancel Transaction dialog */}
      {cancellingPayment && (
        <Modal isOpen={!!cancellingPayment} onOpenChange={(open) => { if (!open) setCancellingPayment(null); }}>
          <ModalBackdrop />
          <ModalContainer>
            <ModalDialog className="bg-white dark:bg-slate-950 p-6 rounded-2xl max-w-md w-full text-left">
              <ModalHeader className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
                Cancel Voucher
              </ModalHeader>
              <ModalBody className="flex flex-col gap-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Are you sure you want to cancel voucher{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {cancellingPayment.paymentNumber}
                  </strong>{" "}
                  for ₹
                  {cancellingPayment.amount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                  ? This will increase the remaining unpaid balance of the invoice.
                </p>

                <TextField className="flex flex-col gap-1 w-full">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-350">
                    Reason for Cancellation
                  </Label>
                  <Input
                    placeholder="Enter why this is being cancelled"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-850 dark:bg-slate-950 outline-none text-sm animate-none"
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
                  {isPending ? "Cancelling..." : "Cancel Voucher"}
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
