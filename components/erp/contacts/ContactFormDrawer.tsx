"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema } from "@/features/master-data/contacts/validations";
import { upsertContact } from "@/features/master-data/contacts/actions";
import { PhoneInput } from "@/components/ui/form/PhoneInput";
import { GSTInput } from "@/components/ui/form/GSTInput";
import { CurrencyInput } from "@/components/ui/form/CurrencyInput";
import { Button } from "@heroui/react";
import { X } from "lucide-react";
import toast from "react-hot-toast";

interface ContactFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: any | null;
  defaultType?: "CUSTOMER" | "SUPPLIER";
  onSuccess: () => void;
}

export default function ContactFormDrawer({
  isOpen,
  onClose,
  contact = null,
  defaultType = "CUSTOMER",
  onSuccess,
}: ContactFormDrawerProps) {
  const [formPending, setFormPending] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      type: defaultType,
      contactPerson: "",
      phone: "",
      altPhone: "",
      email: "",
      gstNumber: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      openingBalance: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (contact) {
        setValue("name", contact.name || "");
        setValue("type", contact.type || defaultType);
        setValue("contactPerson", contact.contactPerson || "");
        setValue("phone", contact.phone || "");
        setValue("altPhone", contact.altPhone || "");
        setValue("email", contact.email || "");
        setValue("gstNumber", contact.gstNumber || "");
        setValue("address", contact.address || "");
        setValue("city", contact.city || "");
        setValue("state", contact.state || "");
        setValue("pincode", contact.pincode || "");
        setValue("openingBalance", contact.openingBalance ?? "");
        setValue("notes", contact.notes || "");
      } else {
        reset({
          name: "",
          type: defaultType,
          contactPerson: "",
          phone: "",
          altPhone: "",
          email: "",
          gstNumber: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          openingBalance: "",
          notes: "",
        });
      }
    }
  }, [isOpen, contact, defaultType, setValue, reset]);

  const renderError = (err: any) => {
    if (!err || !err.message) return null;
    return <span className="text-xs text-red-500 mt-0.5">{String(err.message)}</span>;
  };

  const onSave = async (values: any) => {
    try {
      setFormPending(true);
      const res = await upsertContact({
        id: contact?.id,
        ...values,
        openingBalance: Number(values.openingBalance || 0),
      });

      if (res.success) {
        toast.success(
          contact
            ? `${values.type === "SUPPLIER" ? "Supplier" : "Customer"} profile updated successfully`
            : `${values.type === "SUPPLIER" ? "Supplier" : "Customer"} created successfully`
        );
        onClose();
        reset();
        onSuccess();
      } else {
        toast.error(res.error || "Failed to save contact");
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred");
    } finally {
      setFormPending(false);
    }
  };

  const isSupplier = (contact?.type || defaultType) === "SUPPLIER";

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Drawer panel */}
      <div
        className={`relative w-full max-w-lg md:max-w-xl h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <form onSubmit={handleSubmit(onSave)} className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-50">
              {contact
                ? `Edit ${isSupplier ? "Supplier" : "Customer"} Profile`
                : `Register New ${isSupplier ? "Supplier" : "Customer"}`}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                  {isSupplier ? "Supplier Name *" : "Customer Name *"}
                </label>
                <input
                  type="text"
                  placeholder={isSupplier ? "e.g. ABC Industries" : "e.g. RSK Distributor"}
                  {...register("name")}
                  className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-950 ${
                    errors.name
                      ? "border-red-500 focus:border-red-600"
                      : "border-slate-200 focus:border-slate-900 dark:border-slate-800 dark:focus:border-slate-100"
                  }`}
                />
                {renderError(errors.name)}
              </div>

              <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                  Contact Type *
                </label>
                <select
                  {...register("type")}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950 dark:focus:border-slate-100 transition-all font-semibold"
                >
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="SUPPLIER">SUPPLIER</option>
                </select>
                {renderError(errors.type)}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                  Contact Person
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  {...register("contactPerson")}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 outline-none font-semibold transition-all"
                />
                {renderError(errors.contactPerson)}
              </div>

              <GSTInput
                label="GSTIN"
                placeholder="e.g. 33AAAAA1111A1Z1"
                error={errors.gstNumber}
                {...register("gstNumber")}
              />

              <PhoneInput
                label="Primary Phone"
                placeholder="e.g. 9876543210"
                error={errors.phone}
                {...register("phone")}
              />

              <PhoneInput
                label="Alternate Phone"
                placeholder="e.g. 9876543211"
                error={errors.altPhone}
                {...register("altPhone")}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. contact@business.com"
                  {...register("email")}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 outline-none font-semibold transition-all"
                />
                {renderError(errors.email)}
              </div>

              <CurrencyInput
                label="Opening Balance (₹)"
                placeholder="e.g. 0"
                error={errors.openingBalance}
                {...register("openingBalance")}
              />

              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                  Street Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Plot No 12, Industrial Estate"
                  {...register("address")}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 outline-none font-semibold transition-all"
                />
                {renderError(errors.address)}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-350">City</label>
                <input
                  type="text"
                  placeholder="e.g. Erode"
                  {...register("city")}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 outline-none font-semibold transition-all"
                />
                {renderError(errors.city)}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-350">State</label>
                <input
                  type="text"
                  placeholder="e.g. Tamil Nadu"
                  {...register("state")}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 outline-none font-semibold transition-all"
                />
                {renderError(errors.state)}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Pincode</label>
                <input
                  type="text"
                  placeholder="e.g. 638001"
                  {...register("pincode")}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 outline-none font-semibold transition-all"
                />
                {renderError(errors.pincode)}
              </div>

              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Notes</label>
                <input
                  type="text"
                  placeholder="Write comments..."
                  {...register("notes")}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 outline-none font-semibold transition-all"
                />
                {renderError(errors.notes)}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
            <Button variant="ghost" onPress={onClose} type="button" className="font-semibold">
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isPending={formPending}
              className="px-5 font-semibold bg-emerald-600 hover:bg-emerald-700 border-none text-white"
            >
              {contact ? "Save Changes" : `Register ${isSupplier ? "Supplier" : "Customer"}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
