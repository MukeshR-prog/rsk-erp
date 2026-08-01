"use client";

import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTheme } from "next-themes";
import { Button } from "@heroui/react";
import { Briefcase, Factory, LogOut, ArrowRight, User, CheckCircle2, Building2, Sun, Moon } from "lucide-react";
import toast from "react-hot-toast";

export default function WorkspaceSelectPage() {
  const router = useRouter();
  const { setWorkspace } = useWorkspaceStore();
  const { user, signOut } = useAuthStore();
  const { theme, setTheme } = useTheme();

  const handleSelect = (workspace: "trading" | "manufacturing") => {
    setWorkspace(workspace);
    toast.success(`Entered ${workspace === "trading" ? "Trading" : "Manufacturing"} Workspace`);
    router.push(workspace === "trading" ? "/trading" : "/manufacturing");
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Successfully signed out");
    router.replace("/login");
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 px-4 py-12 select-none overflow-hidden transition-colors duration-300">
      {/* Background Radial Aura */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Controls: Theme Toggle */}
      <div className="absolute top-5 right-5 z-20">
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      <div className="z-10 w-full max-w-5xl flex flex-col gap-10">
        {/* Top Header Badge & Title */}
        <div className="text-center flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md text-xs font-bold text-slate-700 dark:text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>RSK ENTERPRISES ERP</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white mt-1">
            Select Active Workspace
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base max-w-lg">
            Choose your operating environment to access tailored modules, inventory logs, and analytics.
          </p>
        </div>

        {/* Workspaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Trading Card */}
          <div
            onClick={() => handleSelect("trading")}
            className="group relative flex flex-col justify-between p-8 bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/60 rounded-3xl backdrop-blur-xl shadow-lg dark:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1.5"
          >
            <div className="flex flex-col gap-6 relative z-10">
              <div className="flex justify-between items-start">
                <div className="p-4 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-7 h-7 stroke-[2.2]" />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                  Distribution & Trading
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  Trading Workspace
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                  Manage vendor purchases, billing, customer sales, and trading stock balances.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Purchases & Vendor Invoices</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Sales Billing & Outstanding Balances</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Customer Receipts & Supplier Payments</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Trading Inventory & HSN Ledger</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 relative z-10">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Launch Module</span>
              <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 group-hover:translate-x-1.5 transition-all">
                <span>Enter Trading</span>
                <ArrowRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>

          {/* Manufacturing Card */}
          <div
            onClick={() => handleSelect("manufacturing")}
            className="group relative flex flex-col justify-between p-8 bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 rounded-3xl backdrop-blur-xl shadow-lg dark:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1.5"
          >
            <div className="flex flex-col gap-6 relative z-10">
              <div className="flex justify-between items-start">
                <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 group-hover:scale-110 transition-transform">
                  <Factory className="w-7 h-7 stroke-[2.2]" />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                  Cups & Tissues Production
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  Manufacturing Workspace
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                  Log factory operational expenses, production output, and net P&L reports.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Daily Manufacturing Expenses & Fuel</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Log Paper Roll & Cup Production Entries</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Manufacturing Sales & Revenue Revenue</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Profit & Loss Financial Analytics</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 relative z-10">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Launch Module</span>
              <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 group-hover:translate-x-1.5 transition-all">
                <span>Enter Manufacturing</span>
                <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:px-6 shadow-sm backdrop-blur-md">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-inner">
                <User className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Authenticated User</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{user.email}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>RSK Enterprises Session Active</span>
            </div>
          )}

          <Button
            variant="danger"
            onPress={handleSignOut}
            className="w-full sm:w-auto font-bold rounded-xl justify-center gap-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-xs px-4 h-10"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    </div>
  );
}


