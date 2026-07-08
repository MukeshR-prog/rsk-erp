"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import { Button } from "@heroui/react";
import { StatsSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { getManufacturingDashboardAction } from "@/features/shared/dashboard/actions";
import {
  Plus,
  Factory,
  Receipt,
  Package,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import dayjs from "dayjs";

export default function ManufacturingDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>({
    todayExpenses: 0,
    monthlyExpenses: 0,
    yearlyExpenses: 0,
    productionToday: 0,
    productionMonth: 0,
    currentFinishedGoodsStock: 0,
    recentExpenses: [],
    recentProduction: [],
    lowStockProducts: [],
  });

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const res = await getManufacturingDashboardAction();
      if (res.success && res.data) {
        setMetrics(res.data);
      } else {
        toast.error(res.error || "Failed to load dashboard metrics");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const kpis = [
    {
      title: "Today's Expenses",
      value: `₹${metrics.todayExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      subtitle: "Expenses recorded today",
      color: "border-l-red-500",
      textColor: "text-red-650 dark:text-red-400"
    },
    {
      title: "Monthly Expenses",
      value: `₹${metrics.monthlyExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      subtitle: "Recorded this month",
      color: "border-l-orange-500",
      textColor: "text-orange-655"
    },
    {
      title: "Yearly Expenses",
      value: `₹${metrics.yearlyExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      subtitle: "Total this year",
      color: "border-l-purple-500",
      textColor: "text-purple-600"
    },
    {
      title: "Today's Production",
      value: `${metrics.productionToday} Boxes`,
      subtitle: "Boxes finished today",
      color: "border-l-emerald-500",
      textColor: "text-emerald-600 dark:text-emerald-400"
    },
    {
      title: "Monthly Production",
      value: `${metrics.productionMonth} Boxes`,
      subtitle: "Total boxes this month",
      color: "border-l-blue-500",
      textColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Finished Goods Stock",
      value: `${metrics.currentFinishedGoodsStock} Boxes`,
      subtitle: "Current available boxes",
      color: "border-l-teal-500",
      textColor: "text-teal-600 dark:text-teal-400"
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        <Header
          title="Manufacturing Dashboard"
          subtitle="Loading floor dashboard details..."
        />
        <StatsSkeleton />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 flex flex-col gap-6">
            <TableSkeleton rows={3} />
            <TableSkeleton rows={3} />
          </div>
          <div>
            <TableSkeleton rows={2} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Manufacturing Dashboard"
        subtitle="Cup & Tissue production tracking & floor expenses"
        action={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onPress={() => router.push("/manufacturing/expenses?new=true")}
              className="w-full sm:w-auto font-bold rounded-xl border-slate-200"
            >
              <Receipt className="w-4 h-4 mr-1.5 text-slate-500" />
              <span>Record Expense</span>
            </Button>
            <Button
              variant="primary"
              onPress={() => router.push("/manufacturing/production?new=true")}
              className="w-full sm:w-auto font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-none h-11"
            >
              <Plus className="w-4.5 h-4.5 mr-1.5" />
              <span>Record Production</span>
            </Button>
          </div>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi) => (
          <Card
            key={kpi.title}
            className={`border-l-4 ${kpi.color}`}
            title={kpi.title}
            subtitle={kpi.subtitle}
          >
            <span className={`text-base sm:text-lg font-extrabold tracking-tight block mt-1 ${kpi.textColor}`}>
              {kpi.value}
            </span>
          </Card>
        ))}
      </div>

      {/* Main floor logs layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Production Entries */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <Card
            title="Recent Production entries"
            subtitle="Last 5 finished goods logs"
            headerAction={
              <Link href="/manufacturing/production" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5">
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <div className="overflow-x-auto py-1">
              {metrics.recentProduction && metrics.recentProduction.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs font-medium">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-455 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Entry No</th>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3 text-right">Qty Produced</th>
                      <th className="py-2.5 px-3 text-right">Pieces/Box</th>
                      <th className="py-2.5 px-3 text-right">Total Pieces</th>
                      <th className="py-2.5 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.recentProduction.map((item: any) => (
                      <tr key={item.id} className="border-b border-slate-50 dark:border-slate-905 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{item.number}</td>
                        <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">{item.productName}</td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-600">{item.boxesProduced} Boxes</td>
                        <td className="py-3 px-3 text-right text-slate-400 font-semibold">{item.piecesPerBox.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-800 dark:text-slate-100">{item.totalPieces.toLocaleString()} pcs</td>
                        <td className="py-3 px-3 text-slate-500 font-semibold">{dayjs(item.date).format("DD MMM YYYY")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-10 text-slate-400 font-semibold">
                  No production logged yet. Click "Record Production" to log outputs.
                </div>
              )}
            </div>
          </Card>

          {/* Recent Expenses */}
          <Card
            title="Recent Factory Expenses"
            subtitle="Last 5 direct manufacturing expenses"
            headerAction={
              <Link href="/manufacturing/expenses" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5">
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <div className="overflow-x-auto py-1">
              {metrics.recentExpenses && metrics.recentExpenses.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs font-medium">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-455 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Expense No</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.recentExpenses.map((item: any) => (
                      <tr key={item.id} className="border-b border-slate-50 dark:border-slate-905 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{item.number}</td>
                        <td className="py-3 px-3">
                          <span className="bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 font-bold px-2 py-0.5 rounded-lg">
                            {item.categoryName}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-600 dark:text-slate-400 truncate max-w-xs">{item.description}</td>
                        <td className="py-3 px-3 text-right font-extrabold text-red-600">₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td className="py-3 px-3 text-slate-500 font-semibold">{dayjs(item.date).format("DD MMM YYYY")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-10 text-slate-400 font-semibold">
                  No factory expenses logged yet.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar Alerts */}
        <div className="flex flex-col gap-6">
          <Card title="Finished Goods Low Stock" subtitle="Items below minimum alert limit">
            <div className="flex flex-col gap-3 mt-1 text-xs">
              {metrics.lowStockProducts && metrics.lowStockProducts.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {metrics.lowStockProducts.map((p: any) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-3 rounded-2xl border border-red-100 dark:border-red-950/30 bg-red-50/30 dark:bg-red-950/10"
                    >
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-bold text-slate-900 dark:text-slate-50 truncate">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5">
                          SKU: {p.code}
                        </span>
                      </div>
                      <span className="font-extrabold text-red-600 text-sm">
                        {p.currentStock} Bxs
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 font-semibold">
                  Stock levels are healthy. No alerts.
                </div>
              )}
            </div>
          </Card>

          <Card title="Production Quick View" subtitle="Key manufactured articles">
            <div className="flex flex-col gap-3 p-1">
              <div className="flex justify-between items-center text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 font-semibold">
                <span className="text-slate-500">Workspace Status</span>
                <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-lg font-bold">
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center text-xs p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 font-semibold">
                <span className="text-slate-500">Centralized stock</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">
                  Synchronized
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
