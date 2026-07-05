"use client";

import React, { useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, AlertCircle, ShoppingBag, X } from "lucide-react";
import {
  Button,
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";

import ContactSelector from "@/components/ui/ContactSelector";
import ProductSelector from "@/components/ui/ProductSelector";
import { PriceInput } from "@/components/ui/form/PriceInput";
import { QuantityInput } from "@/components/ui/form/QuantityInput";
import {
  saleSchema,
  SaleFormValues,
} from "@/features/trading/sales/validations";

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
      initialAmountPaid: 0,
      status: "COMPLETED",
      items: [
        {
          productId: "",
          quantity: 1,
          sellingRate: 0,
          discount: 0,
          remarks: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Prepopulate form if editing
  useEffect(() => {
    if (initialValues) {
      const formattedItems =
        initialValues.items?.map((item: any) => ({
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
        initialAmountPaid: 0,
        status: initialValues.status || "COMPLETED",
        items:
          formattedItems.length > 0
            ? formattedItems
            : [
                {
                  productId: "",
                  quantity: 1,
                  sellingRate: 0,
                  discount: 0,
                  remarks: "",
                },
              ],
      });
    } else {
      reset({
        customerId: "",
        saleDate: new Date().toISOString().split("T")[0],
        reference: "",
        notes: "",
        discount: 0,
        transportCharges: 0,
        initialAmountPaid: 0,
        status: "COMPLETED",
        items: [
          {
            productId: "",
            quantity: 1,
            sellingRate: 0,
            discount: 0,
            remarks: "",
          },
        ],
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

  const grandTotal = Math.max(
    0,
    subtotal - Number(watchedDiscount) + Number(watchedTransport),
  );

  const handleProductChange = (index: number, val: string) => {
    setValue(`items.${index}.productId` as any, val);
    if (val.startsWith("NEW_OPTION:")) {
      setValue(`items.${index}.sellingRate` as any, 0);
      return;
    }
    const prod = products.find((p) => p.id === val);
    if (prod) {
      setValue(
        `items.${index}.sellingRate` as any,
        Number(prod.sellingPrice || 0),
      );
    }
  };

  const onFormSubmit = async (values: any) => {
    if (values.status === "COMPLETED") {
      for (let i = 0; i < values.items.length; i++) {
        const item = values.items[i];
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          const availableBoxes = Number(prod.currentStock) || 0;
          const requestedBoxes = Number(item.quantity) || 0;
          if (requestedBoxes > availableBoxes) {
            toast.error(
              `Insufficient stock for "${prod.name}". Available: ${availableBoxes.toLocaleString()} Boxes, Requested: ${requestedBoxes.toLocaleString()} Boxes`,
            );
            return;
          }
        }
      }
    }
    await onSubmit(values);
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
        isOpen
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0"
      }`}
    >
      {/* Backdrop overlay */}
      <div
        onClick={handleClose}
        className={`absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Drawer container */}
      <div
        className={`relative w-full max-w-4xl h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <form
          onSubmit={handleSubmit(onFormSubmit)}
          className="h-full flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-lg">
              <ShoppingBag className="w-5 h-5 text-emerald-500" />
              <span>{title}</span>
            </span>
            <button
              type="button"
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
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
                      isCreatable={true}
                    />
                  )}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-355">
                  Sale Date *
                </label>
                <input
                  type="date"
                  {...register("saleDate")}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-slate-955 dark:text-white dark:focus:border-slate-100 font-semibold"
                />
                {errors.saleDate && (
                  <span className="text-xs text-red-500 mt-0.5">
                    {errors.saleDate.message as string}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-355">
                  Reference / PO No
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO-8902"
                  {...register("reference")}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-slate-909 dark:border-slate-800 dark:bg-slate-955 dark:text-white font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-355">
                  Status
                </label>
                <select
                  {...register("status")}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-slate-909 dark:border-slate-800 dark:bg-slate-955 dark:text-white font-semibold"
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
                  onPress={() =>
                    append({
                      productId: "",
                      quantity: 1,
                      sellingRate: 0,
                      discount: 0,
                      remarks: "",
                    })
                  }
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
                        className="relative flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-955 border border-slate-150 dark:border-slate-850 rounded-2xl"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                          <div className="md:col-span-8">
                            <ProductSelector
                              products={products}
                              selectedKey={itemValues.productId || ""}
                              onSelectionChange={(val) =>
                                handleProductChange(index, val)
                              }
                              label={`Product #${index + 1} *`}
                              placeholder="Select manufactured product or trading item"
                              isCreatable={true}
                            />
                            {(() => {
                              const selectedProd = products.find(
                                (p) => p.id === itemValues.productId,
                              );
                              if (!selectedProd) return null;
                              const availableBxs = Number(
                                selectedProd.currentStock,
                              );
                              const pcsPerBx =
                                selectedProd.piecesPerBox || 1000;
                              const availablePcs = availableBxs * pcsPerBx;
                              return (
                                <div className="mt-1.5 flex gap-4 text-xs font-bold text-slate-500">
                                  <span>
                                    Available Stock:{" "}
                                    <span className="text-slate-900 dark:text-slate-100 font-extrabold">
                                      {availableBxs.toLocaleString()} Boxes
                                    </span>
                                  </span>
                                  <span>•</span>
                                  <span>
                                    <span className="text-emerald-605 dark:text-emerald-400 font-extrabold">
                                      {availablePcs.toLocaleString()} Pieces
                                    </span>
                                  </span>
                                </div>
                              );
                            })()}
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
                            {...register(`items.${index}.quantity` as any, {
                              valueAsNumber: true,
                            })}
                          />

                          <PriceInput
                            label="Selling Rate (₹) *"
                            placeholder="e.g. 5.50"
                            error={(errors.items as any)?.[index]?.sellingRate}
                            {...register(`items.${index}.sellingRate` as any, {
                              valueAsNumber: true,
                            })}
                          />

                          <PriceInput
                            label="Line Discount (₹)"
                            placeholder="e.g. 0.00"
                            error={(errors.items as any)?.[index]?.discount}
                            {...register(`items.${index}.discount` as any, {
                              valueAsNumber: true,
                            })}
                          />

                          <div className="flex flex-col justify-end items-end p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl h-10">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Line Total
                            </span>
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                              ₹
                              {lineTotalVal.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Quantity helper: Boxes × Pockets × Pieces per Pocket */}
                        <details className="group">
                          <summary className="text-[10px] font-bold text-blue-600 cursor-pointer select-none list-none flex items-center gap-1 mt-1">
                            <span className="group-open:rotate-90 transition-transform inline-block">
                              &#9654;
                            </span>
                            Calculate quantity from boxes/pockets (optional)
                          </summary>
                          <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900">
                            <p className="text-[10px] text-blue-600 mb-2 font-medium">
                              Fill boxes, pockets and pieces per pocket —
                              quantity will be calculated automatically. Or
                              enter a direct total amount instead.
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-600">
                                  Boxes
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-blue-500"
                                  onChange={(e) => {
                                    const boxes = Number(e.target.value) || 0;
                                    const pockets =
                                      Number(
                                        (
                                          document.getElementById(
                                            `s-pockets-${index}`,
                                          ) as HTMLInputElement
                                        )?.value,
                                      ) || 0;
                                    const ppp =
                                      Number(
                                        (
                                          document.getElementById(
                                            `s-ppp-${index}`,
                                          ) as HTMLInputElement
                                        )?.value,
                                      ) || 0;
                                    const total = boxes * pockets * ppp;
                                    const selectedProd = products.find((p) => p.id === itemValues.productId);
                                    const pcsPerBox = selectedProd?.piecesPerBox || 1000;
                                    const boxQty = total / pcsPerBox;
                                    if (boxQty > 0)
                                      setValue(
                                        `items.${index}.quantity` as any,
                                        boxQty,
                                      );
                                  }}
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-600">
                                  Pockets/Box
                                </label>
                                <input
                                  id={`s-pockets-${index}`}
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-blue-500"
                                  onChange={(e) => {
                                    const pockets = Number(e.target.value) || 0;
                                    const boxes =
                                      Number(
                                        (
                                          e.target
                                            .closest(".grid")
                                            ?.children[0]?.querySelector(
                                              "input",
                                            ) as HTMLInputElement
                                        )?.value,
                                      ) || 0;
                                    const ppp =
                                      Number(
                                        (
                                          document.getElementById(
                                            `s-ppp-${index}`,
                                          ) as HTMLInputElement
                                        )?.value,
                                      ) || 0;
                                    const total = boxes * pockets * ppp;
                                    const selectedProd = products.find((p) => p.id === itemValues.productId);
                                    const pcsPerBox = selectedProd?.piecesPerBox || 1000;
                                    const boxQty = total / pcsPerBox;
                                    if (boxQty > 0)
                                      setValue(
                                        `items.${index}.quantity` as any,
                                        boxQty,
                                      );
                                  }}
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-600">
                                  Pcs/Pocket
                                </label>
                                <input
                                  id={`s-ppp-${index}`}
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-blue-500"
                                  onChange={(e) => {
                                    const ppp = Number(e.target.value) || 0;
                                    const pockets =
                                      Number(
                                        (
                                          document.getElementById(
                                            `s-pockets-${index}`,
                                          ) as HTMLInputElement
                                        )?.value,
                                      ) || 0;
                                    const boxes =
                                      Number(
                                        (
                                          e.target
                                            .closest(".grid")
                                            ?.children[0]?.querySelector(
                                              "input",
                                            ) as HTMLInputElement
                                        )?.value,
                                      ) || 0;
                                    const total = boxes * pockets * ppp;
                                    const selectedProd = products.find((p) => p.id === itemValues.productId);
                                    const pcsPerBox = selectedProd?.piecesPerBox || 1000;
                                    const boxQty = total / pcsPerBox;
                                    if (boxQty > 0)
                                      setValue(
                                        `items.${index}.quantity` as any,
                                        boxQty,
                                      );
                                  }}
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-slate-600">
                                  Direct Total (₹)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="Quick total"
                                  className="h-8 w-full rounded-lg border border-blue-200 bg-blue-50 px-2 text-xs outline-none focus:border-blue-600 text-blue-800 font-semibold"
                                  onChange={(e) => {
                                    const total = Number(e.target.value);
                                    if (total > 0) {
                                      const qty =
                                        Number(
                                          watch(
                                            `items.${index}.quantity` as any,
                                          ),
                                        ) || 1;
                                      setValue(
                                        `items.${index}.sellingRate` as any,
                                        parseFloat((total / qty).toFixed(4)),
                                      );
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </details>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-bold text-slate-700 dark:text-slate-355 uppercase tracking-wider">
                            Line Remarks / Specification
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Special print request, notes..."
                            {...register(`items.${index}.remarks` as any)}
                            className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs outline-none focus:border-slate-909 dark:border-slate-800 dark:bg-slate-955 dark:text-white font-medium"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Calculations & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-355">
                  Sale Remarks / Internal Notes
                </label>
                <textarea
                  placeholder="e.g. Delivery terms, payment deadline note..."
                  rows={3}
                  {...register("notes")}
                  className="flex w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-909 dark:border-slate-800 dark:bg-slate-955 dark:text-white font-semibold"
                />
              </div>

              <div className="flex flex-col gap-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <span>Subtotal</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    ₹
                    {subtotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
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
                    ₹
                    {grandTotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {/* Initial Payment */}
                {!initialValues && (
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
                    <PriceInput
                      label="Initial Amount Paid (Optional)"
                      placeholder="0.00"
                      {...register("initialAmountPaid", { valueAsNumber: true })}
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      If the customer paid a portion upfront, enter it here. A payment receipt will be auto-created.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50 shrink-0">
            <Button variant="ghost" onPress={handleClose} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isPending={isPending}
              className="px-5 font-semibold bg-emerald-600 hover:bg-emerald-700 border-none text-white"
            >
              Save Invoice
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
