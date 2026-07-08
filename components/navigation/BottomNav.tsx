"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/stores/useUIStore";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { LayoutDashboard, TrendingUp, Factory, Package, Menu, ShoppingCart, Layers, CreditCard } from "lucide-react";
import toast from "react-hot-toast";

export default function BottomNav() {
  const pathname = usePathname();
  const { toggleSidebar } = useUIStore();
  const { currentWorkspace } = useWorkspaceStore();

  const activeWorkspace = pathname.startsWith("/trading")
    ? "trading"
    : pathname.startsWith("/manufacturing")
    ? "manufacturing"
    : currentWorkspace;

  const tradingItems = [
    { label: "Home", href: "/trading", icon: LayoutDashboard },
    { label: "Purchases", href: "/trading/purchases", icon: ShoppingCart },
    { label: "Sales", href: "/trading/sales", icon: TrendingUp },
    { label: "Payments", href: "/trading/payments", icon: CreditCard },
  ];

  const manufacturingItems = [
    { label: "Home", href: "/manufacturing", icon: LayoutDashboard },
    { label: "Production", href: "/manufacturing/production", icon: Factory },
  ];

  const items = activeWorkspace === "manufacturing" ? manufacturingItems : tradingItems;

  const handleDevClick = (label: string) => {
    toast.success(`${label} module will be connected in subsequent development phases!`);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-35 h-16 bg-white border-t border-slate-100 dark:bg-slate-950 dark:border-slate-900 flex items-center justify-around px-4 pb-safe md:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        const content = (
          <div
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-200 ${
              isActive
                ? "text-slate-900 dark:text-slate-50 font-semibold scale-105"
                : "text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
            }`}
          >
            <Icon className="w-5.5 h-5.5 mb-0.5" />
            <span className="text-[10px] tracking-wide">{item.label}</span>
          </div>
        );

        return (
          <Link key={item.href} href={item.href}>
            {content}
          </Link>
        );
      })}
      {/* Menu Drawer Toggle */}
      <button
        onClick={toggleSidebar}
        className="flex flex-col items-center justify-center w-16 h-12 rounded-xl text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300 focus:outline-none"
        aria-label="Toggle navigation drawer"
      >
        <Menu className="w-5.5 h-5.5 mb-0.5" />
        <span className="text-[10px] tracking-wide">Menu</span>
      </button>
    </div>
  );
}
