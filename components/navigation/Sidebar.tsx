"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUIStore } from "@/stores/useUIStore";
import {
  LayoutDashboard,
  Users,
  Package,
  Factory,
  TrendingUp,
  ShoppingCart,
  BookOpen,
  BarChart3,
  LogOut,
  X,
  UserCheck,
  FolderOpen,
  Ruler,
  Receipt,
} from "lucide-react";
import { Button } from "@heroui/react";
import toast from "react-hot-toast";

export const CORE_NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Sales (Billing)", href: "/sales", icon: TrendingUp },
  { label: "Purchases", href: "/purchases", icon: ShoppingCart },
  { label: "Manufacturing", href: "/manufacturing", icon: Factory },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Cash & Bank Logs", href: "/ledgers", icon: BookOpen },
  { label: "Reports", href: "/reports", icon: BarChart3 },
];

export const MASTER_DATA_ITEMS = [
  { label: "Contacts Catalog", href: "/master-data/contacts", icon: Users },
  { label: "Products Catalog", href: "/master-data/products", icon: Package },
  { label: "Product Categories", href: "/master-data/product-categories", icon: FolderOpen },
  { label: "Units of Measure", href: "/master-data/units", icon: Ruler },
  { label: "Expense Categories", href: "/master-data/expense-categories", icon: Receipt },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuthStore();
  const { sidebarOpen, closeSidebar } = useUIStore();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Successfully signed out");
    closeSidebar();
  };

  const navLinks = (
    <nav className="flex flex-col gap-6 px-3 py-4 flex-1 overflow-y-auto">
      {/* Operations Group */}
      <div className="flex flex-col gap-1">
        <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
          Operations
        </p>
        {CORE_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href) && !pathname.startsWith("/master-data");

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-205 ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-50"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Master Data Group */}
      <div className="flex flex-col gap-1">
        <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
          Master Data
        </p>
        {MASTER_DATA_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-205 ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-50"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-white border-r border-slate-100 dark:bg-slate-950 dark:border-slate-900 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:sticky`}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 dark:border-slate-900 flex-shrink-0">
          <Link
            href="/"
            onClick={closeSidebar}
            className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-slate-50"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-slate-50 flex items-center justify-center text-white dark:text-slate-900 font-extrabold text-sm shadow-md">
              RS
            </div>
            <span className="tracking-tight">RSK ERP</span>
          </Link>
          <button
            onClick={closeSidebar}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 dark:text-slate-400 md:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        {navLinks}

        {/* User Card & Sign Out */}
        {user && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-900 flex-shrink-0">
            <div className="flex items-center gap-3 px-2 py-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-300">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Owner Account
                </p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <Button
              onPress={handleSignOut}
              variant="danger"
              className="w-full justify-start gap-3 rounded-xl font-medium text-red-600 dark:text-red-400"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
