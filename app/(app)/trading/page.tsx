"use client";

import { useEffect } from "react";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import { Button } from "@heroui/react";
import {
  Plus,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  Users,
  Package,
  BookOpen,
  BarChart3,
  ArrowRight,
  TrendingDown,
  Info
} from "lucide-react";
import toast from "react-hot-toast";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import Link from "next/link";

export default function TradingDashboardPage() {
  const { setWorkspace } = useWorkspaceStore();

  // Ensure workspace store matches routing context
  useEffect(() => {
    setWorkspace("trading");
  }, [setWorkspace]);

  const handleShortcutClick = (actionName: string) => {
    toast.success(`${actionName} module will be connected in the next phase (Trading & Invoices)!`);
  };

  const kpis = [
    { title: "Today's Purchases", value: "₹0.00" },
    { title: "Today's Sales", value: "₹0.00" },
    { title: "Today's Collections", value: "₹0.00" },
    { title: "Today's Payments", value: "₹0.00" },
    { title: "Customer Outstanding", value: "₹0.00" },
    { title: "Supplier Outstanding", value: "₹0.00" },
    { title: "Current Stock Value", value: "₹0.00" },
    { title: "Low Stock Items", value: "0 Items" },
  ];

  const quickActions = [
    { label: "New Purchase", icon: ShoppingBag, color: "bg-slate-900 dark:bg-slate-50", click: () => handleShortcutClick("New Purchase") },
    { label: "New Sale", icon: TrendingUp, color: "bg-slate-900 dark:bg-slate-50", click: () => handleShortcutClick("New Sale") },
    { label: "Receive Payment", icon: CreditCard, color: "bg-slate-900 dark:bg-slate-50", click: () => handleShortcutClick("Receive Payment") },
    { label: "Supplier Payment", icon: TrendingDown, color: "bg-slate-900 dark:bg-slate-50", click: () => handleShortcutClick("Supplier Payment") },
  ];

  const navigationShortcuts = [
    { label: "Customers", href: "/master-data/contacts", desc: "Manage trading customer contact records", icon: Users },
    { label: "Suppliers", href: "/master-data/contacts", desc: "Manage raw material & goods vendors", icon: Users },
    { label: "Inventory", href: "/trading/inventory", desc: "Check trading goods inventory", icon: Package, click: () => handleShortcutClick("Inventory Ledger") },
    { label: "Cash Book", href: "/trading/cashbook", desc: "Daily collection & cash registers", icon: BookOpen, click: () => handleShortcutClick("Cash Book") },
    { label: "Reports", href: "/trading/reports", desc: "Trading sales & purchases charts", icon: BarChart3, click: () => handleShortcutClick("Trading Reports") },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Trading Dashboard"
        subtitle="Distribution, purchases, and sales operations"
        action={
          <Button
            variant="primary"
            onPress={() => handleShortcutClick("New Sale")}
            className="w-full sm:w-auto font-bold rounded-xl"
            size="md"
          >
            <Plus className="w-4.5 h-4.5 mr-1.5" />
            <span>New Sale</span>
          </Button>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card
            key={kpi.title}
            className="border-l-4 border-l-slate-200 dark:border-l-slate-800"
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
        <Card title="Quick Tasks" className="md:col-span-2" subtitle="One-tap actions for common trading transactions">
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant="tertiary"
                  className="h-20 flex flex-col items-center justify-center gap-1.5 rounded-2xl p-2 border border-slate-100 dark:border-slate-850"
                  onPress={action.click}
                >
                  <Icon className="w-5 h-5 text-slate-805 dark:text-slate-205" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate w-full text-center">
                    {action.label}
                  </span>
                </Button>
              );
            })}
          </div>
        </Card>

        {/* Notice Info Card */}
        <Card title="Next Phase Preview" subtitle="Development Roadmap Status">
          <div className="flex flex-col gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <div className="flex gap-2.5 items-start">
              <Info className="w-5.5 h-5.5 text-slate-900 dark:text-slate-50 flex-shrink-0" />
              <span>
                These analytics will auto-populate as soon as the **Trading Invoice** and **Collections** ledger modules are implemented.
              </span>
            </div>
            <div className="mt-1 flex flex-col gap-1.5">
              <span className="font-bold text-slate-900 dark:text-slate-50">Included Modules:</span>
              <span className="pl-3.5">• Cash & Bank Logbook</span>
              <span className="pl-3.5">• Customer Ledger Sheets</span>
              <span className="pl-3.5">• Vendor Bills Outstanding</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation Shortcuts */}
      <Card title="Navigation Shortcuts" subtitle="Fast links to sub-menus and databases">
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
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
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
