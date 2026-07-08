"use client";

import { useEffect, useState } from "react";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import { Button } from "@heroui/react";
import {
  Plus,
  ShoppingBag,
  TrendingUp,
  CreditCard,
  Users,
  ArrowRight,
  TrendingDown,
  Info,
  Wallet,
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Banknote,
} from "lucide-react";
import toast from "react-hot-toast";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { StatsSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import Link from "next/link";
import { getTradingDashboardAction } from "@/features/shared/dashboard/actions";
import dayjs from "dayjs";

type TradingDashboardData = {
  metrics: {
    todayPurchases: number;
    todayPayments: number;
    supplierOutstanding: number;
    currentStockValue: number;
    todaySales: number;
    todayCollections: number;
    customerOutstanding: number;
    lowStockCount: number;
  };
  recentPurchases: Array<{
    id: string;
    number: string;
    supplierName: string;
    date: string;
    grandTotal: number;
    paymentStatus: "PAID" | "PARTIALLY_PAID" | "UNPAID" | string;
  }>;
  recentPayments: Array<{
    id: string;
    number: string;
    supplierName: string;
    date: string;
    amount: number;
    status: "CANCELLED" | string;
  }>;
};

export default function TradingDashboardPage() {
  const { setWorkspace } = useWorkspaceStore();

  const [data, setData] = useState<TradingDashboardData | null>(null);

  // Ensure workspace store matches routing context
  useEffect(() => {
    setWorkspace("trading");
  }, [setWorkspace]);


  useEffect(() => {
    let active = true;

    void (async () => {
      const res = await getTradingDashboardAction();

      if (!active) {
        return;
      }

      if (res.success && res.data) {
        setData(res.data as TradingDashboardData);
      } else {
        toast.error(res.error || "Failed to load dashboard data.");
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (!data) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        <Header
          title="Trading Dashboard"
          subtitle="Loading dashboard metrics and logs..."
        />
        <StatsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TableSkeleton rows={4} />
          <TableSkeleton rows={4} />
        </div>
      </div>
    );
  }

  const { metrics, recentPurchases, recentPayments } = data;

  const kpis = [
    { title: "Today's Sales", value: `₹${metrics.todaySales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, subtitle: "Logged sales today", icon: TrendingUp, color: "emerald" },
    { title: "Today's Purchases", value: `₹${metrics.todayPurchases.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, subtitle: "Logged bills today", icon: ShoppingBag, color: "rose" },
    { title: "Today's Collections", value: `₹${metrics.todayCollections.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, subtitle: "Cleared customer collections", icon: Coins, color: "teal" },
    { title: "Today's Payments", value: `₹${metrics.todayPayments.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, subtitle: "Cleared vendor payments", icon: Wallet, color: "pink" },
    { title: "Customer Outstanding", value: `₹${metrics.customerOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, subtitle: "Total unpaid customer invoices", icon: Users, color: "amber" },
    { title: "Supplier Outstanding", value: `₹${metrics.supplierOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, subtitle: "Total unpaid supplier bills", icon: Users, color: "purple" },
    { title: "Current Stock Value", value: `₹${metrics.currentStockValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, subtitle: "Weighted stock valuation", icon: Package, color: "blue" },
    { title: "Low Stock Items", value: `${metrics.lowStockCount} Items`, subtitle: "Current inventory warnings", icon: AlertTriangle, color: "orange" },
  ];

  const colorGradients: Record<string, string> = {
    emerald: "from-emerald-500 to-teal-500",
    rose: "from-rose-500 to-pink-500",
    teal: "from-teal-500 to-cyan-500",
    pink: "from-pink-500 to-rose-500",
    amber: "from-amber-500 to-orange-500",
    purple: "from-purple-500 to-indigo-500",
    blue: "from-blue-500 to-indigo-500",
    orange: "from-orange-500 to-red-500",
  };

  const colorBadgeStyles: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-450",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-450",
    teal: "bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-450",
    pink: "bg-pink-50 text-pink-600 dark:bg-pink-950/30 dark:text-pink-450",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-450",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-450",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-450",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-450",
  };

  const colorTextStyles: Record<string, string> = {
    emerald: "text-emerald-650 dark:text-emerald-450",
    rose: "text-rose-650 dark:text-rose-450",
    teal: "text-teal-650 dark:text-teal-450",
    pink: "text-pink-650 dark:text-pink-450",
    amber: "text-amber-655 dark:text-amber-450",
    purple: "text-purple-650 dark:text-purple-450",
    blue: "text-blue-650 dark:text-blue-450",
    orange: "text-orange-655 dark:text-orange-450",
  };

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Trading Dashboard"
        subtitle="Distribution, purchases, and sales operations"
        action={
          <Link href="/trading/purchases?new=true">
            <Button
              variant="primary"
              className="w-full sm:w-auto font-bold rounded-xl bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-950 border-none"
              size="md"
            >
              <Plus className="w-4.5 h-4.5 mr-1.5" />
              <span>New Purchase Invoice</span>
            </Button>
          </Link>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-150 dark:border-slate-855 p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-0.5"
            >
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${colorGradients[kpi.color]}`} />
              
              <div className="flex justify-between items-start mt-1">
                <div className="flex flex-col gap-0.5 text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {kpi.title}
                  </span>
                  <span className="text-xs font-semibold text-slate-450 dark:text-slate-500 line-clamp-1">
                    {kpi.subtitle}
                  </span>
                </div>
                <div className={`p-2 rounded-xl ${colorBadgeStyles[kpi.color]} shrink-0 transition-transform duration-200 group-hover:scale-110`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>
              
              <div className="mt-4 flex flex-col text-left">
                <span className={`text-xl sm:text-2xl font-black tracking-tight ${colorTextStyles[kpi.color]}`}>
                  {kpi.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Shortcuts Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Quick Tasks" className="md:col-span-2" subtitle="One-tap actions for common trading transactions">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Link href="/trading/purchases?new=true" className="w-full">
              <div className="h-24 w-full flex flex-col items-center justify-center gap-2 rounded-2xl p-3 border border-slate-150 dark:border-slate-855 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/60 hover:border-slate-350 dark:hover:border-slate-700 transition-all duration-200 cursor-pointer group">
                <div className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl shrink-0 transition-transform duration-200 group-hover:scale-105">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="text-xs font-black text-slate-755 dark:text-slate-200 tracking-wide">New Purchase</span>
              </div>
            </Link>

            <Link href="/trading/sales?new=true" className="w-full">
              <div className="h-24 w-full flex flex-col items-center justify-center gap-2 rounded-2xl p-3 border border-slate-150 dark:border-slate-855 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/60 hover:border-slate-355 dark:hover:border-slate-700 transition-all duration-200 cursor-pointer group">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0 transition-transform duration-200 group-hover:scale-105">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-xs font-black text-slate-755 dark:text-slate-200 tracking-wide">New Sale</span>
              </div>
            </Link>

            <Link href="/trading/payments?new=true&mode=CUSTOMER" className="w-full">
              <div className="h-24 w-full flex flex-col items-center justify-center gap-2 rounded-2xl p-3 border border-slate-150 dark:border-slate-855 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/60 hover:border-slate-355 dark:hover:border-slate-700 transition-all duration-200 cursor-pointer group">
                <div className="p-2 bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-450 rounded-xl shrink-0 transition-transform duration-200 group-hover:scale-105">
                  <Coins className="w-5 h-5" />
                </div>
                <span className="text-xs font-black text-slate-755 dark:text-slate-200 tracking-wide">Customer Payment</span>
              </div>
            </Link>

            <Link href="/trading/payments?new=true&mode=SUPPLIER" className="w-full">
              <div className="h-24 w-full flex flex-col items-center justify-center gap-2 rounded-2xl p-3 border border-slate-150 dark:border-slate-855 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/60 hover:border-slate-355 dark:hover:border-slate-700 transition-all duration-200 cursor-pointer group">
                <div className="p-2 bg-pink-50 dark:bg-pink-950/20 text-pink-650 dark:text-pink-400 rounded-xl shrink-0 transition-transform duration-200 group-hover:scale-105">
                  <Wallet className="w-5 h-5" />
                </div>
                <span className="text-xs font-black text-slate-755 dark:text-slate-200 tracking-wide">Supplier Payment</span>
              </div>
            </Link>
          </div>
        </Card>

        {/* Notice Info Card */}
        <Card title="Workspace Metrics" subtitle="Active registers configuration">
          <div className="flex flex-col gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <div className="flex gap-2.5 items-start">
              <Info className="w-5 h-5 text-slate-900 dark:text-slate-55 shrink-0" />
              <span>
                These analytics are linked directly to your Supabase PostgreSQL registers. Double entries calculate outstandings on runtime.
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Purchases & Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Purchases */}
        <Card title="Recent Purchase Invoices" subtitle="Latest logged vendor invoices">
          {recentPurchases.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No purchase records registered yet.</div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {recentPurchases.map((p) => {
                let badgeClass = "";
                if (p.paymentStatus === "PAID") badgeClass = "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400";
                else if (p.paymentStatus === "PARTIALLY_PAID") badgeClass = "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400";
                else badgeClass = "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400";

                return (
                  <div key={p.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                    <div className="flex flex-col gap-1 text-left">
                      <Link href={`/trading/purchases/${p.id}`} className="font-mono font-bold text-sm text-slate-900 dark:text-white hover:underline">
                        {p.number}
                      </Link>
                      <span className="text-xs text-slate-450 dark:text-slate-500">{p.supplierName} • {dayjs(p.date).format("DD MMM YYYY")}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-sm font-extrabold">₹{p.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border border-current ${badgeClass}`}>
                        {p.paymentStatus}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recent Payments & Collections */}
        <Card title="Recent Payments & Receipts" subtitle="Latest transactions registered">
          {recentPayments.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No transactions registered yet.</div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {recentPayments.map((p) => (
                <div key={p.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                  <div className="flex flex-col gap-1 text-left">
                    <Link href={`/trading/payments/${p.id}`} className="font-mono font-bold text-sm text-slate-900 dark:text-white hover:underline">
                      {p.number}
                    </Link>
                    <span className="text-xs text-slate-450 dark:text-slate-500">{p.supplierName} • {dayjs(p.date).format("DD MMM YYYY")}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-extrabold text-green-600 dark:text-green-400">₹{p.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    <span className={`text-[10px] font-bold ${p.status === "CANCELLED" ? "text-red-500" : "text-slate-450"}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Navigation Shortcuts */}
      <Card title="Navigation Shortcuts" subtitle="Fast links to sub-menus and databases">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/master-data/contacts?type=CUSTOMER">
            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-300 dark:border-slate-850 dark:hover:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl text-slate-700 dark:text-slate-350">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-slate-905 dark:text-slate-50">Customers</span>
                  <span className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">Manage customer registers</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link href="/master-data/contacts?type=SUPPLIER">
            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-300 dark:border-slate-850 dark:hover:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl text-slate-700 dark:text-slate-350">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-slate-905 dark:text-slate-50">Suppliers</span>
                  <span className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">Manage vendor registers</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link href="/trading/payments">
            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-300 dark:border-slate-850 dark:hover:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl text-slate-700 dark:text-slate-350">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-bold text-slate-905 dark:text-slate-50">Payments & Receipts</span>
                  <span className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">Log settlements</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </Card>
    </div>
  );
}

