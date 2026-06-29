"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import { Button } from "@heroui/react";
import { getManufacturingDashboardAction } from "@/features/shared/dashboard/actions";
import {
  Plus,
  Factory,
  Wrench,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Info
} from "lucide-react";
import toast from "react-hot-toast";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import Link from "next/link";

export default function ManufacturingDashboardPage() {
  const router = useRouter();
  const { setWorkspace } = useWorkspaceStore();

  const [metrics, setMetrics] = useState<any>({
    productionToday: 0,
    rawMaterialConsumption: 0,
    finishedGoodsProduced: 0,
    manufacturingCost: 0,
    productionExpenses: 0,
    currentRawMaterialStock: 0,
    currentFinishedGoodsStock: 0,
    totalRecipes: 0,
    activeRecipes: 0,
    finishedProductsCovered: 0,
    recentlyUpdatedRecipes: [],
  });

  // Ensure workspace store matches routing context and fetch metrics
  useEffect(() => {
    setWorkspace("manufacturing");

    async function loadMetrics() {
      const res = await getManufacturingDashboardAction();
      if (res.success && res.data) {
        setMetrics(res.data);
      }
    }
    loadMetrics();
  }, [setWorkspace]);

  const handleShortcutClick = (actionName: string) => {
    toast.success(`${actionName} module will be connected in subsequent phases!`);
  };

  const kpis = [
    { title: "Today's Production", value: `${metrics.productionToday} Cases`, subtitle: "Active completed batches output" },
    { title: "Today's Manufacturing Cost", value: `₹${metrics.manufacturingCost.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, subtitle: "Raw material + direct expenses" },
    { title: "Raw Material Consumption", value: `${metrics.rawMaterialConsumption} Tons`, subtitle: "Processed inputs today" },
    { title: "Finished Goods Produced", value: `${metrics.finishedGoodsProduced} Packs`, subtitle: "Completed packs output" },
    { title: "Today's Manufacturing Expenses", value: `₹${metrics.productionExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, subtitle: "Direct indirect/row costs" },
    { title: "Current Raw Material Stock", value: `${metrics.currentRawMaterialStock} Tons`, subtitle: "Warehouse stock level log" },
    { title: "Current Finished Goods Stock", value: `${metrics.currentFinishedGoodsStock} Cases`, subtitle: "Shippable storage levels" },
    { title: "Total BOM Recipes", value: `${metrics.totalRecipes} Recipes`, subtitle: "Logged structural recipes" },
    { title: "Active BOM Recipes", value: `${metrics.activeRecipes} Active`, subtitle: "Available for planning" },
    { title: "Finished Goods Covered", value: `${metrics.finishedProductsCovered} Products`, subtitle: "Unique finished goods covered" },
  ];

  const quickActions = [
    { label: "Start Production", icon: Factory, color: "bg-emerald-600 text-white", click: () => handleShortcutClick("Start Production Batch") },
    { label: "Add Factory Expense", icon: TrendingDown, color: "bg-emerald-600 text-white", click: () => handleShortcutClick("Factory Expense Logs") },
    { label: "Create BOM Recipe", icon: Layers, color: "bg-emerald-600 text-white", click: () => router.push("/manufacturing/bom?new=true") },
  ];

  const navigationShortcuts = [
    { label: "Bill of Materials", href: "/manufacturing/bom", desc: "Manage cup & tissue structural recipes", icon: Layers },
    { label: "Raw Materials", href: "/master-data/products?type=RAW_MATERIAL", desc: "Browse rolls, chemicals & packaging catalogs", icon: Sparkles },
    { label: "Finished Goods", href: "/master-data/products?type=FINISHED_GOOD", desc: "Browse finished cup & tissue stock catalogs", icon: Factory },
    { label: "Production Runs", href: "/manufacturing/batches", desc: "View logged raw material batch runs", icon: Wrench, click: () => handleShortcutClick("Production Batches") },
    { label: "Reports", href: "/manufacturing/reports", desc: "Yield analysis & factory cost reports", icon: Layers, click: () => handleShortcutClick("Manufacturing Reports") },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Manufacturing Dashboard"
        subtitle="Cups, tissues, and raw materials production floor"
        action={
          <Button
            variant="primary"
            onPress={() => handleShortcutClick("Start Production Run")}
            className="w-full sm:w-auto font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-none"
            size="md"
          >
            <Plus className="w-4.5 h-4.5 mr-1.5" />
            <span>Start Production</span>
          </Button>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card
            key={kpi.title}
            className="border-l-4 border-l-emerald-200 dark:border-l-emerald-900"
            title={kpi.title}
            subtitle={kpi.subtitle}
          >
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-805 dark:text-slate-105 block mt-1">
              {kpi.value}
            </span>
          </Card>
        ))}
      </div>

      {/* Quick Action Shortcuts Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Factory Floor Tasks" className="md:col-span-2" subtitle="Daily operations shortcuts for manufacturing runs">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant="tertiary"
                  className="h-20 flex flex-col items-center justify-center gap-1.5 rounded-2xl p-2 border border-slate-100 dark:border-slate-850"
                  onPress={action.click}
                >
                  <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate w-full text-center">
                    {action.label}
                  </span>
                </Button>
              );
            })}
          </div>
        </Card>

        {/* Recent BOM Recipes Card */}
        <Card title="Recent BOM Recipes" subtitle="Top 5 recently updated recipes">
          <div className="flex flex-col gap-2.5 mt-1.5 text-xs">
            {metrics.recentlyUpdatedRecipes && metrics.recentlyUpdatedRecipes.length > 0 ? (
              <div className="flex flex-col gap-2">
                {metrics.recentlyUpdatedRecipes.map((r: any) => (
                  <Link key={r.id} href={`/manufacturing/bom/${r.id}`}>
                    <div className="flex justify-between items-center p-2 rounded-xl border border-slate-100 hover:border-slate-300 dark:border-slate-850 dark:hover:border-slate-800 bg-white dark:bg-slate-900 transition-all cursor-pointer">
                      <div className="flex flex-col min-w-0 pl-1">
                        <span className="font-bold text-slate-905 dark:text-white truncate">{r.name}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">{r.finishedProductName} • {r.itemCount} items</span>
                      </div>
                      <span className="font-extrabold text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-lg">
                        {r.wasteFactorPercent.toFixed(1)}%
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 font-semibold">
                No BOM Recipes created yet.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Navigation Shortcuts */}
      <Card title="Navigation Shortcuts" subtitle="Fast links to factory sub-menus and databases">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {navigationShortcuts.map((shortcut) => {
            const Icon = shortcut.icon;
            const content = (
              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-300 dark:border-slate-850 dark:hover:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl text-slate-700 dark:text-slate-350">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-50">
                      {shortcut.label}
                    </span>
                    <span className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">
                      {shortcut.desc}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-450 group-hover:translate-x-1 transition-transform" />
              </div>
            );

            if (shortcut.click) {
              return (
                <div key={shortcut.label} onClick={shortcut.click}>
                  {content}
                </div>
              );
            }

            return (
              <Link key={shortcut.label} href={shortcut.href}>
                {content}
              </Link>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
