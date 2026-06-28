"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";

export default function RootPage() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspaceStore();

  useEffect(() => {
    // Mount-time client-side redirection to the active workspace
    if (currentWorkspace === "trading") {
      router.replace("/trading");
    } else if (currentWorkspace === "manufacturing") {
      router.replace("/manufacturing");
    } else {
      router.replace("/workspace");
    }
  }, [currentWorkspace, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-slate-350 border-t-slate-900 dark:border-slate-800 dark:border-t-slate-100 animate-spin" />
        <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase">
          Loading Workspace...
        </span>
      </div>
    </div>
  );
}
