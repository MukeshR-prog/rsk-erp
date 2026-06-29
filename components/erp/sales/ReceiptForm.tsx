"use client";

import React, { useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createReceiptSchema, CreateReceiptFormValues } from "@/features/trading/payments/validations";
import { createCustomerReceiptAction } from "@/features/trading/payments/actions";
import { PriceInput } from "@/components/ui/form/PriceInput";
import DropdownSelector, { DropdownOption } from "@/components/ui/DropdownSelector";
import toast from "react-hot-toast";

interface ReceiptFormProps {
  saleId: string;
  contactId: string;
  prefilledBalance: number;
  onSuccess: (paymentId: string, paymentNumber: string) => void;
  onCancel: () => void;
}

const methodOptions: DropdownOption[] = [
  { id: "CASH", name: "Cash" },
  { id: "BANK_TRANSFER", name: "Bank Transfer" },
  { id: "UPI", name: "UPI / QR Code" },
  { id: "CHEQUE", name: "Cheque" },
];

export default function ReceiptForm({
  saleId,
  contactId,
  prefilledBalance,
  onSuccess,
  onCancel,
}: ReceiptFormProps) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateReceiptFormValues>({
    resolver: zodResolver(createReceiptSchema),
    defaultValues: {
      contactId,
      saleId,
      amount: prefilledBalance,
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "CASH",
      referenceNumber: "",
      notes: "",
    },
  });

  const onSubmitForm = (values: CreateReceiptFormValues) => {
    startTransition(async () => {
      try {
        const res = await createCustomerReceiptAction(values);
        if (res.success && res.data) {
          toast.success(`Receipt recorded: ${res.data.paymentNumber}`);
          onSuccess(res.data.id, res.data.paymentNumber);
        } else {
          toast.error(res.error || "Failed to record customer receipt.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Internal transaction error recording receipt.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Prefilled Remaining Due */}
        <div className="flex flex-col p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Remaining Invoice Due
          </span>
          <span className="text-base font-black text-slate-900 dark:text-white mt-1">
            ₹{prefilledBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
            Receipt Date *
          </label>
          <input
            type="date"
            {...register("paymentDate")}
            className="flex h-10 w-full rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white font-semibold"
          />
          {errors.paymentDate && (
            <span className="text-xs text-red-500 mt-0.5">{errors.paymentDate.message}</span>
          )}
        </div>

        {/* Amount */}
        <PriceInput
          label="Receipt Amount (₹) *"
          placeholder="e.g. 5000.00"
          error={errors.amount}
          {...register("amount", { valueAsNumber: true })}
        />

        {/* Method */}
        <div className="flex flex-col gap-1.5">
          <Controller
            name="paymentMethod"
            control={control}
            render={({ field }) => (
              <DropdownSelector
                options={methodOptions}
                selectedId={field.value}
                onChange={field.onChange}
                label="Payment Method *"
                placeholder="Select payment method"
              />
            )}
          />
        </div>
      </div>

      {/* Reference number */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
          Reference / Transaction ID
        </label>
        <input
          type="text"
          placeholder="e.g. UPI-TXN-9023, CHQ-1092"
          {...register("referenceNumber")}
          className="flex h-10 w-full rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white font-semibold"
        />
        {errors.referenceNumber && (
          <span className="text-xs text-red-500 mt-0.5">{errors.referenceNumber.message}</span>
        )}
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
          Notes / Remarks
        </label>
        <textarea
          placeholder="Enter payment reference details..."
          rows={3}
          {...register("notes")}
          className="flex w-full rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white font-semibold"
        />
        {errors.notes && (
          <span className="text-xs text-red-500 mt-0.5">{errors.notes.message}</span>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-850 mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-transparent rounded-lg"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
        >
          {isPending ? "Recording..." : "Record Receipt"}
        </button>
      </div>
    </form>
  );
}
