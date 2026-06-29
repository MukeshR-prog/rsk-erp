"use client";

import { useEffect, useState, use, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Calendar,
  User,
  ShoppingBag,
  FileText,
  AlertTriangle,
  CheckCircle,
  Truck,
  TrendingDown,
} from "lucide-react";
import { Button } from "@heroui/react";

import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@heroui/react";

import {
  getSaleDetailsAction,
  cancelSaleAction,
  editSaleAction,
  getCustomersAction,
  getProductsAction,
  getSaleStockMovementsAction,
} from "@/features/trading/sales/actions";
import { cancelCustomerReceiptAction } from "@/features/trading/payments/actions";

import { SaleItemsTable } from "@/components/erp/sales/SaleItemsTable";
import { SaleStatusBadge } from "@/components/erp/sales/SaleStatusBadge";
import { SaleForm } from "@/components/erp/sales/SaleForm";

import PaymentHistoryTable from "@/components/erp/payments/PaymentHistoryTable";
import PaymentSummaryCard from "@/components/erp/payments/PaymentSummaryCard";
import PaymentForm from "@/components/erp/payments/PaymentForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SaleDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  // Core Data State
  const [sale, setSale] = useState<any>(null);
  const [stockMovements, setStockMovements] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelPending, setCancelPending] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editPending, setEditPending] = useState(false);

  // Receipts Integration
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [cancellingReceipt, setCancellingReceipt] = useState<any | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const loadDetails = async () => {
    setLoading(true);
    try {
      const [sRes, smRes, cRes, pRes] = await Promise.all([
        getSaleDetailsAction(id),
        getSaleStockMovementsAction(id),
        getCustomersAction(),
        getProductsAction(),
      ]);

      if (sRes.success && sRes.data) {
        setSale(sRes.data);
      } else {
        toast.error(sRes.error || "Failed to load sale details.");
        router.push("/trading/sales");
      }

      if (smRes.success && smRes.data) {
        setStockMovements(smRes.data);
      }

      if (cRes.success && cRes.data) {
        setCustomers(cRes.data);
      }

      if (pRes.success && pRes.data) {
        setProducts(pRes.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading sale registers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const handleCancelInvoice = async () => {
    setCancelPending(true);
    try {
      const res = await cancelSaleAction(id, "Cancelled by user");
      if (res.success) {
        toast.success("Sale invoice cancelled successfully!");
        setCancelOpen(false);
        loadDetails();
      } else {
        toast.error(res.error || "Failed to cancel sale invoice.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Internal transaction cancellation error.");
    } finally {
      setCancelPending(false);
    }
  };

  const handleEditSubmit = async (values: any) => {
    setEditPending(true);
    try {
      const res = await editSaleAction(id, values);
      if (res.success) {
        toast.success("Sale invoice revised successfully!");
        setEditOpen(false);
        loadDetails();
      } else {
        toast.error(res.error || "Failed to edit sale invoice.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Internal transaction update error.");
    } finally {
      setEditPending(false);
    }
  };

  const handleCancelReceiptSubmit = () => {
    if (!cancellingReceipt) return;
    if (!cancellationReason.trim()) {
      toast.error("Please enter a cancellation reason.");
      return;
    }

    startTransition(async () => {
      const res = await cancelCustomerReceiptAction(cancellingReceipt.id, cancellationReason);
      if (res.success) {
        toast.success("Receipt cancelled successfully.");
        setCancellingReceipt(null);
        setCancellationReason("");
        loadDetails();
      } else {
        toast.error(res.error || "Failed to cancel receipt.");
      }
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-2 py-16 items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-800 dark:border-t-slate-50 animate-spin" />
        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
          Loading Sale Details...
        </span>
      </div>
    );
  }

  if (!sale) return null;

  // Calculate totals
  const subtotal = Number(sale.subtotal || 0);
  const discount = Number(sale.discount || 0);
  const transportCharges = Number(sale.transportCharges || 0);
  const grandTotal = Number(sale.grandTotal || 0);
  const totalPaid = sale.payments?.reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0;
  const dueAmount = Math.max(0, grandTotal - totalPaid);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Navigation Back bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-850 pb-4">
        <Link
          href="/trading/sales"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sales Registry</span>
        </Link>

        {sale.status !== "CANCELLED" && (
          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              onPress={() => setEditOpen(true)}
              className="rounded-xl text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-850 dark:text-slate-300"
            >
              Revise Invoice
            </Button>
            <Button
              variant="danger"
              onPress={() => setCancelOpen(true)}
              className="rounded-xl text-xs font-bold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border-none"
            >
              Cancel Sale
            </Button>
            {dueAmount > 0.01 && sale.status === "COMPLETED" && (
              <Button
                variant="primary"
                onPress={() => setIsReceiptModalOpen(true)}
                className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 border-none text-white px-4"
              >
                Record Receipt
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-emerald-600/10 rounded-xl">
            <FileText className="w-6 h-6 text-emerald-500" />
          </div>
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl font-black text-white">{sale.saleNumber}</span>
              <SaleStatusBadge status={sale.status} />
              <SaleStatusBadge paymentStatus={sale.paymentStatus} />
            </div>
            <span className="text-xs text-slate-400 mt-1">
              Recorded at: {new Date(sale.createdAt).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div className="flex flex-col md:items-end gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Invoice Grand Total
          </span>
          <span className="text-2xl font-black text-emerald-500">
            ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Column Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns (Details and lists) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Customer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Customer Details">
              <div className="flex flex-col gap-2.5 text-sm mt-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Name</span>
                  <span className="font-semibold text-slate-200">{sale.customer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Contact Person</span>
                  <span className="text-slate-300">{sale.customer.contactPerson || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone</span>
                  <span className="text-slate-300 font-mono">{sale.customer.phone || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">GSTIN</span>
                  <span className="text-slate-300 font-mono uppercase">{sale.customer.gstNumber || "Unregistered"}</span>
                </div>
              </div>
            </Card>

            <Card title="Invoice Logistics">
              <div className="flex flex-col gap-2.5 text-sm mt-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Invoice Date</span>
                  <span className="font-semibold text-slate-200">
                    {new Date(sale.saleDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Reference PO No</span>
                  <span className="text-slate-300">{sale.reference || "-"}</span>
                </div>
                <div className="flex flex-col gap-0.5 pt-1.5 border-t border-slate-800">
                  <span className="text-slate-400 text-xs">Terms & Dispatch Notes</span>
                  <p className="text-slate-300 text-xs leading-relaxed mt-1">{sale.notes || "No special remarks logged."}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sold Products List */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-500" />
              <span>Items Sold Details</span>
            </h3>
            <SaleItemsTable items={sale.items} />
          </div>

          {/* Stock movements log */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-500" />
              <span>Stock Movements Audit Trail</span>
            </h3>
            <div className="overflow-x-auto w-full rounded-xl border border-slate-800 bg-slate-900/50">
              <table className="w-full text-left text-sm text-slate-300">
                <thead>
                  <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="p-3">Product</th>
                    <th className="p-3 text-right">Movement Qty</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Logged Date</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {stockMovements.map((sm) => {
                    const isIncrease = Number(sm.quantity) > 0;
                    return (
                      <tr key={sm.id} className="hover:bg-slate-900/40">
                        <td className="p-3 font-semibold text-white">{sm.product.name}</td>
                        <td className={`p-3 text-right font-bold ${isIncrease ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isIncrease ? "+" : ""}{Number(sm.quantity).toLocaleString()}
                        </td>
                        <td className="p-3 font-semibold text-xs uppercase text-slate-400">{sm.type}</td>
                        <td className="p-3 text-slate-400">{new Date(sm.createdAt).toLocaleString()}</td>
                        <td className="p-3 text-slate-500 truncate max-w-[200px]" title={sm.notes || ""}>
                          {sm.notes || "-"}
                        </td>
                      </tr>
                    );
                  })}
                  {stockMovements.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-500">
                        No stock movement logs found for this invoice.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Receipt Payments History */}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Payments Receipt History</span>
            </h3>
            <PaymentHistoryTable
              payments={sale.payments}
              onCancelClick={(p: any) => setCancellingReceipt(p)}
            />
          </div>
        </div>

        {/* Right Column (Totals) */}
        <div className="flex flex-col gap-6">
          <PaymentSummaryCard
            grandTotal={grandTotal}
            totalPaid={totalPaid}
            remainingBalance={dueAmount}
            paymentStatus={sale.paymentStatus}
          />

          {sale.status === "CANCELLED" && (
            <div className="flex items-center gap-2.5 p-4 border border-rose-500/20 bg-rose-500/5 rounded-2xl text-rose-500 text-xs font-semibold leading-relaxed">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>This invoice has been CANCELLED. Stocks have been returned, and outstanding balances recalculated.</span>
            </div>
          )}
        </div>
      </div>

      {/* Dialog Modals */}
      <ConfirmDialog
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel Sale Invoice"
        message="Are you sure you want to cancel this sale? This action is irreversible. Product stocks will be increased back, and outstanding balances recalculated."
        confirmText="Yes, Cancel Sale"
        onConfirm={handleCancelInvoice}
        isLoading={cancelPending}
        isDanger={true}
      />

      <SaleForm
        isOpen={editOpen}
        onOpenChange={setEditOpen}
        onSubmit={handleEditSubmit}
        customers={customers}
        products={products}
        initialValues={sale}
        isPending={editPending}
        title="Revise Sale Invoice"
      />

      {/* Record Customer Receipt Modal */}
      {isReceiptModalOpen && (
        <Modal isOpen={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
          <ModalBackdrop className="bg-slate-950/80 backdrop-blur-sm" />
          <ModalContainer>
            <ModalDialog className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6">
              <ModalHeader className="pb-3 border-b border-slate-100 dark:border-slate-850">
                <span className="text-slate-900 dark:text-white font-bold text-lg">
                  Record Customer Payment Receipt
                </span>
              </ModalHeader>
              <ModalBody className="pt-4">
                <PaymentForm
                  mode="CUSTOMER"
                  saleId={sale.id}
                  contactId={sale.customerId}
                  contacts={customers}
                  prefilledBalance={dueAmount}
                  onSuccess={() => {
                    setIsReceiptModalOpen(false);
                    loadDetails();
                  }}
                  onCancel={() => setIsReceiptModalOpen(false)}
                />
              </ModalBody>
            </ModalDialog>
          </ModalContainer>
        </Modal>
      )}

      {/* Cancel Payment Receipt Modal */}
      {cancellingReceipt && (
        <Modal isOpen={!!cancellingReceipt} onOpenChange={() => setCancellingReceipt(null)}>
          <ModalBackdrop className="bg-slate-950/80 backdrop-blur-sm" />
          <ModalContainer>
            <ModalDialog className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6">
              <ModalHeader className="pb-3 border-b border-slate-100 dark:border-slate-850">
                <span className="text-slate-900 dark:text-white font-bold text-lg text-rose-500">
                  Cancel Payment Receipt
                </span>
              </ModalHeader>
              <ModalBody className="pt-4 flex flex-col gap-3">
                <p className="text-sm text-slate-500 leading-normal">
                  Specify the reason for cancelling receipt transaction{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {cancellingReceipt.paymentNumber}
                  </strong>{" "}
                  of amount <strong>₹{Number(cancellingReceipt.amount).toLocaleString()}</strong>.
                </p>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Cancellation Reason *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bounced cheque, wrong ledger entry..."
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white font-semibold"
                  />
                </div>
              </ModalBody>
              <ModalFooter className="pt-4 border-t border-slate-100 dark:border-slate-850 gap-3">
                <Button variant="ghost" onPress={() => setCancellingReceipt(null)}>
                  Close
                </Button>
                <Button
                  variant="danger"
                  isDisabled={isPending}
                  onPress={handleCancelReceiptSubmit}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl px-4"
                >
                  {isPending ? "Cancelling..." : "Confirm Reversal"}
                </Button>
              </ModalFooter>
            </ModalDialog>
          </ModalContainer>
        </Modal>
      )}
    </div>
  );
}
