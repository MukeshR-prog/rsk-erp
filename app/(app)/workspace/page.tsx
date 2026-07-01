"use client";

import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { useAuthStore } from "@/stores/useAuthStore";
import Card from "@/components/ui/Card";
import { Button } from "@heroui/react";
import { Briefcase, Factory, LogOut, ArrowRight, User } from "lucide-react";
import toast from "react-hot-toast";

export default function WorkspaceSelectPage() {
  const router = useRouter();
  const { setWorkspace } = useWorkspaceStore();
  const { user, signOut } = useAuthStore();

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
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(0,0,0,0))] pointer-events-none" />

      <div className="z-10 w-full max-w-4xl flex flex-col gap-8">
        {/* Title Section */}
        <div className="text-center flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
            RSK Enterprises ERP
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base">
            Choose a workspace context to start logging logs and manufacturing runs
          </p>
        </div>

        {/* Workspaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Trading Card */}
          <div
            onClick={() => handleSelect("trading")}
            className="group relative flex flex-col justify-between p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl hover:shadow-2xl hover:border-slate-900 dark:hover:border-slate-150 transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-100 dark:bg-slate-800/50 rounded-bl-full flex items-center justify-center opacity-30 group-hover:scale-110 transition-transform" />
            
            <div className="flex flex-col gap-4">
              <div className="p-3 bg-slate-900 text-white rounded-2xl dark:bg-slate-50 dark:text-slate-900 w-12 h-12 flex items-center justify-center shadow-md">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  Trading Workspace
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">
                  Distribution & Trading Business
                </p>
              </div>
              <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-2 mt-2 font-medium">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-slate-50" />
                  <span>Purchases & Vendor Invoices</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-slate-50" />
                  <span>Sales & Customer Billing</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-slate-50" />
                  <span>Collections & Vendor Payments</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-slate-50" />
                  <span>Trading Inventory Tracking</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center gap-1 text-sm font-bold text-slate-900 dark:text-slate-50 mt-6 group-hover:translate-x-1.5 transition-transform">
              <span>Open Trading Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* Manufacturing Card */}
          <div
            onClick={() => handleSelect("manufacturing")}
            className="group relative flex flex-col justify-between p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl hover:shadow-2xl hover:border-slate-900 dark:hover:border-slate-150 transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 dark:bg-emerald-950/20 rounded-bl-full flex items-center justify-center opacity-30 group-hover:scale-110 transition-transform" />

            <div className="flex flex-col gap-4">
              <div className="p-3 bg-emerald-600 text-white rounded-2xl dark:bg-emerald-450 dark:text-slate-950 w-12 h-12 flex items-center justify-center shadow-md">
                <Factory className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  Manufacturing Workspace
                </h2>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-wider mt-1">
                  Cups & Tissues Production
                </p>
              </div>
              <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-2 mt-2 font-medium">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Daily Manufacturing Expenses</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Log Production Entries</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Finished Goods Stock</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Profit & Loss Analysis</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center gap-1 text-sm font-bold text-slate-900 dark:text-slate-50 mt-6 group-hover:translate-x-1.5 transition-transform">
              <span>Open Manufacturing Dashboard</span>
              <ArrowRight className="w-4 h-4 text-slate-900 dark:text-slate-50" />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 border-t border-slate-200 dark:border-slate-800 pt-6">
          {user && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold text-slate-650 dark:text-slate-350">
                Logged in as <span className="font-bold text-slate-900 dark:text-slate-50">{user.email}</span>
              </span>
            </div>
          )}
          <Button
            variant="danger"
            onPress={handleSignOut}
            className="w-full sm:w-auto font-bold rounded-xl justify-center gap-2 bg-red-50 text-red-650 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
