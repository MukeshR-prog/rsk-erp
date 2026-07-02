"use client";

import { useEffect, useState, useTransition } from "react";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import { Tabs, Tab } from "@heroui/react";
import { getManufacturingReportsAction } from "@/features/shared/dashboard/actions";
import {
  TrendingDown,
  Factory,
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
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

const COLORS = ["#10b981", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function ReportsPageContent() {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");
  const [reportData, setReportData] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  const loadReport = () => {
    startTransition(async () => {
      const res = await getManufacturingReportsAction(activeTab);
      if (res.success && res.data) {
        setReportData(res.data);
      } else {
        toast.error(res.error || "Failed to load report data");
      }
    });
  };

  useEffect(() => {
    loadReport();
  }, [activeTab]);

  const kpis = reportData ? [
    {
      title: "Total Expenses",
      value: `₹${reportData.summary.totalExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      subtitle: "Manufacturing direct costs",
      icon: TrendingDown,
      textColor: "text-red-650 dark:text-red-400"
    },
    {
      title: "Boxes Produced",
      value: `${reportData.summary.totalBoxesProduced.toLocaleString()} Boxes`,
      subtitle: "Log volume yield",
      icon: Factory,
      textColor: "text-emerald-600 dark:text-emerald-400"
    },
    {
      title: "Total Pieces",
      value: `${reportData.summary.totalPiecesProduced.toLocaleString()} Pcs`,
      subtitle: "Estimated unit yield",
      icon: Package,
      textColor: "text-blue-600 dark:text-blue-400"
    }
  ] : [];

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Manufacturing Reports"
        subtitle="Analyze production quantities, direct expense summaries, and efficiency"
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-955 rounded-xl border border-slate-205 dark:border-slate-800">
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
                  : "text-slate-655 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isPending || !reportData ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-slate-350 border-t-slate-900 animate-spin mx-auto mb-4" />
          <span className="text-sm text-slate-550 font-semibold uppercase tracking-wider">Generating report details...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* KPI summaries */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <Card key={kpi.title} title={kpi.title} subtitle={kpi.subtitle}>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-xl sm:text-2xl font-extrabold tracking-tight ${kpi.textColor}`}>
                      {kpi.value}
                    </span>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-505">
                      <Icon className="w-5.5 h-5.5" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Charts Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Primary Production & Expense Trend Chart */}
            <Card title="Expenses & Production Volume Trend" className="lg:col-span-2" subtitle="Comparative overview of yields and direct cash outflows">
              <div className="h-80 w-full mt-4 text-xs font-semibold">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={reportData.chartData}
                    margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" stroke="#94a3b8" />
                    <YAxis yAxisId="left" orientation="left" stroke="#ef4444" label={{ value: "Expenses (₹)", angle: -90, position: "insideLeft", style: { textAnchor: "middle", fill: "#94a3b8" } }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" label={{ value: "Boxes Produced", angle: 90, position: "insideRight", style: { textAnchor: "middle", fill: "#94a3b8" } }} />
                    <Tooltip contentStyle={{ borderRadius: "16px", fontWeight: "bold" }} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="expenses" name="Direct Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="boxes" name="Production (Boxes)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Expense Breakdown Pie Chart */}
            <Card title="Expense Category Breakdown" subtitle="Outflow distribution by categories">
              <div className="h-80 w-full mt-4 flex flex-col justify-center items-center">
                {reportData.expenseBreakdown && reportData.expenseBreakdown.length > 0 ? (
                  <>
                    <div className="h-60 w-full text-xs font-semibold">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={reportData.expenseBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {reportData.expenseBreakdown.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `₹${Number(value || 0).toLocaleString()}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Legend keys */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-2 max-h-16 overflow-y-auto px-2">
                      {reportData.expenseBreakdown.map((entry: any, index: number) => (
                        <div key={entry.name} className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="truncate max-w-[80px]">{entry.name}</span>
                          <span className="text-slate-900 dark:text-slate-100">(₹{entry.value.toLocaleString()})</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center text-slate-400 font-semibold py-20">
                    No expense records available to breakdown.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
