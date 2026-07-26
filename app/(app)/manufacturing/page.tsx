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
  Receipt,
  TrendingUp,
  ArrowRight,
  TrendingDown,
  DollarSign
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
    monthlySales: 0,
    yearlySales: 0,
    monthlyProfit: 0,
    yearlyProfit: 0,
    trendData: [],
    recentExpenses: [],
    recentSales: [],
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
      value: `₹${(metrics.todayExpenses || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      subtitle: "Expenses recorded today",
      color: "border-l-red-500",
      textColor: "text-red-600 dark:text-red-400"
    },
    {
      title: "Monthly Expenses",
      value: `₹${(metrics.monthlyExpenses || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      subtitle: "Total expenses this month",
      color: "border-l-orange-500",
      textColor: "text-orange-600"
    },
    {
      title: "Monthly Sales",
      value: `₹${(metrics.monthlySales || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      subtitle: "Manufacturing sales this month",
      color: "border-l-emerald-500",
      textColor: "text-emerald-600 dark:text-emerald-400"
    },
    {
      title: "Monthly Net Profit",
      value: `₹${(metrics.monthlyProfit || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      subtitle: "Sales - Expenses (Month)",
      color: metrics.monthlyProfit >= 0 ? "border-l-emerald-600" : "border-l-red-600",
      textColor: metrics.monthlyProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600"
    },
    {
      title: "Yearly Net Profit",
      value: `₹${(metrics.yearlyProfit || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      subtitle: "Sales - Expenses (Year)",
      color: metrics.yearlyProfit >= 0 ? "border-l-blue-600" : "border-l-amber-600",
      textColor: metrics.yearlyProfit >= 0 ? "text-blue-600 dark:text-blue-400" : "text-amber-600"
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        <Header
          title="Manufacturing Dashboard"
          subtitle="Loading metrics..."
        />
        <StatsSkeleton />
        <TableSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Manufacturing Dashboard"
        subtitle="Track factory expenses, sales entries, and net profit"
        action={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onPress={() => router.push("/manufacturing/expenses")}
              className="w-full sm:w-auto font-bold rounded-xl border-slate-200"
            >
              <Receipt className="w-4 h-4 mr-1.5 text-slate-500" />
              <span>Record Expense</span>
            </Button>
            <Button
              variant="primary"
              onPress={() => router.push("/manufacturing/sales")}
              className="w-full sm:w-auto font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-none h-11"
            >
              <Plus className="w-4.5 h-4.5 mr-1.5" />
              <span>Record Monthly Sales</span>
            </Button>
          </div>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <Card
            key={kpi.title}
            className={`border-l-4 ${kpi.color}`}
            title={kpi.title}
            subtitle={kpi.subtitle}
          >
            <span className={`text-lg font-extrabold tracking-tight block mt-1 ${kpi.textColor}`}>
              {kpi.value}
            </span>
          </Card>
        ))}
      </div>

      {/* Tables layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Manufacturing Sales Entries */}
        <Card
          title="Recent Sales Entries"
          subtitle="Latest manufacturing revenue entries"
          headerAction={
            <Link href="/manufacturing/sales" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5">
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="overflow-x-auto py-1">
            {metrics.recentSales && metrics.recentSales.length > 0 ? (
              <table className="w-full text-left border-collapse text-xs font-medium">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-450 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Sales Amount</th>
                    <th className="py-2.5 px-3">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.recentSales.map((item: any) => (
                    <tr key={item.id} className="border-b border-slate-50 dark:border-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">{dayjs(item.date).format("DD MMM YYYY")}</td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600">₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 px-3 text-slate-500 truncate max-w-xs">{item.description || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-10 text-slate-400 font-semibold">
                No manufacturing sales entries logged yet.
              </div>
            )}
          </div>
        </Card>

        {/* Recent Factory Expenses */}
        <Card
          title="Recent Factory Expenses"
          subtitle="Latest manufacturing expenses"
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
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.recentExpenses.map((item: any) => (
                    <tr key={item.id} className="border-b border-slate-50 dark:border-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">{item.number}</td>
                      <td className="py-3 px-3">
                        <span className="bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 font-bold px-2 py-0.5 rounded-lg">
                          {item.categoryName}
                        </span>
                      </td>
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
    </div>
  );
}
