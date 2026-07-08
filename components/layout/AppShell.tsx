"use client";

import { usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import Sidebar from "@/components/navigation/Sidebar";
import TopNav from "@/components/navigation/TopNav";
import BottomNav from "@/components/navigation/BottomNav";
import GlobalLoading from "@/components/ui/GlobalLoading";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname?.startsWith("/auth/");
  const isWorkspaceSelectPage = pathname === "/workspace";

  if (isAuthPage || isWorkspaceSelectPage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
        {children}
        <Toaster position="top-center" reverseOrder={false} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      {/* Navigation sidebar */}
      <Sidebar />

      {/* Main app layout area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-20 sm:pb-24 md:pb-6 focus:outline-none scroll-smooth">
          {children}
        </main>
        <BottomNav />
      </div>

      {/* Fullscreen loading overlays */}
      <GlobalLoading />

      {/* Alerts toast notifications */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          className: "dark:bg-slate-900 dark:text-slate-100 dark:border dark:border-slate-800 text-sm font-semibold rounded-2xl shadow-xl",
          duration: 4000,
        }}
      />
    </div>
  );
}
