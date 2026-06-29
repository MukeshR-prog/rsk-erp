"use client";

import { use, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import PaymentStatusBadge from "@/components/erp/payments/PaymentStatusBadge";
import { getSupplierPayment, cancelSupplierPaymentAction } from "@/features/trading/payments/actions";
import dayjs from "dayjs";
import { Button, TextField, Label, Input, Modal, ModalBackdrop, ModalContainer, ModalDialog, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { ArrowLeft, Trash2, Calendar, FileText, Landmark, User } from "lucide-react";
import toast from "react-hot-toast";

interface PaymentDetail {
  id: string;
  paymentNumber: string;
  contactId: string;
  paymentType: "SUPPLIER_PAYMENT" | "CUSTOMER_RECEIPT";
  amount: number;
  paymentDate: Date | string;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "UPI" | "CHEQUE";
  referenceNumber?: string | null;
  notes?: string | null;
  status: "COMPLETED" | "CANCELLED";
  cancellationReason?: string | null;
  createdAt: Date | string;
  createdById?: string | null;
  purchaseId?: string | null;
  saleId?: string | null;
  contact: {
    name: string;
    phone?: string | null;
    email?: string | null;
    gstNumber?: string | null;
    address?: string | null;
  };
  purchase?: {
    purchaseNumber: string;
    purchaseDate: Date | string;
    grandTotal: number;
    paymentStatus: string;
  } | null;
  sale?: {
    saleNumber: string;
    saleDate: Date | string;
    grandTotal: number;
    paymentStatus: string;
  } | null;
}

interface PaymentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PaymentDetailPage({ params }: PaymentDetailPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const paymentId = resolvedParams.id;

  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const loadPaymentDetails = async () => {
    setLoading(true);
    try {
      const res = await getSupplierPayment(paymentId);
      if (res.success && res.data) {
        setPayment(res.data as any);
      } else {
        toast.error(res.error || "Failed to load payment details");
        router.push("/trading/payments");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred loading receipt");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentDetails();
  }, [paymentId]);

  const handleCancelSubmit = () => {
    if (!cancellationReason.trim()) {
      toast.error("Please enter a cancellation reason.");
      return;
    }

    startTransition(async () => {
      const res = await cancelSupplierPaymentAction(paymentId, cancellationReason);
      if (res.success) {
        toast.success("Transaction cancelled successfully!");
        setIsCancelModalOpen(false);
        setCancellationReason("");
        loadPaymentDetails();
      } else {
        toast.error(res.error || "Failed to cancel transaction.");
      }
    });
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center text-slate-500 font-medium">
        Loading transaction details...
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex h-[400px] items-center justify-center text-slate-500 font-medium">
        Transaction not found.
      </div>
    );
  }

  const paymentDateObj = new Date(payment.paymentDate);
  const createdDateObj = new Date(payment.createdAt);
  const isSupplier = payment.paymentType === "SUPPLIER_PAYMENT";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href={`/trading/payments?mode=${isSupplier ? "SUPPLIER" : "CUSTOMER"}`}>
          <Button
            variant="tertiary"
            size="sm"
            className="h-9 w-9 min-w-0 p-0 rounded-xl border border-slate-150"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button>
        </Link>
        <Header
          title={`${isSupplier ? "Payment Voucher" : "Receipt Voucher"}: ${payment.paymentNumber}`}
          subtitle={`Recorded on ${dayjs(paymentDateObj).format("DD MMM YYYY")}`}
          action={
            payment.status === "COMPLETED" && (
              <Button
                variant="primary"
                onPress={() => setIsCancelModalOpen(true)}
                className="w-full sm:w-auto font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white"
                size="md"
              >
                <Trash2 className="w-4.5 h-4.5 mr-1.5" />
                <span>Cancel {isSupplier ? "Payment" : "Receipt"}</span>
              </Button>
            )
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left main: Receipt and Settlement breakdown */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Amount settled */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-850 flex flex-col items-center justify-center text-center">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {isSupplier ? "Payment Amount Paid" : "Receipt Amount Collected"}
            </span>
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white block mt-2 tracking-tight">
              ₹{payment.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <div className="mt-4 flex gap-2">
              <PaymentStatusBadge status={payment.status} />
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 uppercase font-mono">
                {payment.paymentMethod.replace("_", " ")}
              </span>
            </div>
            {payment.status === "CANCELLED" && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-2xl max-w-lg w-full text-left text-xs font-medium">
                <span className="font-bold">Cancellation Reason:</span> {payment.cancellationReason || "No details provided"}
              </div>
            )}
          </div>

          {/* Details list */}
          <Card title="Transaction & Audit Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm mt-2">
              <div className="flex gap-3">
                <Calendar className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wide">Transaction Date</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">
                    {dayjs(paymentDateObj).format("DD MMMM YYYY")}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Landmark className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wide">Reference / Txn No.</span>
                  <span className="text-slate-800 dark:text-slate-200 font-mono font-bold mt-0.5">
                    {payment.referenceNumber || "N/A"}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <User className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wide">Recorded By</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">
                    User ({payment.createdById || "System Seed"})
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Calendar className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wide">System Log Created</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">
                    {dayjs(createdDateObj).format("DD MMM YYYY, hh:mm A")}
                  </span>
                </div>
              </div>
            </div>

            {payment.notes && (
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-850">
                <span className="text-xs text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wide block">Internal Notes / Remarks</span>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 italic">
                  "{payment.notes}"
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Right column: Contact and Invoice connections */}
        <div className="flex flex-col gap-6">
          {/* Profile Card */}
          <Card title={isSupplier ? "Supplier Profile" : "Customer Profile"} subtitle="Contact profile details">
            <div className="flex flex-col gap-3 mt-1.5 text-sm">
              <div>
                <span className="text-xs text-slate-400 font-bold block">Company Name</span>
                <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">{payment.contact.name}</span>
              </div>
              {payment.contact.phone && (
                <div>
                  <span className="text-xs text-slate-450 dark:text-slate-500 font-bold block">Phone</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">{payment.contact.phone}</span>
                </div>
              )}
              {payment.contact.gstNumber && (
                <div>
                  <span className="text-xs text-slate-455 dark:text-slate-500 font-bold block">GSTIN</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 block uppercase">{payment.contact.gstNumber}</span>
                </div>
              )}
              {payment.contact.address && (
                <div>
                  <span className="text-xs text-slate-455 dark:text-slate-500 font-bold block">Billing Address</span>
                  <span className="text-slate-600 dark:text-slate-400 mt-0.5 block text-xs leading-relaxed">{payment.contact.address}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Reference Invoice connection */}
          {isSupplier && payment.purchase && (
            <Card title="Ref Invoice Link" subtitle="Connected purchase bill details">
              <div className="flex flex-col gap-3 mt-1.5 text-sm">
                <div>
                  <span className="text-xs text-slate-400 font-bold block">Invoice Code</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">{payment.purchase.purchaseNumber}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold block">Invoice Grand Total</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    ₹{payment.purchase.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="mt-2">
                  <Link href={`/trading/purchases/${payment.purchaseId}`}>
                    <Button
                      variant="tertiary"
                      size="sm"
                      className="w-full font-bold border border-slate-150 rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-4 h-4 text-slate-550" />
                      <span>Open Purchase Bill</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {!isSupplier && payment.sale && (
            <Card title="Ref Invoice Link" subtitle="Connected sales invoice details">
              <div className="flex flex-col gap-3 mt-1.5 text-sm">
                <div>
                  <span className="text-xs text-slate-400 font-bold block">Invoice Code</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white mt-0.5 block">{payment.sale.saleNumber}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold block">Invoice Grand Total</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    ₹{payment.sale.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="mt-2">
                  <Link href={`/trading/sales/${payment.saleId}`}>
                    <Button
                      variant="tertiary"
                      size="sm"
                      className="w-full font-bold border border-slate-150 rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span>Open Sales Invoice</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Cancellation confirmation modal */}
      <Modal isOpen={isCancelModalOpen} onOpenChange={(open) => { if (!open) setIsCancelModalOpen(false); }}>
        <ModalBackdrop />
        <ModalContainer>
          <ModalDialog className="bg-white dark:bg-slate-950 p-6 rounded-2xl max-w-md w-full text-left">
            <ModalHeader className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-850 pb-3 mb-4">
              Cancel {isSupplier ? "Payment Voucher" : "Receipt Voucher"}
            </ModalHeader>
            <ModalBody className="flex flex-col gap-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Are you sure you want to cancel {isSupplier ? "payment" : "receipt"} voucher{" "}
                <strong className="text-slate-900 dark:text-white">
                  {payment.paymentNumber}
                </strong>{" "}
                for ₹
                {payment.amount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
                ? This operation is irreversible and will restore the invoice balance due.
              </p>

              <TextField className="flex flex-col gap-1 w-full">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-350">
                  Reason for Cancellation
                </Label>
                <Input
                  placeholder="Enter why this is being cancelled"
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
                  setIsCancelModalOpen(false);
                  setCancellationReason("");
                }}
                className="font-bold border border-slate-150 rounded-xl"
              >
                Keep Active
              </Button>
              <Button
                variant="primary"
                isPending={isPending}
                onPress={handleCancelSubmit}
                className="font-bold rounded-xl px-5 bg-red-600 hover:bg-red-700 text-white"
              >
                {isPending ? "Cancelling..." : "Cancel Voucher"}
              </Button>
            </ModalFooter>
          </ModalDialog>
        </ModalContainer>
      </Modal>
    </div>
  );
}
