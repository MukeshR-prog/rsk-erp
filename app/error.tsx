"use client";

import { useEffect } from "react";
import { Card, CardHeader, CardContent, Button } from "@heroui/react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root boundary caught error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center min-h-[70vh] px-4 py-16">
      <Card className="w-full max-w-md shadow-xl border border-slate-100 dark:border-slate-800">
        <CardHeader className="flex flex-col gap-2 items-center pb-0 pt-6">
          <div className="p-3 bg-red-100 text-red-600 rounded-2xl dark:bg-red-950/30 dark:text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-2">
            Something went wrong!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs">
            An unexpected error occurred while rendering this view.
          </p>
        </CardHeader>
        <CardContent className="py-6 px-6 flex flex-col gap-4">
          {error.message && (
            <div className="p-3 text-xs bg-slate-50 border border-slate-100 rounded-lg font-mono text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 break-all max-h-24 overflow-y-auto">
              {error.message}
            </div>
          )}
          <div className="flex gap-3">
            <Button
              onPress={() => reset()}
              variant="primary"
              className="flex-1 font-semibold flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry</span>
            </Button>
            <Link href="/" className="flex-1">
              <Button
                variant="outline"
                className="w-full font-semibold flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>Go Home</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
