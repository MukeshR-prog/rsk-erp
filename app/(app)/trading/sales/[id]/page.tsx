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
  X,
  Printer,
} from "lucide-react";
import { Button } from "@heroui/react";

import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import ConfirmDialog from "@/components/ui/ConfirmDialog";


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

  const handlePrintReceipt = () => {
    // Create a print window to print invoice cleanly
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup blocked! Please allow popups to print/download invoice.");
      return;
    }

    const itemsHtml = sale.items.map((it: any) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px; font-weight: 600;">${it.product?.name || "Product"}</td>
        <td style="padding: 8px; text-align: right;">${it.quantity}</td>
        <td style="padding: 8px; text-align: right;">₹${Number(it.sellingRate).toFixed(2)}</td>
        <td style="padding: 8px; text-align: right;">₹${Number(it.discount).toFixed(2)}</td>
        <td style="padding: 8px; text-align: right; font-weight: 700;">₹${Number(it.lineTotal).toFixed(2)}</td>
      </tr>
    `).join("");

    const paymentsHtml = sale.payments.map((p: any) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 6px; font-size: 11px;">${p.paymentNumber}</td>
        <td style="padding: 6px; font-size: 11px; text-align: center;">${new Date(p.paymentDate).toLocaleDateString()}</td>
        <td style="padding: 6px; font-size: 11px; text-align: center;">${p.paymentMethod}</td>
        <td style="padding: 6px; font-size: 11px; text-align: right; font-weight: 600;">₹${Number(p.amount).toFixed(2)}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt_${sale.saleNumber}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; padding: 40px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
            .company-info { text-align: left; }
            .invoice-info { text-align: right; }
            .title { font-size: 24px; font-weight: 900; color: #059669; margin: 0; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .card { border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; }
            .card-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
            .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .table th { background-color: #f8fafc; padding: 10px; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; text-align: left; border-bottom: 1px solid #cbd5e1; }
            .totals { margin-top: 30px; border-top: 2px solid #e2e8f0; padding-top: 15px; display: flex; flex-direction: column; align-items: flex-end; }
            .total-row { display: flex; width: 300px; justify-content: space-between; padding: 4px 0; font-size: 14px; }
            .grand-total { font-size: 18px; font-weight: 800; color: #059669; border-top: 1px solid #cbd5e1; padding-top: 8px; margin-top: 4px; }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <h2 style="margin: 0; color: #0f172a; font-weight: 800;">RSK Manufacturing & Trading</h2>
              <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">ERP Billing System</p>
            </div>
            <div class="invoice-info">
              <h1 class="title">RETAIL INVOICE</h1>
              <p style="font-size: 14px; font-weight: 700; margin: 5px 0 0 0;">No: ${sale.saleNumber}</p>
              <p style="font-size: 12px; color: #64748b; margin: 2px 0 0 0;">Date: ${new Date(sale.saleDate).toLocaleDateString("en-IN")}</p>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <div class="card-title">Customer Details</div>
              <p style="margin: 0; font-weight: 700; font-size: 14px;">${sale.customer?.name}</p>
              ${sale.customer?.contactPerson ? `<p style="margin: 4px 0; font-size: 12px;">Attn: ${sale.customer.contactPerson}</p>` : ""}
              ${sale.customer?.phone ? `<p style="margin: 4px 0; font-size: 12px; font-family: monospace;">Mob: ${sale.customer.phone}</p>` : ""}
              ${sale.customer?.gstNumber ? `<p style="margin: 4px 0; font-size: 12px; font-family: monospace; font-weight: 600;">GSTIN: ${sale.customer.gstNumber.toUpperCase()}</p>` : ""}
            </div>
            <div class="card">
              <div class="card-title">Shipment Info & Logistics</div>
              <p style="margin: 0; font-size: 12px;"><strong>Ref PO:</strong> ${sale.reference || "-"}</p>
              <p style="margin: 4px 0; font-size: 12px;"><strong>Status:</strong> ${sale.status}</p>
              <p style="margin: 4px 0; font-size: 12px;"><strong>Notes:</strong> ${sale.notes || "N/A"}</p>
            </div>
          </div>

          <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 8px;">Sold Items Details</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Product Description</th>
                <th style="text-align: right; width: 80px;">Qty</th>
                <th style="text-align: right; width: 120px;">Selling Rate</th>
                <th style="text-align: right; width: 100px;">Discount</th>
                <th style="text-align: right; width: 120px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="display: flex; justify-content: space-between; margin-top: 30px;">
            <div style="width: 50%;">
              ${sale.payments && sale.payments.length > 0 ? `
                <h4 style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #475569; margin: 0 0 8px 0;">Receipt Payments Log</h4>
                <table class="table" style="font-size: 11px;">
                  <thead>
                    <tr>
                      <th style="padding: 6px;">Receipt No</th>
                      <th style="padding: 6px; text-align: center;">Date</th>
                      <th style="padding: 6px; text-align: center;">Method</th>
                      <th style="padding: 6px; text-align: right;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${paymentsHtml}
                  </tbody>
                </table>
              ` : '<p style="font-size: 12px; color: #94a3b8; font-style: italic; margin-top: 10px;">No payment receipts logged yet.</p>'}
            </div>
            
            <div class="totals" style="width: 45%;">
              <div class="total-row">
                <span style="color: #64748b;">Subtotal:</span>
                <span>₹${subtotal.toFixed(2)}</span>
              </div>
              <div class="total-row" style="color: #d97706;">
                <span>Discount:</span>
                <span>- ₹${discount.toFixed(2)}</span>
              </div>
              <div class="total-row" style="color: #475569;">
                <span>Transport Charges:</span>
                <span>+ ₹${transportCharges.toFixed(2)}</span>
              </div>
              <div class="total-row grand-total">
                <span>Grand Total:</span>
                <span>₹${grandTotal.toFixed(2)}</span>
              </div>
              <div class="total-row" style="margin-top: 8px; font-weight: 600; font-size: 12px;">
                <span style="color: #64748b;">Amount Paid:</span>
                <span style="color: #059669;">₹${totalPaid.toFixed(2)}</span>
              </div>
              <div class="total-row" style="font-weight: 700; font-size: 13px;">
                <span style="color: #64748b;">Balance Due:</span>
                <span style="color: #ef4444;">₹${dueAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style="margin-top: 60px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 11px; color: #94a3b8;">
            Thank you for your business! Generated on ${new Date().toLocaleString()}
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
              onPress={handlePrintReceipt}
              className="rounded-xl text-xs font-bold border-slate-200 text-slate-750 hover:bg-slate-50 dark:border-slate-850 dark:text-slate-300"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              <span>Print Invoice</span>
            </Button>
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-emerald-600/10 dark:bg-emerald-950/20 rounded-xl">
            <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-450" />
          </div>
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl font-black text-slate-900 dark:text-white">{sale.saleNumber}</span>
              <SaleStatusBadge status={sale.status} />
              <SaleStatusBadge paymentStatus={sale.paymentStatus} />
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Recorded at: {new Date(sale.createdAt).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div className="flex flex-col md:items-end gap-1">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Invoice Grand Total
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
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
                  <span className="text-slate-500 dark:text-slate-400">Name</span>
                  <span className="font-bold text-slate-900 dark:text-slate-50">{sale.customer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Contact Person</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{sale.customer.contactPerson || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Phone</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{sale.customer.phone || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">GSTIN</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono uppercase">{sale.customer.gstNumber || "Unregistered"}</span>
                </div>
              </div>
            </Card>

            <Card title="Invoice Logistics">
              <div className="flex flex-col gap-2.5 text-sm mt-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Invoice Date</span>
                  <span className="font-bold text-slate-900 dark:text-slate-50">
                    {new Date(sale.saleDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Reference PO No</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{sale.reference || "-"}</span>
                </div>
                <div className="flex flex-col gap-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-850">
                  <span className="text-slate-550 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Terms & Dispatch Notes</span>
                  <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed mt-0.5">{sale.notes || "No special remarks logged."}</p>
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
            <div className="overflow-x-auto w-full rounded-xl border border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-950/20">
              <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                <thead>
                  <tr className="bg-slate-50/60 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-850 text-slate-550 dark:text-slate-400 font-bold text-xs uppercase">
                    <th className="p-3">Product</th>
                    <th className="p-3 text-right">Movement Qty</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Logged Date</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850/50">
                  {stockMovements.map((sm) => {
                    const isIncrease = Number(sm.quantity) > 0;
                    return (
                      <tr key={sm.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-colors">
                        <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{sm.product.name}</td>
                        <td className={`p-3 text-right font-black ${isIncrease ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-450'}`}>
                          {isIncrease ? "+" : ""}{Number(sm.quantity).toLocaleString()}
                        </td>
                        <td className="p-3 font-bold text-[10px] uppercase text-slate-500 dark:text-slate-400">{sm.type}</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400 text-xs font-semibold">{new Date(sm.createdAt).toLocaleString()}</td>
                        <td className="p-3 text-slate-500 dark:text-slate-400 truncate max-w-[200px] text-xs font-medium" title={sm.notes || ""}>
                          {sm.notes || "-"}
                        </td>
                      </tr>
                    );
                  })}
                  {stockMovements.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400 dark:text-slate-500 font-bold uppercase text-xs tracking-wider">
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

      {/* Record Customer Receipt Drawer */}
      <div
        className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
          isReceiptModalOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div
          onClick={() => setIsReceiptModalOpen(false)}
          className={`absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
            isReceiptModalOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`relative w-full max-w-lg h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-300 ease-out ${
            isReceiptModalOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-50">Record Customer Payment Receipt</span>
            <button type="button" onClick={() => setIsReceiptModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {isReceiptModalOpen && (
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
            )}
          </div>
        </div>
      </div>

      {/* Cancel Payment Receipt Drawer */}
      <div
        className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
          !!cancellingReceipt ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div
          onClick={() => setCancellingReceipt(null)}
          className={`absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
            !!cancellingReceipt ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          className={`relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-300 ease-out ${
            !!cancellingReceipt ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-lg font-bold text-rose-600">Cancel Payment Receipt</span>
            <button type="button" onClick={() => setCancellingReceipt(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
            {cancellingReceipt && (
              <>
                <p className="text-sm text-slate-500 leading-normal">
                  Specify the reason for cancelling receipt transaction{" "}
                  <strong className="text-slate-800 dark:text-slate-200">{cancellingReceipt.paymentNumber}</strong>{" "}
                  of amount <strong>₹{Number(cancellingReceipt.amount).toLocaleString()}</strong>.
                </p>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Cancellation Reason *</label>
                  <input
                    type="text"
                    placeholder="e.g. Bounced cheque, wrong ledger entry..."
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white font-semibold"
                  />
                </div>
              </>
            )}
          </div>
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
            <Button variant="ghost" onPress={() => setCancellingReceipt(null)}>Close</Button>
            <Button
              variant="danger"
              isDisabled={isPending}
              onPress={handleCancelReceiptSubmit}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl px-4 border-none"
            >
              {isPending ? "Cancelling..." : "Confirm Reversal"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
