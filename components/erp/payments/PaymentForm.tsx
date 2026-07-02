"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPaymentSchema, createReceiptSchema, CreatePaymentFormValues } from "@/features/trading/payments/validations";
import {
  createSupplierPaymentAction,
  createCustomerReceiptAction,
  getPendingSupplierPurchases,
  getPendingCustomerSales
} from "@/features/trading/payments/actions";
import { TextField, Label, Input, Button } from "@heroui/react";
import ContactSelector from "@/components/ui/ContactSelector";
import DropdownSelector, { DropdownOption } from "@/components/ui/DropdownSelector";
import { CurrencyInput } from "@/components/ui/form/CurrencyInput";
import toast from "react-hot-toast";
import dayjs from "dayjs";

interface ContactOption {
  id: string;
  name: string;
  type: string;
  phone?: string | null;
}

interface PendingInvoice {
  id: string;
  purchaseNumber?: string;
  saleNumber?: string;
  purchaseDate?: Date | string;
  saleDate?: Date | string;
  grandTotal: number;
  remainingBalance: number;
}

interface PaymentFormProps {
  contacts?: ContactOption[];
  purchaseId?: string; // Preselected purchase
  saleId?: string; // Preselected sale
  contactId?: string; // Preselected contact
  prefilledBalance?: number; // Preselected remaining balance
  onSuccess: (paymentId: string, paymentNumber: string) => void;
  onCancel: () => void;
  mode?: "SUPPLIER" | "CUSTOMER";
}

export default function PaymentForm({
  contacts = [],
  purchaseId = "",
  saleId = "",
  contactId = "",
  prefilledBalance,
  onSuccess,
  onCancel,
  mode = "SUPPLIER",
}: PaymentFormProps) {
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>(contactId);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(mode === "SUPPLIER" ? purchaseId : saleId);
  const [selectedInvoice, setSelectedInvoice] = useState<PendingInvoice | null>(null);

  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isPrefilledMode = mode === "SUPPLIER" ? !!purchaseId : !!saleId;
  const isSupplier = mode === "SUPPLIER";

  // React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(isSupplier ? createPaymentSchema : createReceiptSchema),
    defaultValues: {
      contactId: contactId,
      purchaseId: isSupplier ? purchaseId : undefined,
      saleId: !isSupplier ? saleId : undefined,
      amount: prefilledBalance || 0,
      paymentDate: dayjs(new Date()).format("YYYY-MM-DD"),
      paymentMethod: "CASH",
      referenceNumber: "",
      notes: "",
    },
  });

  // Fetch pending invoices when selectedContactId changes (only in generic selection mode)
  useEffect(() => {
    if (isPrefilledMode || !selectedContactId) {
      setPendingInvoices([]);
      return;
    }

    async function loadPendingBills() {
      try {
        setLoadingInvoices(true);
        const res = isSupplier
          ? await getPendingSupplierPurchases(selectedContactId)
          : await getPendingCustomerSales(selectedContactId);

        if (res.success && res.data) {
          setPendingInvoices(res.data);

          // Clear invoice if not in list
          if (!res.data.find((p: any) => p.id === selectedInvoiceId)) {
            setSelectedInvoiceId("");
            setValue(isSupplier ? "purchaseId" : "saleId", "");
            setSelectedInvoice(null);
            setValue("amount", 0);
          }
        } else {
          toast.error(res.error || `Failed to load ${isSupplier ? "supplier bills" : "customer sales"}`);
        }
      } catch (err) {
        console.error(err);
        toast.error("An error occurred loading pending invoices");
      } finally {
        setLoadingInvoices(false);
      }
    }

    loadPendingBills();
  }, [selectedContactId, isPrefilledMode, selectedInvoiceId, setValue, isSupplier]);

  // Synchronize dynamic invoice details
  useEffect(() => {
    if (isPrefilledMode) return;

    const invoice = pendingInvoices.find((p) => p.id === selectedInvoiceId);
    if (invoice) {
      setSelectedInvoice(invoice);
      setValue("amount", invoice.remainingBalance);
    } else {
      setSelectedInvoice(null);
      setValue("amount", 0);
    }
  }, [selectedInvoiceId, pendingInvoices, isPrefilledMode, setValue]);

  // Save selected values back to Form
  const handleContactChange = (id: string) => {
    setSelectedContactId(id);
    setValue("contactId", id, { shouldValidate: true });
  };

  const handleInvoiceChange = (id: string) => {
    setSelectedInvoiceId(id);
    setValue(isSupplier ? "purchaseId" : "saleId", id, { shouldValidate: true });
  };

  const onSubmit = (values: any) => {
    // Client-side safety balance check
    const currentBalance = isPrefilledMode
      ? (prefilledBalance ?? 0)
      : (selectedInvoice?.remainingBalance ?? 0);

    if (values.amount > currentBalance + 0.01) {
      toast.error(
        `Transaction amount (₹${values.amount.toFixed(2)}) exceeds the remaining balance (₹${currentBalance.toFixed(2)}).`
      );
      return;
    }

    startTransition(async () => {
      const res = isSupplier
        ? await createSupplierPaymentAction(values)
        : await createCustomerReceiptAction(values);

      if (res.success && res.data) {
        toast.success(isSupplier ? "Payment recorded successfully!" : "Receipt recorded successfully!");
        onSuccess(res.data.id, res.data.paymentNumber);
      } else {
        toast.error(res.error || "Failed to save transaction.");
      }
    });
  };

  // Convert pending invoices to dropdown options
  const invoiceOptions: DropdownOption[] = pendingInvoices.map((p) => {
    const rawDate = isSupplier ? p.purchaseDate : p.saleDate;
    const dateStr = dayjs(rawDate).format("DD MMM YYYY");
    const num = isSupplier ? p.purchaseNumber : p.saleNumber;
    return {
      id: p.id,
      name: `${num} (Grand Total: ₹${p.grandTotal})`,
      subtext: `Date: ${dateStr} • Balance: ₹${p.remainingBalance}`,
    };
  });

  const paymentMethodOptions = [
    { key: "CASH", label: "Cash" },
    { key: "BANK_TRANSFER", label: "Bank Transfer" },
    { key: "UPI", label: "UPI" },
    { key: "CHEQUE", label: "Cheque" },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-left">
      {/* 1. Contact Selector */}
      {isPrefilledMode ? (
        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            {isSupplier ? "Supplier" : "Customer"}
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-50 mt-0.5 block">
            {contacts.find((s) => s.id === contactId)?.name || (isSupplier ? "Selected Supplier" : "Selected Customer")}
          </span>
        </div>
      ) : (
        <div>
          <ContactSelector
            contacts={contacts}
            selectedKey={selectedContactId}
            onSelectionChange={handleContactChange}
            label={isSupplier ? "Supplier" : "Customer"}
            placeholder={isSupplier ? "Search and choose supplier" : "Search and choose customer"}
            isInvalid={!!errors.contactId}
            errorMessage={errors.contactId?.message ? String(errors.contactId.message) : undefined}
          />
        </div>
      )}

      {/* 2. Ref Invoice Selector */}
      {isPrefilledMode ? (
        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            {isSupplier ? "Ref Purchase Invoice" : "Ref Sales Invoice"}
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-50 mt-0.5 block">
            Invoice Balance Due: ₹{(prefilledBalance ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>
      ) : (
        <div>
          <DropdownSelector
            options={invoiceOptions}
            selectedId={selectedInvoiceId}
            onChange={handleInvoiceChange}
            label={isSupplier ? "Select Pending Purchase Invoice" : "Select Pending Sales Invoice"}
            placeholder={
              !selectedContactId
                ? `Select a ${isSupplier ? "supplier" : "customer"} first`
                : loadingInvoices
                ? "Loading pending invoices..."
                : pendingInvoices.length === 0
                ? `No pending invoices found for this ${isSupplier ? "supplier" : "customer"}`
                : `Choose ${isSupplier ? "purchase bill" : "sale invoice"} to settle`
            }
            isInvalid={isSupplier ? !!errors.purchaseId : !!errors.saleId}
            errorMessage={
              isSupplier
                ? (errors.purchaseId?.message ? String(errors.purchaseId.message) : undefined)
                : (errors.saleId?.message ? String(errors.saleId.message) : undefined)
            }
            className={!selectedContactId ? "opacity-60 pointer-events-none" : ""}
          />
        </div>
      )}

      {/* 3. Amount Field */}
      <Controller
        name="amount"
        control={control}
        render={({ field }) => (
          <CurrencyInput
            label={isSupplier ? "Payment Amount" : "Receipt Amount"}
            value={field.value}
            onChange={(val) => {
              const num = Number(val);
              field.onChange(isNaN(num) ? 0 : num);
            }}
            error={errors.amount}
          />
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Date Input */}
        <TextField isInvalid={!!errors.paymentDate} className="flex flex-col gap-1 w-full">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-350">
            {isSupplier ? "Payment Date" : "Receipt Date"}
          </Label>
          <Input
            type="date"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-850 dark:bg-slate-950 dark:focus:border-slate-100 outline-none text-sm"
            {...register("paymentDate")}
          />
          {errors.paymentDate && (
            <span className="text-xs text-red-500 mt-1">{String(errors.paymentDate.message)}</span>
          )}
        </TextField>

        {/* Payment Method */}
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-350">
            Payment Method
          </label>
          <select
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-850 dark:bg-slate-950 dark:focus:border-slate-100 outline-none text-sm"
            {...register("paymentMethod")}
          >
            {paymentMethodOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reference Number */}
      <TextField isInvalid={!!errors.referenceNumber} className="flex flex-col gap-1 w-full">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-350">
          Reference Number (UPI / Txn / Cheque)
        </Label>
        <Input
          type="text"
          placeholder="Enter reference number (optional)"
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-850 dark:bg-slate-950 dark:focus:border-slate-100 outline-none text-sm"
          {...register("referenceNumber")}
        />
        {errors.referenceNumber && (
          <span className="text-xs text-red-500 mt-1">{String(errors.referenceNumber.message)}</span>
        )}
      </TextField>

      {/* Notes */}
      <TextField isInvalid={!!errors.notes} className="flex flex-col gap-1 w-full">
        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-350">
          Internal Notes
        </Label>
        <Input
          type="text"
          placeholder="Enter private notes (optional)"
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-850 dark:bg-slate-950 dark:focus:border-slate-100 outline-none text-sm"
          {...register("notes")}
        />
        {errors.notes && (
          <span className="text-xs text-red-500 mt-1">{String(errors.notes.message)}</span>
        )}
      </TextField>

      {/* Footer Buttons */}
      <div className="flex gap-3 justify-end mt-4">
        <Button
          type="button"
          variant="tertiary"
          onPress={() => {
            // Reset form to initial defaults
            reset({
              contactId: contactId,
              purchaseId: isSupplier ? purchaseId : undefined,
              saleId: !isSupplier ? saleId : undefined,
              amount: prefilledBalance || 0,
              paymentDate: dayjs(new Date()).format("YYYY-MM-DD"),
              paymentMethod: "CASH",
              referenceNumber: "",
              notes: "",
            });
            // Reset selections
            setSelectedContactId(contactId);
            setSelectedInvoiceId(isSupplier ? purchaseId : saleId);
            setSelectedInvoice(null);
            // Call external cancel handler
            onCancel();
          }}
          className="font-bold border border-slate-150 rounded-xl"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isPending={isPending}
          className="font-bold rounded-xl px-5"
        >
          {isPending ? "Recording..." : (isSupplier ? "Record Payment" : "Record Receipt")}
        </Button>
      </div>
    </form>
  );
}
