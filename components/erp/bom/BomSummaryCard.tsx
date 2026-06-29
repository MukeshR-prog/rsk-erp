import React from "react";
import Card from "@/components/ui/Card";
import { Layers, Percent, Box } from "lucide-react";

interface BomSummaryCardProps {
  finishedProductName: string;
  finishedProductCode: string;
  finishedProductUnit?: string;
  totalMaterials: number;
  wasteFactorPercent: number;
}

export default function BomSummaryCard({
  finishedProductName,
  finishedProductCode,
  finishedProductUnit = "PCS",
  totalMaterials,
  wasteFactorPercent,
}: BomSummaryCardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Finished Product Detail Card */}
      <Card title="Target Output" subtitle="Finished product linked to recipe">
        <div className="flex items-center gap-3 mt-2">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 rounded-2xl">
            <Box className="w-6 h-6" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-extrabold text-slate-900 dark:text-slate-50 truncate">
              {finishedProductName}
            </span>
            <span className="text-xs font-semibold text-slate-450 dark:text-slate-500 mt-0.5">
              Code: {finishedProductCode} • Base Unit: {finishedProductUnit}
            </span>
          </div>
        </div>
      </Card>

      {/* Total Materials Card */}
      <Card title="Raw Inputs" subtitle="Count of constituent raw materials">
        <div className="flex items-center gap-3 mt-2">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 rounded-2xl">
            <Layers className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              {totalMaterials} Items
            </span>
            <span className="text-xs font-semibold text-slate-450 dark:text-slate-500 mt-0.5">
              Unique ingredients
            </span>
          </div>
        </div>
      </Card>

      {/* Waste Factor Card */}
      <Card title="Loss Allowance" subtitle="Waste/shrinkage margin allocation">
        <div className="flex items-center gap-3 mt-2">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 rounded-2xl">
            <Percent className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              {wasteFactorPercent.toFixed(2)}%
            </span>
            <span className="text-xs font-semibold text-slate-450 dark:text-slate-500 mt-0.5">
              Estimated shrinkage
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
