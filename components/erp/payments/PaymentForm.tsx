"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPaymentSchema, CreatePaymentFormValues } from "@/features/trading/payments/validations";
import { createSupplierPaymentAction, getPendingSupplierPurchases } from "@/features/trading/payments/actions";
import { TextField, Label, Input, FieldError, Button } from "@heroui/react";
import ContactSelector from "@/components/ui/ContactSelector";
import DropdownSelector, { DropdownOption } from "@/components/ui/DropdownSelector";
import { CurrencyInput } from "@/components/ui/form/CurrencyInput";
import toast from "react-hot-toast";
import dayjs from "dayjs";

interface SupplierOption {
  id: string;
  name: string;
  type: string;
  phone?: string | null;
}

interface PendingPurchase {
  id: string;
  purchaseNumber: string;
  purchaseDate: Date | string;
  grandTotal: number;
  remainingBalance: number;
}

interface PaymentFormProps {
  suppliers?: SupplierOption[];
  purchaseId?: string; // Preselected purchase
  contactId?: string; // Preselected supplier
  prefilledBalance?: number; // Preselected remaining balance
  onSuccess: (paymentId: string, paymentNumber: string) => void;
  onCancel: () => void;
}

export default function PaymentForm({
  suppliers = [],
  purchaseId = "",
  contactId = "",
  prefilledBalance,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const [pendingPurchases, setPendingPurchases] = useState<PendingPurchase[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(contactId);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>(purchaseId);
  const [selectedPurchase, setSelectedPurchase] = useState<PendingPurchase | null>(null);
  
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isPrefilledMode = !!purchaseId;

  // React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(createPaymentSchema),
    defaultValues: {
      contactId: contactId,
      purchaseId: purchaseId,
      amount: prefilledBalance || 0,
      paymentDate: dayjs(new Date()).format("YYYY-MM-DD"),
      paymentMethod: "CASH",
      referenceNumber: "",
      notes: "",
    },
  });

  const amountWatch = watch("amount");

  // Fetch pending purchases when selectedSupplierId changes (only in generic mode)
  useEffect(() => {
    if (isPrefilledMode || !selectedSupplierId) {
      setPendingPurchases([]);
      return;
    }

    async function loadPendingBills() {
      try {
        setLoadingPurchases(true);
        const res = await getPendingSupplierPurchases(selectedSupplierId);
        if (res.success && res.data) {
          setPendingPurchases(res.data);
          
          // Clear purchase if not in list
          if (!res.data.find((p) => p.id === selectedPurchaseId)) {
            setSelectedPurchaseId("");
            setValue("purchaseId", "");
            setSelectedPurchase(null);
            setValue("amount", 0);
          }
        } else {
          toast.error(res.error || "Failed to load supplier bills");
        }
      } catch (err) {
        console.error(err);
        toast.error("An error occurred loading bills");
      } finally {
        setLoadingPurchases(false);
      }
    }

    loadPendingBills();
  }, [selectedSupplierId, isPrefilledMode, selectedPurchaseId, setValue]);

  // Synchronize dynamic purchase details
  useEffect(() => {
    if (isPrefilledMode) return;

    const purchase = pendingPurchases.find((p) => p.id === selectedPurchaseId);
    if (purchase) {
      setSelectedPurchase(purchase);
      setValue("amount", purchase.remainingBalance);
    } else {
      setSelectedPurchase(null);
      setValue("amount", 0);
    }
  }, [selectedPurchaseId, pendingPurchases, isPrefilledMode, setValue]);

  // Save selected values back to Form
  const handleSupplierChange = (id: string) => {
    setSelectedSupplierId(id);
    setValue("contactId", id, { shouldValidate: true });
  };

  const handlePurchaseChange = (id: string) => {
    setSelectedPurchaseId(id);
    setValue("purchaseId", id, { shouldValidate: true });
  };

  const onSubmit = (values: CreatePaymentFormValues) => {
    // Client-side safety balance check
    const currentBalance = isPrefilledMode
      ? (prefilledBalance ?? 0)
      : (selectedPurchase?.remainingBalance ?? 0);

    if (values.amount > currentBalance + 0.01) {
      toast.error(
        `Payment amount (₹${values.amount.toFixed(2)}) exceeds the remaining balance (₹${currentBalance.toFixed(2)}).`
      );
      return;
    }

    startTransition(async () => {
      const res = await createSupplierPaymentAction(values);
      if (res.success && res.data) {
        toast.success("Payment recorded successfully!");
        onSuccess(res.data.id, res.data.paymentNumber);
      } else {
        toast.error(res.error || "Failed to save payment.");
      }
    });
  };

  // Convert pending purchases to dropdown options
  const purchaseOptions: DropdownOption[] = pendingPurchases.map((p) => {
    const dateStr = dayjs(p.purchaseDate).format("DD MMM YYYY");
    return {
      id: p.id,
      name: `${p.purchaseNumber} (Grand Total: ₹${p.grandTotal})`,
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
      {/* 1. Supplier Selector */}
      {isPrefilledMode ? (
        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Supplier
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-50 mt-0.5 block">
            {suppliers.find((s) => s.id === contactId)?.name || "Selected Supplier"}
          </span>
        </div>
      ) : (
        <div>
          <ContactSelector
            contacts={suppliers}
            selectedKey={selectedSupplierId}
            onSelectionChange={handleSupplierChange}
            label="Supplier"
            placeholder="Search and choose supplier"
            isInvalid={!!errors.contactId}
            errorMessage={errors.contactId?.message ? String(errors.contactId.message) : undefined}
          />
        </div>
      )}

      {/* 2. Purchase Invoice Selector */}
      {isPrefilledMode ? (
        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Ref Purchase Invoice
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-50 mt-0.5 block">
            Invoice Balance Due: ₹{(prefilledBalance ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>
      ) : (
        <div>
          <DropdownSelector
            options={purchaseOptions}
            selectedId={selectedPurchaseId}
            onChange={handlePurchaseChange}
            label="Select Pending Purchase Invoice"
            placeholder={
              !selectedSupplierId
                ? "Select a supplier first"
                : loadingPurchases
                ? "Loading pending invoices..."
                : pendingPurchases.length === 0
                ? "No pending invoices found for this supplier"
                : "Choose purchase bill to settle"
            }
            isInvalid={!!errors.purchaseId}
            errorMessage={errors.purchaseId?.message ? String(errors.purchaseId.message) : undefined}
            className={!selectedSupplierId ? "opacity-60 pointer-events-none" : ""}
          />
        </div>
      )}

      {/* 3. Amount Field */}
      <Controller
        name="amount"
        control={control}
        render={({ field }) => (
          <CurrencyInput
            label="Payment Amount"
            value={field.value}
            onChange={field.onChange}
            error={errors.amount}
          />
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Date Input */}
        <TextField isInvalid={!!errors.paymentDate} className="flex flex-col gap-1 w-full">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-350">
            Payment Date
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
          onPress={onCancel}
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
          {isPending ? "Recording..." : "Record Payment"}
        </Button>
      </div>
    </form>
  );
}
