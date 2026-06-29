"use client";

import React, { useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, AlertCircle, Layers } from "lucide-react";
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

import ProductSelector from "@/components/ui/ProductSelector";
import { QuantityInput } from "@/components/ui/form/QuantityInput";
import { bomRecipeSchema, BOMRecipeFormValues } from "@/features/manufacturing/bom/validations";

interface BomFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any) => Promise<void>;
  finishedGoods: any[];
  rawMaterials: any[];
  initialValues?: any;
  isPending: boolean;
  title?: string;
}

export const BomForm: React.FC<BomFormProps> = ({
  isOpen,
  onOpenChange,
  onSubmit,
  finishedGoods,
  rawMaterials,
  initialValues,
  isPending,
  title = "Create BOM Recipe",
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
    resolver: zodResolver(bomRecipeSchema),
    defaultValues: {
      name: "",
      finishedProductId: "",
      wasteFactorPercent: 0,
      items: [{ materialId: "", quantity: 1 }],
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
        materialId: item.materialId,
        quantity: Number(item.quantity),
      })) || [];

      reset({
        name: initialValues.name,
        finishedProductId: initialValues.finishedProductId,
        wasteFactorPercent: Number(initialValues.wasteFactorPercent || 0),
        items: formattedItems.length > 0 ? formattedItems : [{ materialId: "", quantity: 1 }],
      });
    } else {
      reset({
        name: "",
        finishedProductId: "",
        wasteFactorPercent: 0,
        items: [{ materialId: "", quantity: 1 }],
      });
    }
  }, [initialValues, reset, isOpen]);

  const watchedItems = watch("items") || [];

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const onFormSubmit = async (data: any) => {
    // Merge duplicates if any exist
    const mergedMap = new Map<string, number>();
    for (const item of data.items) {
      if (!item.materialId) continue;
      const existing = mergedMap.get(item.materialId) || 0;
      mergedMap.set(item.materialId, existing + item.quantity);
    }

    const mergedItems = Array.from(mergedMap.entries()).map(([materialId, quantity]) => ({
      materialId,
      quantity,
    }));

    await onSubmit({
      ...data,
      items: mergedItems,
    });
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalBackdrop className="bg-slate-950/80 backdrop-blur-sm" />
      <ModalContainer>
        <ModalDialog className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh]">
          <form onSubmit={handleSubmit(onFormSubmit)}>
            <ModalHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-lg">
                <Layers className="w-5 h-5 text-emerald-500" />
                <span>{title}</span>
              </span>
            </ModalHeader>

            <ModalBody className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              {/* Header Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Recipe Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 150ml Paper Cup Recipe"
                    {...register("name")}
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-slate-100 font-semibold"
                  />
                  {errors.name && (
                    <span className="text-xs text-red-500 mt-0.5">{errors.name.message as string}</span>
                  )}
                </div>

                <div className="flex flex-col">
                  <Controller
                    name="finishedProductId"
                    control={control}
                    render={({ field }) => (
                      <ProductSelector
                        products={finishedGoods}
                        selectedKey={field.value || ""}
                        onSelectionChange={field.onChange}
                        isInvalid={!!errors.finishedProductId}
                        errorMessage={errors.finishedProductId?.message as string}
                        label="Finished Output Product *"
                        placeholder="Choose finished good"
                      />
                    )}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-355">
                    Waste / Loss Allowance (%) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 2.5"
                    {...register("wasteFactorPercent", { valueAsNumber: true })}
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-slate-100 font-semibold"
                  />
                  {errors.wasteFactorPercent && (
                    <span className="text-xs text-red-500 mt-0.5">{errors.wasteFactorPercent.message as string}</span>
                  )}
                </div>
              </div>

              {/* Items Section */}
              <div className="mt-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    Constituent Raw Materials
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    onPress={() => append({ materialId: "", quantity: 1 })}
                    className="h-8 rounded-xl font-bold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Material</span>
                  </Button>
                </div>

                {errors.items && typeof errors.items.message === "string" && (
                  <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/40 text-xs font-bold">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errors.items.message}</span>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {fields.map((item, index) => {
                    const itemsErrors = errors.items as any;
                    const materialIdError = itemsErrors?.[index]?.materialId;
                    const quantityError = itemsErrors?.[index]?.quantity;

                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-50/50 dark:bg-slate-950/20 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-850"
                      >
                        <div className="md:col-span-8">
                          <Controller
                            name={`items.${index}.materialId`}
                            control={control}
                            render={({ field }) => (
                              <ProductSelector
                                products={rawMaterials}
                                selectedKey={field.value || ""}
                                onSelectionChange={field.onChange}
                                isInvalid={!!materialIdError}
                                errorMessage={materialIdError?.message as string}
                                label={`Raw Material #${index + 1}`}
                                placeholder="Choose material ingredient"
                              />
                            )}
                          />
                        </div>

                        <div className="md:col-span-3">
                          <Controller
                            name={`items.${index}.quantity`}
                            control={control}
                            render={({ field }) => (
                              <QuantityInput
                                value={field.value}
                                onChange={field.onChange}
                                label="Input Quantity"
                                error={quantityError}
                                min={0.0001}
                              />
                            )}
                          />
                        </div>

                        <div className="md:col-span-1 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            onPress={() => remove(index)}
                            isDisabled={fields.length <= 1}
                            className="h-10 w-10 min-w-10 rounded-xl p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center justify-center border-none shadow-none"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ModalBody>

            <ModalFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3.5">
              <Button
                type="button"
                variant="ghost"
                onPress={handleClose}
                isDisabled={isPending}
                className="font-bold border-none shadow-none rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isPending={isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 rounded-xl border-none shadow-none"
              >
                Save Recipe
              </Button>
            </ModalFooter>
          </form>
        </ModalDialog>
      </ModalContainer>
    </Modal>
  );
};
