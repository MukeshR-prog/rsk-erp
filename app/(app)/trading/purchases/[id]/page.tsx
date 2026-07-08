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
  Info,
  CheckCircle,
  Truck,
  ArrowRight,
  TrendingDown,
  DollarSign,
  X
} from "lucide-react";
import { Button } from "@heroui/react";

import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { CardSkeleton } from "@/components/ui/Skeleton";

import { getPurchaseDetails, cancelPurchase } from "@/features/trading/purchases/actions";
import { cancelSupplierPaymentAction } from "@/features/trading/payments/actions";
import PaymentSummaryCard from "@/components/erp/payments/PaymentSummaryCard";
import PaymentHistoryTable from "@/components/erp/payments/PaymentHistoryTable";
import PaymentForm from "@/components/erp/payments/PaymentForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PurchaseDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const [purchase, setPurchase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelPending, setCancelPending] = useState(false);

  // Payments integration states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [cancellingPayment, setCancellingPayment] = useState<any | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isPending, startTransition] = useTransition();

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
        loadDetails(); // reload details to refresh metrics and status
      } else {
        toast.error(res.error || "Failed to cancel payment.");
      }
    });
  };

  const loadDetails = async () => {
    setLoading(true);
    try {
      const res = await getPurchaseDetails(id);
      if (res.success && res.data) {
        setPurchase(res.data);
      } else {
        toast.error(res.error || "Failed to load purchase details.");
        router.push("/trading/purchases");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load purchase details.");
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
      const res = await cancelPurchase(id);
      if (res.success) {
        toast.success("Purchase invoice cancelled successfully!");
        setCancelOpen(false);
        loadDetails();
      } else {
        toast.error(res.error || "Failed to cancel invoice.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel invoice.");
    } finally {
      setCancelPending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto animate-pulse">
        <Header title="Invoice Details" subtitle="Loading invoice details..." />
        <CardSkeleton />
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="py-16 text-center">
        <span className="text-sm font-semibold text-slate-500">Purchase details not found.</span>
      </div>
    );
  }

  const isCompleted = purchase.status === "COMPLETED";
  const isCancelled = purchase.status === "CANCELLED";
  const isDraft = purchase.status === "DRAFT";

  return (
    <div className="flex flex-col gap-6">
      {/* Top action header */}
      <div className="flex items-center gap-2">
        <Link
          href="/trading/purchases"
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-850 dark:hover:bg-slate-900 dark:text-slate-400"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
        </Link>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
          Back to Purchases list
        </span>
      </div>

      <Header
        title={`Purchase Details: ${purchase.purchaseNumber}`}
        subtitle={`Registered on ${new Date(purchase.purchaseDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`}
        action={
          isCompleted ? (
            <Button
              variant="danger"
              onPress={() => setCancelOpen(true)}
              className="w-full sm:w-auto font-bold rounded-xl"
              size="md"
            >
              <AlertTriangle className="w-4 h-4 mr-1.5" />
              <span>Cancel Invoice</span>
            </Button>
          ) : undefined
        }
      />

      {/* Payment Summary */}
      {isCompleted && (
        <PaymentSummaryCard
          grandTotal={purchase.grandTotal}
          totalPaid={purchase.totalPaid}
          remainingBalance={purchase.remainingBalance}
          paymentStatus={purchase.paymentStatus}
        />
      )}

      {/* Main detail panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Supplier & Invoice Summary */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Header summaries */}
          <Card title="Invoice Summary">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm font-medium">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">
                  Invoice Status
                </span>
                <span
                  className={`font-bold mt-1 inline-self-start px-2.5 py-0.5 rounded-full text-xs ${
                    isCompleted
                      ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                      : isDraft
                      ? "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400"
                      : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                  }`}
                >
                  {purchase.status}
                </span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">
                  Payment Status
                </span>
                <span
                  className={`font-bold mt-1 inline-self-start px-2.5 py-0.5 rounded-full text-xs ${
                    purchase.paymentStatus === "PAID"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                      : purchase.paymentStatus === "PARTIALLY_PAID"
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                      : "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                  }`}
                >
                  {purchase.paymentStatus.replace("_", " ")}
                </span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">
                  Supplier Invoice No
                </span>
                <span className="text-slate-900 dark:text-slate-100 font-bold mt-1">
                  {purchase.supplierInvoiceNumber || "—"}
                </span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">
                  PO / Reference
                </span>
                <span className="text-slate-700 dark:text-slate-300 font-bold mt-1">
                  {purchase.reference || "—"}
                </span>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">
                  Created At
                </span>
                <span className="text-slate-500 dark:text-slate-400 mt-1">
                  {new Date(purchase.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          {/* Purchased Items List */}
          <Card title="Purchased Products">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-900 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">
                    <th className="py-3 px-2">Product</th>
                    <th className="py-3 px-2 text-right">Quantity</th>
                    <th className="py-3 px-2 text-right">Rate</th>
                    <th className="py-3 px-2 text-right">Discount</th>
                    <th className="py-3 px-2 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-950 text-sm">
                  {purchase.items.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <td className="py-3.5 px-2 flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {item.productName}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-550 font-bold uppercase mt-0.5">
                          {item.productCode} {item.remarks ? `• ${item.remarks}` : ""}
                        </span>
                      </td>
                      <td className="py-3.5 px-2 text-right font-semibold">
                        {item.quantity.toLocaleString()} {item.unitName}
                      </td>
                      <td className="py-3.5 px-2 text-right font-medium">
                        ₹{item.purchaseRate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-2 text-right text-slate-500">
                        ₹{item.discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-2 text-right font-bold text-slate-900 dark:text-white">
                        ₹{item.lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Stock movements generated by this purchase */}
          {purchase.stockMovements && purchase.stockMovements.length > 0 && (
            <Card title="Stock Movement Logs" subtitle="Audit records for inventory increases/decreases">
              <div className="flex flex-col gap-3">
                {purchase.stockMovements.map((sm: any) => (
                  <div
                    key={sm.id}
                    className="flex justify-between items-center p-3 rounded-xl border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/20 text-xs font-semibold"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {sm.productName}
                      </span>
                      <span className="text-[10px] text-slate-450 dark:text-slate-550 uppercase">
                        {sm.type === "PRODUCTION_OUTPUT" ? "MANUFACTURED" : sm.type} • {new Date(sm.createdAt).toLocaleString()}
                      </span>
                      {sm.notes && <span className="text-[10px] text-red-500 mt-0.5">{sm.notes}</span>}
                    </div>
                    <span className={`font-bold ${sm.quantity > 0 ? "text-green-600" : "text-red-500"}`}>
                      {sm.quantity > 0 ? "+" : ""}
                      {sm.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right column: Financial totals, supplier details, payments placeholder */}
        <div className="flex flex-col gap-6">
          {/* Supplier Info card */}
          <Card title="Supplier Information">
            <div className="flex flex-col gap-3.5 mt-1.5 text-sm font-semibold">
              <div className="flex gap-2.5 items-center">
                <User className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">
                    Supplier Name
                  </span>
                  <span className="text-slate-900 dark:text-slate-50 font-extrabold">{purchase.supplierName}</span>
                </div>
              </div>

              {purchase.supplierPhone && (
                <div className="flex gap-2.5 items-center">
                  <span className="text-[10px] text-slate-450 dark:text-slate-500 w-5 flex justify-center font-bold">
                    TEL
                  </span>
                  <div className="flex flex-col">
                    <span className="text-slate-800 dark:text-slate-200">{purchase.supplierPhone}</span>
                  </div>
                </div>
              )}

              {purchase.supplierGst && (
                <div className="flex gap-2.5 items-center">
                  <span className="text-[10px] text-slate-450 dark:text-slate-500 w-5 flex justify-center font-bold">
                    GST
                  </span>
                  <div className="flex flex-col">
                    <span className="text-slate-800 dark:text-slate-200">{purchase.supplierGst}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Pricing calculations */}
          <Card title="Financial Breakdown">
            <div className="flex flex-col gap-3.5 text-sm font-medium">
              <div className="flex justify-between items-center text-slate-550">
                <span>Subtotal</span>
                <span>₹{purchase.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-slate-550">
                <span>Discount</span>
                <span className="text-red-500">
                  -₹{purchase.discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-550">
                <span>Transport Charges</span>
                <span className="text-green-600">
                  +₹{purchase.transportCharges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-900 pt-3.5 mt-1">
                <span className="font-extrabold text-slate-900 dark:text-slate-100">Grand Total</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  ₹{purchase.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </Card>

          {/* Invoice notes */}
          {purchase.notes && (
            <Card title="Notes / Terms">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block whitespace-pre-wrap leading-relaxed">
                {purchase.notes}
              </span>
            </Card>
          )}

          {/* Payment allocations list */}
          <Card
            title="Linked Payments"
            headerAction={
              isCompleted && purchase.remainingBalance > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onPress={() => setIsPaymentModalOpen(true)}
                  className="font-bold rounded-lg px-2.5 h-8 text-xs bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                >
                  Record Payment
                </Button>
              )
            }
          >
            <PaymentHistoryTable
              payments={purchase.payments || []}
              onCancelClick={(p) => setCancellingPayment(p)}
            />
          </Card>
        </div>
      </div>

      {/* Cancel dialog */}
      {cancelOpen && (
        <ConfirmDialog
          isOpen={cancelOpen}
          onClose={() => setCancelOpen(false)}
          title="Cancel Purchase Invoice"
          message={`Are you sure you want to cancel purchase invoice "${purchase.purchaseNumber}"? This will reverse all product inventory stock quantities and clear the outstanding balance from this supplier's registry.`}
          onConfirm={handleCancelInvoice}
          confirmText="Yes, Cancel"
          isDanger={true}
          isLoading={cancelPending}
        />
      )}

      {/* Record Payment Drawer */}
      <div
        className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
          isPaymentModalOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div
          onClick={() => setIsPaymentModalOpen(false)}
          className={`absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
            isPaymentModalOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`relative w-full max-w-lg h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-300 ease-out ${
            isPaymentModalOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-50">Record Supplier Payment</span>
            <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {isPaymentModalOpen && (
              <PaymentForm
                contacts={[{ id: purchase.supplierId, name: purchase.supplierName, type: "SUPPLIER" }]}
                contactId={purchase.supplierId}
                purchaseId={purchase.id}
                prefilledBalance={purchase.remainingBalance}
                onSuccess={() => {
                  setIsPaymentModalOpen(false);
                  loadDetails();
                }}
                onCancel={() => setIsPaymentModalOpen(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Cancel Payment Drawer */}
      <div
        className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
          !!cancellingPayment ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div
          onClick={() => { setCancellingPayment(null); setCancellationReason(""); }}
          className={`absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
            !!cancellingPayment ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-300 ease-out ${
            !!cancellingPayment ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-lg font-bold text-red-600">Cancel Payment Receipt</span>
            <button type="button" onClick={() => { setCancellingPayment(null); setCancellationReason(""); }} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
            {cancellingPayment && (
              <>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Are you sure you want to cancel payment receipt{" "}
                  <strong className="text-slate-900 dark:text-white">{cancellingPayment.paymentNumber}</strong>{" "}
                  for ₹{cancellingPayment.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}?
                  This will restore the bill outstanding balance due.
                </p>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Reason for Cancellation *</label>
                  <input
                    type="text"
                    placeholder="Enter why this payment is being cancelled"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 font-semibold"
                  />
                </div>
              </>
            )}
          </div>
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
            <Button variant="ghost" onPress={() => { setCancellingPayment(null); setCancellationReason(""); }}>Keep Active</Button>
            <Button variant="primary" isPending={isPending} onPress={handleCancelPaymentSubmit} className="font-bold rounded-xl px-5 bg-red-600 hover:bg-red-700 border-none text-white">
              {isPending ? "Cancelling..." : "Cancel Payment"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
