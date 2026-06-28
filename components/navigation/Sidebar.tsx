"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUIStore } from "@/stores/useUIStore";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
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
  ArrowLeftRight,
  Settings,
  ChevronDown,
  Layers,
  Sparkles,
  TrendingDown,
  Briefcase
} from "lucide-react";
import { Button } from "@heroui/react";
import toast from "react-hot-toast";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const { sidebarOpen, closeSidebar } = useUIStore();
  const { currentWorkspace, setWorkspace } = useWorkspaceStore();

  const [masterDataOpen, setMasterDataOpen] = useState(true);

  // Derive the active workspace from routing path, fallback to Zustand
  const activeWorkspace = pathname.startsWith("/trading")
    ? "trading"
    : pathname.startsWith("/manufacturing")
    ? "manufacturing"
    : currentWorkspace;

  // Keep Zustand store in sync when path changes
  useEffect(() => {
    if (pathname.startsWith("/trading")) {
      setWorkspace("trading");
    } else if (pathname.startsWith("/manufacturing")) {
      setWorkspace("manufacturing");
    }
  }, [pathname, setWorkspace]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Successfully signed out");
    closeSidebar();
    router.replace("/login");
  };

  const handleSwitchWorkspace = () => {
    closeSidebar();
    router.push("/workspace");
  };

  const handleDevClick = (label: string) => {
    toast.success(`${label} module is under development and will be connected in subsequent phases!`);
  };

  // Define Navigation Items based on Workspace
  const tradingItems = [
    { label: "Trading Dashboard", href: "/trading", icon: LayoutDashboard },
    { label: "Customers", href: "/master-data/contacts", icon: Users },
    { label: "Suppliers", href: "/master-data/contacts", icon: Users },
    { label: "Purchases", href: "/trading/purchases", icon: ShoppingCart, click: () => handleDevClick("Purchases") },
    { label: "Purchase Returns", href: "/trading/purchasereturns", icon: ShoppingCart, click: () => handleDevClick("Purchase Returns") },
    { label: "Sales", href: "/trading/sales", icon: TrendingUp, click: () => handleDevClick("Sales") },
    { label: "Sales Returns", href: "/trading/salesreturns", icon: TrendingUp, click: () => handleDevClick("Sales Returns") },
    { label: "Payments", href: "/trading/payments", icon: Receipt, click: () => handleDevClick("Payments") },
    { label: "Inventory", href: "/trading/inventory", icon: Package, click: () => handleDevClick("Trading Inventory") },
    { label: "Cash Book", href: "/trading/cashbook", icon: BookOpen, click: () => handleDevClick("Cash Book") },
    { label: "Reports", href: "/trading/reports", icon: BarChart3, click: () => handleDevClick("Trading Reports") },
  ];

  const manufacturingItems = [
    { label: "Manufacturing Dashboard", href: "/manufacturing", icon: LayoutDashboard },
    { label: "BOM Recipes", href: "/manufacturing/bom", icon: Layers, click: () => handleDevClick("Bill of Materials") },
    { label: "Raw Materials", href: "/master-data/products", icon: Sparkles },
    { label: "Finished Goods", href: "/master-data/products", icon: Factory },
    { label: "Production Batch", href: "/manufacturing/batches", icon: WrenchIcon, click: () => handleDevClick("Production Batch") },
    { label: "Production Expenses", href: "/manufacturing/expenses", icon: TrendingDown, click: () => handleDevClick("Production Expenses") },
    { label: "Manufacturing Reports", href: "/manufacturing/reports", icon: BarChart3, click: () => handleDevClick("Manufacturing Reports") },
  ];

  const masterDataItems = [
    { label: "Contacts", href: "/master-data/contacts", icon: Users },
    { label: "Products", href: "/master-data/products", icon: Package },
    { label: "Product Categories", href: "/master-data/product-categories", icon: FolderOpen },
    { label: "Units of Measure", href: "/master-data/units", icon: Ruler },
    { label: "Expense Categories", href: "/master-data/expense-categories", icon: Receipt },
  ];

  const menuItems = activeWorkspace === "manufacturing" ? manufacturingItems : tradingItems;

  const navLinks = (
    <nav className="flex flex-col gap-5 px-3 py-4 flex-1 overflow-y-auto">
      {/* Workspace Header Indicator */}
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl mb-1 flex items-center gap-2.5">
        <div className={`w-2.5 h-2.5 rounded-full ${activeWorkspace === "manufacturing" ? "bg-emerald-500 animate-pulse" : "bg-slate-900 dark:bg-slate-50 animate-pulse"}`} />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
          {activeWorkspace === "manufacturing" ? "Manufacturing" : "Trading"} Workspace
        </span>
      </div>

      {/* Operations Group */}
      <div className="flex flex-col gap-1">
        <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
          Operations
        </p>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          const content = (
            <div
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-205 ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900 shadow-sm"
                  : "text-slate-650 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-50"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </div>
          );

          if (item.click) {
            return (
              <button
                key={item.label}
                onClick={() => {
                  closeSidebar();
                  if (item.click) item.click();
                }}
                className="w-full text-left"
              >
                {content}
              </button>
            );
          }

          return (
            <Link key={item.href} href={item.href} onClick={closeSidebar}>
              {content}
            </Link>
          );
        })}
      </div>

      {/* Shared Section */}
      <div className="flex flex-col gap-1 border-t border-slate-100 dark:border-slate-900 pt-4">
        <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
          Shared
        </p>

        {/* Collapsible Master Data Link */}
        <div>
          <button
            onClick={() => setMasterDataOpen(!masterDataOpen)}
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-650 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-50"
          >
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 flex-shrink-0" />
              <span>Master Data</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${masterDataOpen ? "rotate-180" : ""}`} />
          </button>

          {masterDataOpen && (
            <div className="pl-6 flex flex-col gap-1 mt-1 border-l border-slate-100 dark:border-slate-900 ml-6">
              {masterDataItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link key={item.href} href={item.href} onClick={closeSidebar}>
                    <div
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-205 ${
                        isActive
                          ? "bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-white"
                          : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Settings */}
        <Link href="/settings" onClick={() => { closeSidebar(); handleDevClick("Settings"); }}>
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-650 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-50">
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span>Settings</span>
          </div>
        </Link>

        {/* Switch Workspace */}
        <button
          onClick={handleSwitchWorkspace}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-605 text-left w-full hover:bg-slate-50 hover:text-slate-900 dark:text-slate-405 dark:hover:bg-slate-900 dark:hover:text-slate-50"
        >
          <ArrowLeftRight className="w-5 h-5 flex-shrink-0" />
          <span>Switch Workspace</span>
        </button>
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
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-350">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Owner Account
                </p>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <Button
              onPress={handleSignOut}
              variant="danger"
              className="w-full justify-start gap-3 rounded-xl font-medium text-red-650 dark:text-red-400"
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

// Simple placeholder WrenchIcon
function WrenchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}
