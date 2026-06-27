"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useUIStore } from "@/stores/useUIStore";
import { Menu, Sun, Moon, Sparkles } from "lucide-react";
import { Button } from "@heroui/react";
import Breadcrumbs from "./Breadcrumbs";

export default function TopNav() {
  const { toggleSidebar } = useUIStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting until mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white/85 px-4 backdrop-blur-md dark:border-slate-900 dark:bg-slate-950/85 md:px-6 flex-shrink-0">
      {/* Left side: Hamburger (Mobile) + Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-50 focus:outline-none md:hidden"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5.5 h-5.5" />
        </button>
        <div className="hidden md:block">
          <Breadcrumbs />
        </div>
      </div>

      {/* Right side: App Branding (Mobile) + Theme Switcher */}
      <div className="flex items-center gap-3">
        <div className="md:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-white dark:bg-slate-50 dark:text-slate-900 text-xs font-bold shadow-sm">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>RSK ERP</span>
        </div>

        {mounted && (
          <Button
            variant="ghost"
            onPress={toggleTheme}
            aria-label="Toggle visual theme"
            className="text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-50 w-10 h-10 p-0 rounded-xl min-w-0 flex items-center justify-center"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        )}
      </div>
    </header>
  );
}
