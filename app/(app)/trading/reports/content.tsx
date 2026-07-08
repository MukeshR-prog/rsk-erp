"use client";

import { useEffect, useState, useTransition } from "react";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import { Tabs, Tab } from "@heroui/react";
import { StatsSkeleton } from "@/components/ui/Skeleton";
import { getProfitLossMetricsAction } from "@/features/shared/dashboard/actions";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package
} from "lucide-react";
import toast from "react-hot-toast";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

export default function TradingReportsPageContent() {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");
  const [reportData, setReportData] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  const loadReport = () => {
    startTransition(async () => {
      const res = await getProfitLossMetricsAction(activeTab);
      if (res.success && res.data) {
        setReportData(res.data);
      } else {
        toast.error(res.error || "Failed to load report metrics");
      }
    });
  };

  useEffect(() => {
    loadReport();
  }, [activeTab]);

  const kpis = reportData ? [
    {
      title: "Sales Revenue",
      value: `₹${reportData.summary.totalSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      subtitle: "Completed sales invoicing",
      icon: TrendingUp,
      color: "border-l-emerald-500",
      textColor: "text-emerald-600 dark:text-emerald-400"
    },
    {
      title: "Purchase Cost",
      value: `₹${reportData.summary.totalPurchases.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      subtitle: "Direct trading stock purchases",
      icon: TrendingDown,
      color: "border-l-orange-500",
      textColor: "text-orange-600"
    },
    {
      title: "Direct Expenses",
      value: `₹${reportData.summary.totalExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      subtitle: "Manufacturing floor expenses",
      icon: TrendingDown,
      color: "border-l-red-500",
      textColor: "text-red-650"
    },
    {
      title: "Gross Profit",
      value: `₹${reportData.summary.grossProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      subtitle: "Sales minus Purchases",
      icon: DollarSign,
      color: "border-l-blue-500",
      textColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Net Profit",
      value: `₹${reportData.summary.netProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      subtitle: "Gross Profit minus Expenses",
      icon: DollarSign,
      color: "border-l-purple-550",
      textColor: reportData.summary.netProfit >= 0 ? "text-emerald-600 font-extrabold" : "text-red-600 font-extrabold"
    },
    {
      title: "Current Inventory Value",
      value: `₹${reportData.summary.currentInventoryValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      subtitle: "Dynamic warehouse valuation",
      icon: Package,
      color: "border-l-teal-500",
      textColor: "text-teal-600 dark:text-teal-400"
    }
  ] : [];

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Profit & Loss reports"
        subtitle="Consolidated financial analytics for single-owner operations"
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
          {[
            { key: "daily", label: "Daily View (30 Days)" },
            { key: "weekly", label: "Weekly View (12 Weeks)" },
            { key: "monthly", label: "Monthly View (12 Months)" },
            { key: "yearly", label: "Yearly View (5 Years)" },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key as any)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${
                activeTab === t.key
                  ? "bg-slate-900 text-white dark:bg-slate-55 dark:text-slate-950 shadow-sm font-black"
                  : "text-slate-650 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isPending || !reportData ? (
        <StatsSkeleton />
      ) : (
        <div className="flex flex-col gap-6">
          {/* KPI grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <Card
                  key={kpi.title}
                  className={`border-l-4 ${kpi.color} p-4 bg-white dark:bg-slate-900 shadow-md rounded-2xl`}
                  title={kpi.title}
                  subtitle={kpi.subtitle}
                >
                  <span className={`text-base sm:text-lg font-extrabold tracking-tight block mt-1.5 ${kpi.textColor}`}>
                    {kpi.value}
                  </span>
                </Card>
              );
            })}
          </div>

          {/* Charts & Outstanding balances split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Financial performance trend chart */}
            <Card title="Revenue, Cost & Profit Trend" className="lg:col-span-2" subtitle="Sales vs Purchase Costs vs Net Profits over selected period">
              <div className="h-80 w-full mt-4 text-xs font-semibold">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={reportData.chartData}
                    margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" label={{ value: "Amount (₹)", angle: -90, position: "insideLeft", style: { textAnchor: "middle", fill: "#94a3b8" } }} />
                    <Tooltip contentStyle={{ borderRadius: "16px", fontWeight: "bold" }} formatter={(value) => `₹${Number(value || 0).toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="sales" name="Sales Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="purchases" name="Purchase Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="netProfit" name="Net Profit" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Outstanding Balances & Health */}
            <Card title="Outstanding receivables & Payables" subtitle="Dynamic ledger dues comparison">
              <div className="flex flex-col gap-6 py-4 justify-center h-full max-h-[300px]">
                <div className="flex items-center justify-between p-4 bg-red-50/55 dark:bg-red-950/10 border border-red-150 rounded-2xl">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Supplier Outstanding (Payable)</span>
                    <span className="font-extrabold text-red-655 text-lg">
                      ₹{reportData.summary.outstandingSupplierAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50/50 dark:bg-green-950/10 border border-green-150 rounded-2xl">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Customer Outstanding (Receivable)</span>
                    <span className="font-extrabold text-emerald-600 text-lg">
                      ₹{reportData.summary.outstandingCustomerAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-center text-xs text-slate-450 font-semibold italic">
                  Outstanding calculations are compiled on-the-fly directly from active invoice ledgers.
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
