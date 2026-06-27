import { Card, CardHeader, CardContent, Button } from "@heroui/react";
import { HelpCircle, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[70vh] px-4 py-16">
      <Card className="w-full max-w-md shadow-xl border border-slate-100 dark:border-slate-800">
        <CardHeader className="flex flex-col gap-2 items-center pb-0 pt-6">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl dark:bg-amber-950/30 dark:text-amber-400">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 mt-2">
            Page Not Found (404)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs">
            The page you are looking for does not exist or has been moved.
          </p>
        </CardHeader>
        <CardContent className="py-6 px-6">
          <Link href="/">
            <Button
              variant="primary"
              className="w-full font-semibold flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
