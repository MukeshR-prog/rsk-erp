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
} from "lucide-react";
import toast from "react-hot-toast";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
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
      <div className="flex h-100 items-center justify-center text-slate-500 font-medium">
        Loading Trading Dashboard...
      </div>
    );
  }

  const { metrics, recentPurchases, recentPayments } = data;

  const kpis = [
    { title: "Today's Purchases", value: `₹${metrics.todayPurchases.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, subtitle: "Logged bills today" },
    { title: "Today's Payments", value: `₹${metrics.todayPayments.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, subtitle: "Cleared vendor payments today" },
    { title: "Supplier Outstanding", value: `₹${metrics.supplierOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, subtitle: "Total unpaid supplier bills" },
    { title: "Current Stock Value", value: `₹${metrics.currentStockValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, subtitle: "Weighted stock valuation" },
    { title: "Today's Sales", value: `₹${metrics.todaySales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, subtitle: "Logged sales today" },
    { title: "Today's Collections", value: `₹${metrics.todayCollections.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, subtitle: "Cleared customer collections today" },
    { title: "Customer Outstanding", value: `₹${metrics.customerOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`, subtitle: "Total unpaid customer invoices" },
    { title: "Low Stock Items", value: `${metrics.lowStockCount} Items`, subtitle: "Current inventory warnings" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Trading Dashboard"
        subtitle="Distribution, purchases, and sales operations"
        action={
          <Link href="/trading/purchases?new=true">
            <Button
              variant="primary"
              className="w-full sm:w-auto font-bold rounded-xl"
              size="md"
            >
              <Plus className="w-4.5 h-4.5 mr-1.5" />
              <span>New Purchase Invoice</span>
            </Button>
          </Link>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card
            key={kpi.title}
            className="border-l-4 border-l-slate-900 dark:border-l-slate-100"
            title={kpi.title}
            subtitle={kpi.subtitle}
          >
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 block mt-1">
              {kpi.value}
            </span>
          </Card>
        ))}
      </div>

      {/* Quick Action Shortcuts Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Quick Tasks" className="md:col-span-2" subtitle="One-tap actions for common trading transactions">
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            <Link href="/trading/purchases?new=true" className="w-full">
              <Button
                variant="tertiary"
                className="h-20 w-full flex flex-col items-center justify-center gap-1.5 rounded-2xl p-2 border border-slate-150 dark:border-slate-855"
              >
                <ShoppingBag className="w-5 h-5 text-slate-805 dark:text-slate-205" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">New Purchase</span>
              </Button>
            </Link>

            <Link href="/trading/sales?new=true" className="w-full">
              <Button
                variant="tertiary"
                className="h-20 w-full flex flex-col items-center justify-center gap-1.5 rounded-2xl p-2 border border-slate-150 dark:border-slate-855"
              >
                <TrendingUp className="w-5 h-5 text-slate-805 dark:text-slate-205" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">New Sale</span>
              </Button>
            </Link>

            <Link href="/trading/payments?new=true&mode=CUSTOMER" className="w-full">
              <Button
                variant="tertiary"
                className="h-20 w-full flex flex-col items-center justify-center gap-1.5 rounded-2xl p-2 border border-slate-150 dark:border-slate-855"
              >
                <CreditCard className="w-5 h-5 text-slate-805 dark:text-slate-205" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Receive Payment</span>
              </Button>
            </Link>

            <Link href="/trading/payments?new=true&mode=SUPPLIER" className="w-full">
              <Button
                variant="tertiary"
                className="h-20 w-full flex flex-col items-center justify-center gap-1.5 rounded-2xl p-2 border border-slate-150 dark:border-slate-855"
              >
                <TrendingDown className="w-5 h-5 text-slate-805 dark:text-slate-205" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Supplier Payment</span>
              </Button>
            </Link>
          </div>
        </Card>

        {/* Notice Info Card */}
        <Card title="Workspace Metrics" subtitle="Active registers configuration">
          <div className="flex flex-col gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <div className="flex gap-2.5 items-start">
              <Info className="w-5 h-5 text-slate-900 dark:text-slate-50 shrink-0" />
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

