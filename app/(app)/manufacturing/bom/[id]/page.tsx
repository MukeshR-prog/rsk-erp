"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit3, Trash2, CheckCircle2, AlertTriangle, Layers, Calendar, Clock } from "lucide-react";
import { Button } from "@heroui/react";
import Link from "next/link";
import toast from "react-hot-toast";

import Header from "@/components/ui/Header";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import BomStatusBadge from "@/components/erp/bom/BomStatusBadge";
import BomSummaryCard from "@/components/erp/bom/BomSummaryCard";
import BomItemsTable from "@/components/erp/bom/BomItemsTable";
import { BomForm } from "@/components/erp/bom/BomForm";

import {
  getRecipe,
  updateRecipeAction,
  disableRecipeAction,
  enableRecipeAction,
  getFinishedGoodsList,
  getRawMaterialsList,
} from "@/features/manufacturing/bom/actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BOMDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  // States
  const [recipe, setRecipe] = useState<any>(null);
  const [finishedGoods, setFinishedGoods] = useState<any[]>([]);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitPending, setIsSubmitPending] = useState(false);

  // Dialog State
  const [disableOpen, setDisableOpen] = useState(false);
  const [disablePending, setDisablePending] = useState(false);
  const [enableOpen, setEnableOpen] = useState(false);
  const [enablePending, setEnablePending] = useState(false);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const [rRes, fgRes, rmRes] = await Promise.all([
        getRecipe(id),
        getFinishedGoodsList(),
        getRawMaterialsList(),
      ]);

      if (rRes.success && rRes.data) {
        setRecipe(rRes.data);
      } else {
        toast.error(rRes.error || "Failed to load recipe details.");
        router.push("/manufacturing/bom");
      }

      if (fgRes.success && fgRes.data) {
        setFinishedGoods(fgRes.data);
      }
      if (rmRes.success && rmRes.data) {
        setRawMaterials(rmRes.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading recipe details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  const handleEditSubmit = async (values: any) => {
    setIsSubmitPending(true);
    try {
      const res = await updateRecipeAction(id, values);
      if (res.success) {
        toast.success(`BOM Recipe "${values.name}" updated successfully!`);
        setIsEditOpen(false);
        loadDetails();
      } else {
        toast.error(res.error || "Failed to update BOM recipe.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during updating.");
    } finally {
      setIsSubmitPending(false);
    }
  };

  const handleDisableConfirm = async () => {
    setDisablePending(true);
    try {
      const res = await disableRecipeAction(id);
      if (res.success) {
        toast.success("BOM Recipe disabled successfully.");
        setDisableOpen(false);
        loadDetails();
      } else {
        toast.error(res.error || "Failed to disable recipe.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred.");
    } finally {
      setDisablePending(false);
    }
  };

  const handleEnableConfirm = async () => {
    setEnablePending(true);
    try {
      const res = await enableRecipeAction(id);
      if (res.success) {
        toast.success("BOM Recipe activated successfully.");
        setEnableOpen(false);
        loadDetails();
      } else {
        toast.error(res.error || "Failed to activate recipe.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred.");
    } finally {
      setEnablePending(false);
    }
  };

  if (loading || !recipe) {
    return (
      <div className="text-center py-20 text-slate-500 font-semibold">
        Loading Recipe Details...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back Button Action Bar */}
      <div>
        <Link href="/manufacturing/bom" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors bg-white dark:bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-100 dark:border-slate-850">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Registry</span>
        </Link>
      </div>

      {/* Detail Header */}
      <Header
        title={recipe.name}
        subtitle="Structural specifications sheet for raw ingredient proportions"
        action={
          <div className="flex gap-2 w-full sm:w-auto">
            {recipe.isActive ? (
              <Button
                variant="outline"
                onPress={() => setDisableOpen(true)}
                className="w-full sm:w-auto font-bold border-red-200 dark:border-red-950/40 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl"
                size="md"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                <span>Disable Recipe</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                onPress={() => setEnableOpen(true)}
                className="w-full sm:w-auto font-bold border-emerald-200 dark:border-emerald-950/40 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-xl"
                size="md"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                <span>Activate Recipe</span>
              </Button>
            )}

            <Button
              variant="primary"
              onPress={() => setIsEditOpen(true)}
              className="w-full sm:w-auto font-bold bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-none rounded-xl"
              size="md"
            >
              <Edit3 className="w-4 h-4 mr-1.5" />
              <span>Edit Recipe</span>
            </Button>
          </div>
        }
      />

      {/* KPI summaries cards */}
      <BomSummaryCard
        finishedProductName={recipe.finishedProductName}
        finishedProductCode={recipe.finishedProductCode}
        finishedProductUnit={recipe.finishedProductUnit}
        totalMaterials={recipe.items.length}
        wasteFactorPercent={recipe.wasteFactorPercent}
      />

      {/* Specifications Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingredient Table */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-6 rounded-2xl">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">
              Raw Ingredients Specification
            </h3>
            <BomItemsTable items={recipe.items} />
          </div>
        </div>

        {/* Audit Meta Logs */}
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-6 rounded-2xl flex flex-col gap-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-850">
              Recipe Metadata
            </h3>

            <div className="flex flex-col gap-4 mt-2">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-slate-450">Active Status</span>
                <BomStatusBadge isActive={recipe.isActive} />
              </div>

              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-slate-450 flex items-center gap-1.5">
                  <Calendar className="w-4.5 h-4.5 text-slate-400" />
                  <span>Created At</span>
                </span>
                <span className="text-slate-750 dark:text-slate-350">
                  {new Date(recipe.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-slate-450 flex items-center gap-1.5">
                  <Clock className="w-4.5 h-4.5 text-slate-400" />
                  <span>Last Updated</span>
                </span>
                <span className="text-slate-750 dark:text-slate-350">
                  {new Date(recipe.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editing Dialog Modal Drawer */}
      {isEditOpen && (
        <BomForm
          isOpen={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSubmit={handleEditSubmit}
          finishedGoods={finishedGoods}
          rawMaterials={rawMaterials}
          initialValues={recipe}
          isPending={isSubmitPending}
          title="Edit BOM Recipe"
        />
      )}

      {/* Disabling Dialog Modal */}
      {disableOpen && (
        <ConfirmDialog
          isOpen={disableOpen}
          onClose={() => setDisableOpen(false)}
          onConfirm={handleDisableConfirm}
          title="Disable BOM Recipe"
          message={`Are you sure you want to disable the recipe "${recipe.name}"? Disabled recipes cannot be selected for new production batches.`}
          confirmText="Yes, Disable"
          cancelText="Keep Active"
          isLoading={disablePending}
          isDanger={true}
        />
      )}

      {/* Enabling Dialog Modal */}
      {enableOpen && (
        <ConfirmDialog
          isOpen={enableOpen}
          onClose={() => setEnableOpen(false)}
          onConfirm={handleEnableConfirm}
          title="Activate BOM Recipe"
          message={`Are you sure you want to activate the recipe "${recipe.name}"? This recipe will become available again for production planning.`}
          confirmText="Yes, Activate"
          cancelText="Cancel"
          isLoading={enablePending}
          isDanger={false}
        />
      )}
    </div>
  );
}
