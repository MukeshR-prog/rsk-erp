"use client";

import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import EmptyState from "@/components/ui/EmptyState";
import { Button } from "@heroui/react";
import { Plus, TrendingUp, ShoppingBag, Factory, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface TransactionMock {
  id: string;
  reference: string;
  type: "Sale" | "Purchase";
  party: string;
  amount: number;
  status: string;
}

const mockTransactions: TransactionMock[] = [
  {
    id: "tx-1",
    reference: "INV-2026-0001",
    type: "Sale",
    party: "Rajesh Traders",
    amount: 15400,
    status: "Partially Paid",
  },
  {
    id: "tx-2",
    reference: "PUR-2026-0001",
    type: "Purchase",
    party: "Sri Krishna Paper Mills",
    amount: 45000,
    status: "Unpaid",
  },
  {
    id: "tx-3",
    reference: "INV-2026-0002",
    type: "Sale",
    party: "Murugan Agencies",
    amount: 8500,
    status: "Paid",
  },
];

export default function DashboardPage() {
  const tableHeaders = [
    { key: "reference", label: "Reference" },
    { key: "type", label: "Type" },
    { key: "party", label: "Customer/Supplier" },
    { key: "amount", label: "Amount" },
    { key: "status", label: "Payment Status" },
  ];

  const renderCell = (item: TransactionMock, columnKey: string) => {
    switch (columnKey) {
      case "amount":
        return <span className="font-semibold">₹{item.amount.toLocaleString()}</span>;
      case "status": {
        const isPaid = item.status === "Paid";
        const isPartial = item.status === "Partially Paid";
        return (
          <span
            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isPaid
                ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                : isPartial
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
            }`}
          >
            {item.status}
          </span>
        );
      }
      default:
        return <span>{String(item[columnKey as keyof TransactionMock])}</span>;
    }
  };

  const renderMobileCard = (item: TransactionMock) => {
    const isPaid = item.status === "Paid";
    const isPartial = item.status === "Partially Paid";

    return (
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              {item.type}
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-50">{item.reference}</span>
          </div>
          <span className="font-bold text-slate-900 dark:text-slate-50">
            ₹{item.amount.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between items-center border-t border-slate-50 dark:border-slate-900 pt-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">{item.party}</span>
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isPaid
                ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                : isPartial
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
            }`}
          >
            {item.status}
          </span>
        </div>
      </div>
    );
  };

  const handleShortcutClick = (actionName: string) => {
    toast.success(`${actionName} module is under development and will be connected soon!`);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner Header */}
      <Header
        title="RSK Enterprises Dashboard"
        subtitle="Digitized business logbooks & analytics"
        action={
          <Button
            variant="primary"
            onPress={() => handleShortcutClick("Quick Sale")}
            className="w-full sm:w-auto font-bold rounded-xl"
            size="md"
          >
            <Plus className="w-4.5 h-4.5 mr-1.5" />
            <span>New Sales Invoice</span>
          </Button>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card
          className="border-l-4 border-l-slate-900 dark:border-l-slate-50"
          title="Today's Sales"
          subtitle="Gross sales orders registered today"
        >
          <div className="flex items-center gap-2 mt-1">
            <div className="p-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-800 dark:text-slate-200">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              ₹23,900
            </span>
          </div>
        </Card>

        <Card
          className="border-l-4 border-l-emerald-500"
          title="Today's Production"
          subtitle="Total finished goods cases produced"
        >
          <div className="flex items-center gap-2 mt-1">
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg text-emerald-600 dark:text-emerald-400">
              <Factory className="w-4.5 h-4.5" />
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              45 Cases
            </span>
          </div>
        </Card>

        <Card
          className="border-l-4 border-l-amber-500"
          title="Receivables"
          subtitle="Pending customer credits to collect"
        >
          <div className="flex items-center gap-2 mt-1">
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-amber-600 dark:text-amber-400">
              <ShoppingBag className="w-4.5 h-4.5" />
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              ₹3,12,000
            </span>
          </div>
        </Card>

        <Card
          className="border-l-4 border-l-red-500"
          title="Low Stock"
          subtitle="Items below safety threshold levels"
        >
          <div className="flex items-center gap-2 mt-1">
            <div className="p-1.5 bg-red-50 dark:bg-red-950/20 rounded-lg text-red-600 dark:text-red-400">
              <AlertCircle className="w-4.5 h-4.5" />
            </div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 animate-pulse">
              3 Items
            </span>
          </div>
        </Card>
      </div>

      {/* Quick Action Shortcuts Panel */}
      <Card title="Quick Tasks" subtitle="One-tap navigation shortcuts for common operations">
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          <Button
            variant="tertiary"
            className="h-16 flex flex-col items-center justify-center gap-1 rounded-2xl"
            onPress={() => handleShortcutClick("New Sale")}
          >
            <TrendingUp className="w-5.5 h-5.5 text-slate-900 dark:text-white" />
            <span className="text-xs font-semibold">New Sale</span>
          </Button>

          <Button
            variant="tertiary"
            className="h-16 flex flex-col items-center justify-center gap-1 rounded-2xl"
            onPress={() => handleShortcutClick("New Purchase")}
          >
            <ShoppingBag className="w-5.5 h-5.5 text-slate-900 dark:text-white" />
            <span className="text-xs font-semibold">New Purchase</span>
          </Button>

          <Button
            variant="tertiary"
            className="h-16 flex flex-col items-center justify-center gap-1 rounded-2xl"
            onPress={() => handleShortcutClick("New Production Batch")}
          >
            <Factory className="w-5.5 h-5.5 text-slate-900 dark:text-white" />
            <span className="text-xs font-semibold">Log Batch</span>
          </Button>

          <Button
            variant="tertiary"
            className="h-16 flex flex-col items-center justify-center gap-1 rounded-2xl"
            onPress={() => handleShortcutClick("Add New Contact")}
          >
            <Plus className="w-5.5 h-5.5 text-slate-900 dark:text-white" />
            <span className="text-xs font-semibold">Add Contact</span>
          </Button>
        </div>
      </Card>

      {/* Recent Activity Table Card */}
      <Card title="Recent Transactions" subtitle="Logs of recent sales invoices and vendor bills">
        <Table<TransactionMock>
          headers={tableHeaders}
          data={mockTransactions}
          renderCell={renderCell}
          renderMobileCard={renderMobileCard}
          keyField="id"
          onRowClick={(item) => handleShortcutClick(`View detail of ${item.reference}`)}
          emptyState={<EmptyState title="No transactions recorded" description="Sales or purchases recorded today will show up here." />}
        />
      </Card>
    </div>
  );
}
