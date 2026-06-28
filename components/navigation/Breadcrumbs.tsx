"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { useUIStore } from "@/stores/useUIStore";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";

export default function Breadcrumbs() {
  const pathname = usePathname();
  const { breadcrumbs: customBreadcrumbs } = useUIStore();
  const { currentWorkspace } = useWorkspaceStore();

  if (pathname === "/" || pathname === "/login" || pathname === "/workspace") return null;

  // Custom static breadcrumbs overrides
  if (customBreadcrumbs && customBreadcrumbs.length > 0) {
    return (
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
        <Link
          href="/"
          className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
        </Link>
        {customBreadcrumbs.map((crumb, idx) => (
          <div key={crumb.href} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
            <Link
              href={crumb.href}
              className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors ${
                idx === customBreadcrumbs.length - 1
                  ? "font-semibold text-slate-900 dark:text-slate-50 pointer-events-none"
                  : ""
              }`}
            >
              {crumb.label}
            </Link>
          </div>
        ))}
      </nav>
    );
  }

  // Otherwise, split pathname and build paths dynamically, prepending workspace context if needed
  const paths = pathname.split("/").filter(Boolean);
  
  const crumbs: { label: string; href: string }[] = [];

  const shouldPrependContext = pathname.startsWith("/master-data") || pathname.startsWith("/settings");
  
  if (shouldPrependContext && currentWorkspace) {
    crumbs.push({
      label: currentWorkspace === "trading" ? "Trading" : "Manufacturing",
      href: currentWorkspace === "trading" ? "/trading" : "/manufacturing",
    });
  }

  paths.forEach((path, idx) => {
    const href = `/${paths.slice(0, idx + 1).join("/")}`;
    const label = path
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
    crumbs.push({ label, href });
  });

  return (
    <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
      <Link
        href="/"
        className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;

        return (
          <div key={crumb.href + "-" + idx} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
            <Link
              href={crumb.href}
              className={`hover:text-slate-900 dark:hover:text-slate-100 transition-colors ${
                isLast ? "font-semibold text-slate-900 dark:text-slate-50 pointer-events-none" : ""
              }`}
            >
              {crumb.label}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}
