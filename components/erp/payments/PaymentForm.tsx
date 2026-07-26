"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createPaymentSchema,
  createReceiptSchema,
} from "@/features/trading/payments/validations";
import {
  createSupplierPaymentAction,
  createCustomerReceiptAction,
  getContactSummaryAction,
} from "@/features/trading/payments/actions";
import { Button } from "@heroui/react";
import ContactSelector from "@/components/ui/ContactSelector";
import { CurrencyInput } from "@/components/ui/form/CurrencyInput";
import toast from "react-hot-toast";
import dayjs from "dayjs";

interface ContactOption {
  id: string;
  name: string;
  type: string;
  phone?: string | null;
}

interface ContactSummary {
  totalAmount: number; // totalPurchases or totalSales
  totalPaid: number; // totalPaid or totalReceived
  outstandingBalance: number;
}

interface PaymentFormProps {
  contacts?: ContactOption[];
  contactId?: string; // Preselected contact
  purchaseId?: string; // Optional purchase link
  saleId?: string; // Optional sale link
  prefilledBalance?: number; // Optional prefilled balance
  onSuccess: (paymentId: string, paymentNumber: string) => void;
  onCancel: () => void;
  mode?: "SUPPLIER" | "CUSTOMER";
}

export default function PaymentForm({
  contacts = [],
  contactId = "",
  prefilledBalance,
  onSuccess,
  onCancel,
  mode = "SUPPLIER",
}: PaymentFormProps) {
  const [selectedContactId, setSelectedContactId] = useState<string>(contactId);
  const [summary, setSummary] = useState<ContactSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isSupplier = mode === "SUPPLIER";

  // React Hook Form
  const {
    handleSubmit,
    setValue,
    control,
    register,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(
      isSupplier ? createPaymentSchema : createReceiptSchema,
    ),
    defaultValues: {
      contactId: contactId,
      amount: "",
      paymentDate: dayjs(new Date()).format("YYYY-MM-DD"),
      paymentMethod: "CASH",
      referenceNumber: "",
      notes: "",
    },
  });

  // Fetch summary when selectedContactId changes
  useEffect(() => {
    if (!selectedContactId) {
      setSummary(null);
      return;
    }

    async function loadSummary() {
      try {
        setLoadingSummary(true);
        const res = await getContactSummaryAction(selectedContactId, mode);
        if (res.success && res.data) {
          const data = res.data as any;
          const totalAmount = isSupplier ? data.totalPurchases : data.totalSales;
          const totalPaid = isSupplier ? data.totalPaid : data.totalReceived;
          const outstandingBalance = data.outstandingBalance;

          setSummary({ totalAmount, totalPaid, outstandingBalance });
        } else {
          toast.error(res.error || "Failed to load account balance");
        }
      } catch (err) {
        console.error(err);
        toast.error("An error occurred loading contact summary");
      } finally {
        setLoadingSummary(false);
      }
    }

    loadSummary();
  }, [selectedContactId, mode, isSupplier]);

  const handleContactChange = (id: string) => {
    setSelectedContactId(id);
    setValue("contactId", id, { shouldValidate: true });
  };

  const onSubmit = (values: any) => {
    // Combine selected date with current local time
    const now = dayjs();
    let finalDate = dayjs(values.paymentDate);
    if (finalDate.isValid()) {
      finalDate = finalDate
        .hour(now.hour())
        .minute(now.minute())
        .second(now.second())
        .millisecond(now.millisecond());
    }

    const submissionValues = {
      ...values,
      paymentDate: finalDate.isValid() ? finalDate.toISOString() : values.paymentDate,
    };

    startTransition(async () => {
      const res = isSupplier
        ? await createSupplierPaymentAction(submissionValues)
        : await createCustomerReceiptAction(submissionValues);

      if (res.success && res.data) {
        toast.success(
          isSupplier
            ? "Payment recorded successfully!"
            : "Receipt recorded successfully!",
        );
        onSuccess(res.data.id, res.data.paymentNumber);
      } else {
        toast.error(res.error || "Failed to save transaction.");
      }
    });
  };

  const paymentMethodOptions = [
    { key: "CASH", label: "Cash" },
    { key: "BANK_TRANSFER", label: "Bank Transfer" },
    { key: "UPI", label: "UPI" },
    { key: "CHEQUE", label: "Cheque" },
  ];

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4 text-left"
    >
      {/* 1. Contact Selector */}
      {contactId ? (
        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-850">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            {isSupplier ? "Supplier" : "Customer"}
          </span>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-50 mt-0.5 block">
            {contacts.find((s) => s.id === contactId)?.name ||
              (isSupplier ? "Selected Supplier" : "Selected Customer")}
          </span>
        </div>
      ) : (
        <div>
          <ContactSelector
            contacts={contacts}
            selectedKey={selectedContactId}
            onSelectionChange={handleContactChange}
            label={isSupplier ? "Supplier" : "Customer"}
            placeholder={
              isSupplier
                ? "Search and choose supplier"
                : "Search and choose customer"
            }
            isInvalid={!!errors.contactId}
            errorMessage={
              errors.contactId?.message
                ? String(errors.contactId.message)
                : undefined
            }
          />
        </div>
      )}

      {/* 2. Account Summary Cards */}
      {loadingSummary ? (
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-850 animate-pulse flex flex-col gap-2">
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      ) : summary ? (
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {isSupplier ? "Total Purchases" : "Total Sales"}
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 block">
              ₹{summary.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              {isSupplier ? "Total Paid" : "Total Received"}
            </span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
              ₹{summary.totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Outstanding
            </span>
            <span className={`text-sm font-bold mt-1 block ${summary.outstandingBalance > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-700 dark:text-slate-300"}`}>
              ₹{summary.outstandingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      ) : null}

      {/* 3. Amount Field */}
      <Controller
        name="amount"
        control={control}
        render={({ field }) => (
          <CurrencyInput
            label={isSupplier ? "Payment Amount" : "Receipt Amount"}
            value={field.value ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              field.onChange(value === "" ? "" : Number(value));
            }}
            onBlur={field.onBlur}
            ref={field.ref}
            error={errors.amount}
          />
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Date Input */}
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-350">
            {isSupplier ? "Payment Date" : "Receipt Date"}
          </label>
          <input
            type="date"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-850 dark:bg-slate-950 dark:focus:border-slate-100 outline-none text-sm font-semibold text-slate-900 dark:text-white"
            {...register("paymentDate")}
          />
          {errors.paymentDate && (
            <span className="text-xs text-red-500 mt-1">
              {String(errors.paymentDate.message)}
            </span>
          )}
        </div>

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
      <div className="flex flex-col gap-1 w-full">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-350">
          Reference Number (UPI / Txn / Cheque)
        </label>
        <input
          type="text"
          placeholder="Enter reference number (optional)"
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-850 dark:bg-slate-950 dark:focus:border-slate-100 outline-none text-sm"
          {...register("referenceNumber")}
        />
        {errors.referenceNumber && (
          <span className="text-xs text-red-500 mt-1">
            {String(errors.referenceNumber.message)}
          </span>
        )}
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1 w-full">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-350">
          Internal Notes
        </label>
        <input
          type="text"
          placeholder="Enter private notes (optional)"
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-850 dark:bg-slate-950 dark:focus:border-slate-100 outline-none text-sm"
          {...register("notes")}
        />
        {errors.notes && (
          <span className="text-xs text-red-500 mt-1">
            {String(errors.notes.message)}
          </span>
        )}
      </div>

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
          {isPending
            ? "Recording..."
            : isSupplier
              ? "Record Payment"
              : "Record Receipt"}
        </Button>
      </div>
    </form>
  );
}
