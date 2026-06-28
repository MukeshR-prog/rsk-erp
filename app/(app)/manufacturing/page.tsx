"use client";

import { useEffect } from "react";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import { Button } from "@heroui/react";
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
  const { setWorkspace } = useWorkspaceStore();

  // Ensure workspace store matches routing context
  useEffect(() => {
    setWorkspace("manufacturing");
  }, [setWorkspace]);

  const handleShortcutClick = (actionName: string) => {
    toast.success(`${actionName} module will be connected in Phase 5 (Manufacturing)!`);
  };

  const kpis = [
    { title: "Today's Production", value: "0 Cases" },
    { title: "Today's Manufacturing Cost", value: "₹0.00" },
    { title: "Raw Material Consumption", value: "0.00 Tons" },
    { title: "Finished Goods Produced", value: "0 Packs" },
    { title: "Today's Manufacturing Expenses", value: "₹0.00" },
    { title: "Current Raw Material Stock", value: "0.00 Tons" },
    { title: "Current Finished Goods Stock", value: "0 Cases" },
  ];

  const quickActions = [
    { label: "Start Production", icon: Factory, color: "bg-emerald-600 text-white", click: () => handleShortcutClick("Start Production Batch") },
    { label: "Add Factory Expense", icon: TrendingDown, color: "bg-emerald-600 text-white", click: () => handleShortcutClick("Factory Expense Logs") },
    { label: "Create BOM Recipe", icon: Layers, color: "bg-emerald-600 text-white", click: () => handleShortcutClick("BOM Recipe Sheet") },
  ];

  const navigationShortcuts = [
    { label: "Bill of Materials", href: "/manufacturing/bom", desc: "Manage cup & tissue structural recipes", icon: Layers, click: () => handleShortcutClick("BOM Recipes") },
    { label: "Raw Materials", href: "/master-data/products", desc: "Browse rolls, chemicals & packaging catalogs", icon: Sparkles },
    { label: "Finished Goods", href: "/master-data/products", desc: "Browse finished cup & tissue stock catalogs", icon: Factory },
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
            subtitle="No data available yet"
          >
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-400 dark:text-slate-600 block mt-1">
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

        {/* Notice Info Card */}
        <Card title="Manufacturing Roadmap" subtitle="Factory Integration Logs">
          <div className="flex flex-col gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <div className="flex gap-2.5 items-start">
              <Info className="w-5.5 h-5.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>
                These analytics will reflect automatically as soon as the **BOM Recipes** and **Production Run** modules are built.
              </span>
            </div>
            <div className="mt-1 flex flex-col gap-1.5">
              <span className="font-bold text-slate-900 dark:text-slate-50">Included Modules:</span>
              <span className="pl-3.5">• Bill of Materials (BOM)</span>
              <span className="pl-3.5">• Batch Raw Material Shrinkage</span>
              <span className="pl-3.5">• Finished Goods Yield Analysis</span>
            </div>
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
