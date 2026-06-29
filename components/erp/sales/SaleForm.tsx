"use client";

import React, { useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Trash2,
  AlertCircle,
  ShoppingBag
} from "lucide-react";
import {
  Button,
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@heroui/react";

import ContactSelector from "@/components/ui/ContactSelector";
import ProductSelector from "@/components/ui/ProductSelector";
import { PriceInput } from "@/components/ui/form/PriceInput";
import { QuantityInput } from "@/components/ui/form/QuantityInput";
import { saleSchema, SaleFormValues } from "@/features/trading/sales/validations";

interface SaleFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any) => Promise<void>;
  customers: any[];
  products: any[];
  initialValues?: any;
  isPending: boolean;
  title?: string;
}

export const SaleForm: React.FC<SaleFormProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  customers,
  products,
  initialValues,
  isPending,
  title = "Create Sale Invoice",
}) => {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      customerId: "",
      saleDate: new Date().toISOString().split("T")[0],
      reference: "",
      notes: "",
      discount: 0,
      transportCharges: 0,
      status: "COMPLETED",
      items: [{ productId: "", quantity: 1, sellingRate: 0, discount: 0, remarks: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Prepopulate form if editing
  useEffect(() => {
    if (initialValues) {
      const formattedItems = initialValues.items?.map((item: any) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        sellingRate: Number(item.sellingRate),
        discount: Number(item.discount),
        remarks: item.remarks || "",
      })) || [];

      reset({
        customerId: initialValues.customerId,
        saleDate: new Date(initialValues.saleDate).toISOString().split("T")[0],
        reference: initialValues.reference || "",
        notes: initialValues.notes || "",
        discount: Number(initialValues.discount || 0),
        transportCharges: Number(initialValues.transportCharges || 0),
        status: initialValues.status || "COMPLETED",
        items: formattedItems.length > 0 ? formattedItems : [{ productId: "", quantity: 1, sellingRate: 0, discount: 0, remarks: "" }],
      });
    } else {
      reset({
        customerId: "",
        saleDate: new Date().toISOString().split("T")[0],
        reference: "",
        notes: "",
        discount: 0,
        transportCharges: 0,
        status: "COMPLETED",
        items: [{ productId: "", quantity: 1, sellingRate: 0, discount: 0, remarks: "" }],
      });
    }
  }, [initialValues, reset, isOpen]);

  const watchedItems = watch("items") || [];
  const watchedDiscount = watch("discount") || 0;
  const watchedTransport = watch("transportCharges") || 0;

  // Calculate subtotals
  const subtotal = watchedItems.reduce((acc: number, item: any) => {
    const qty = Number(item?.quantity) || 0;
    const rate = Number(item?.sellingRate) || 0;
    const disc = Number(item?.discount) || 0;
    return acc + Math.max(0, qty * rate - disc);
  }, 0);

  const grandTotal = Math.max(0, subtotal - Number(watchedDiscount) + Number(watchedTransport));

  const handleProductChange = (index: number, val: string) => {
    setValue(`items.${index}.productId` as any, val);
    const prod = products.find((p) => p.id === val);
    if (prod) {
      setValue(`items.${index}.sellingRate` as any, Number(prod.sellingPrice || 0));
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalBackdrop className="bg-slate-950/80 backdrop-blur-sm" />
      <ModalContainer>
        <ModalDialog className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh]">
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-lg">
                <ShoppingBag className="w-5 h-5 text-emerald-500" />
                <span>{title}</span>
              </span>
            </ModalHeader>

            <ModalBody className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              {/* Header Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
                <div className="md:col-span-2">
                  <Controller
                    name="customerId"
                    control={control}
                    render={({ field }) => (
                      <ContactSelector
                        contacts={customers}
                        selectedKey={field.value || ""}
                        onSelectionChange={field.onChange}
                        isInvalid={!!errors.customerId}
                        errorMessage={errors.customerId?.message as string}
                        label="Customer *"
                        placeholder="Select customer profile"
                      />
                    )}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Sale Date *
                  </label>
                  <input
                    type="date"
                    {...register("saleDate")}
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-slate-100 font-semibold"
                  />
                  {errors.saleDate && (
                    <span className="text-xs text-red-500 mt-0.5">{errors.saleDate.message as string}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Reference / PO No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PO-8902"
                    {...register("reference")}
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Status
                  </label>
                  <select
                    {...register("status")}
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white font-semibold"
                  >
                    <option value="COMPLETED">COMPLETED (Deduct Stock)</option>
                    <option value="DRAFT">DRAFT (Estimate)</option>
                  </select>
                </div>
              </div>

              {/* Items Section */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                <div className="flex justify-between items-center mb-3.5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Sale Items / Products
                  </h3>
                  <Button
                    variant="ghost"
                    className="h-8 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300"
                    onPress={() => append({ productId: "", quantity: 1, sellingRate: 0, discount: 0, remarks: "" })}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Line
                  </Button>
                </div>

                {fields.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <AlertCircle className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs text-slate-400 font-bold">
                      No items added yet. Click "Add Line" to begin.
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {fields.map((field, index) => {
                      const itemValues = watchedItems[index] || {};
                      const qty = Number(itemValues.quantity) || 0;
                      const rate = Number(itemValues.sellingRate) || 0;
                      const disc = Number(itemValues.discount) || 0;
                      const lineTotalVal = Math.max(0, qty * rate - disc);

                      return (
                        <div
                          key={field.id}
                          className="relative flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            <div className="md:col-span-8">
                              <ProductSelector
                                products={products}
                                selectedKey={itemValues.productId || ""}
                                onSelectionChange={(val) => handleProductChange(index, val)}
                                label={`Product #${index + 1} *`}
                                placeholder="Select manufactured product or trading item"
                              />
                            </div>
                            <div className="md:col-span-4 flex justify-end">
                              <Button
                                variant="ghost"
                                className="p-2 border-rose-200 text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl"
                                size="sm"
                                isDisabled={fields.length === 1}
                                onPress={() => remove(index)}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <QuantityInput
                              label="Quantity *"
                              placeholder="e.g. 100"
                              error={(errors.items as any)?.[index]?.quantity}
                              {...register(`items.${index}.quantity` as any, { valueAsNumber: true })}
                            />

                            <PriceInput
                              label="Selling Rate (₹) *"
                              placeholder="e.g. 5.50"
                              error={(errors.items as any)?.[index]?.sellingRate}
                              {...register(`items.${index}.sellingRate` as any, { valueAsNumber: true })}
                            />

                            <PriceInput
                              label="Line Discount (₹)"
                              placeholder="e.g. 0.00"
                              error={(errors.items as any)?.[index]?.discount}
                              {...register(`items.${index}.discount` as any, { valueAsNumber: true })}
                            />

                            <div className="flex flex-col justify-end items-end p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl h-10">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Line Total
                              </span>
                              <span className="text-sm font-black text-slate-900 dark:text-white">
                                ₹{lineTotalVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Remarks (Optional)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Special instructions, dimensions..."
                              {...register(`items.${index}.remarks` as any)}
                              className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs outline-none focus:border-slate-900 dark:border-slate-850 dark:bg-slate-950 dark:text-white font-medium"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Summary and notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Remarks / Terms
                  </label>
                  <textarea
                    placeholder="Log terms, delivery notes, remarks..."
                    rows={3}
                    {...register("notes")}
                    className="flex w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center text-sm font-semibold text-slate-600 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span className="text-slate-900 dark:text-white">
                      ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <PriceInput
                      label="Header Discount"
                      placeholder="0.00"
                      {...register("discount", { valueAsNumber: true })}
                    />

                    <PriceInput
                      label="Transport Charges"
                      placeholder="0.00"
                      {...register("transportCharges", { valueAsNumber: true })}
                    />
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800 pt-3 mt-1">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      Grand Total
                    </span>
                    <span className="text-lg font-black text-emerald-500">
                      ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </ModalBody>

            <ModalFooter className="px-6 pb-6 pt-4 border-t border-slate-100 dark:border-slate-800 gap-3">
              <Button variant="ghost" onPress={handleClose} type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit" isPending={isPending} className="px-5 font-semibold bg-emerald-600 hover:bg-emerald-700 border-none text-white">
                Save Invoice
              </Button>
            </ModalFooter>
          </form>
        </ModalDialog>
      </ModalContainer>
    </Modal>
  );
};
