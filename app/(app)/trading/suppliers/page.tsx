"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@heroui/react";
import { Search, Plus, Phone, MapPin, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { getContacts } from "@/features/master-data/contacts/actions";
import ContactFormDrawer from "@/components/erp/contacts/ContactFormDrawer";

interface ContactData {
  id: string;
  name: string;
  type: "SUPPLIER";
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  gstNumber?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  openingBalance: number;
  outstandingBalance: number;
  isActive: boolean;
}

function SuppliersPageContent() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<ContactData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadSuppliers = () => {
    startTransition(async () => {
      const res = await getContacts({
        search,
        page,
        pageSize: 10,
        showInactive: false,
        type: "SUPPLIER",
      });

      if (res.success && res.data) {
        setSuppliers(res.data as any);
        setTotal(res.meta.total);
        setTotalPages(res.meta.totalPages);
      } else {
        toast.error(res.error || "Failed to load suppliers");
      }
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSuppliers();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, search]);

  const tableHeaders = [
    { key: "name", label: "Supplier Name" },
    { key: "contactPerson", label: "Contact Person" },
    { key: "phone", label: "Phone" },
    { key: "outstandingBalance", label: "Outstanding Due", className: "text-right" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions", className: "w-28 text-right" },
  ];

  const renderCell = (item: ContactData, columnKey: string) => {
    switch (columnKey) {
      case "outstandingBalance":
        return <span className={`font-bold ${item.outstandingBalance > 0 ? "text-red-600" : "text-slate-700"}`}>₹{item.outstandingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>;
      case "status":
        return (
          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700">
            Active
          </span>
        );
      case "actions":
        return (
          <div className="flex gap-1.5 justify-end">
            <Button
              size="sm"
              variant="ghost"
              onPress={() => router.push(`/trading/suppliers/${item.id}`)}
              className="min-w-0 px-2.5 py-1 text-slate-700 dark:text-slate-300 border-none shadow-none hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
            >
              <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
              <span>Details</span>
            </Button>
          </div>
        );
      default:
        return <span>{String(item[columnKey as keyof ContactData] || "—")}</span>;
    }
  };

  const renderMobileCard = (item: ContactData) => {
    return (
      <div className="flex flex-col gap-2.5 w-full">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 dark:text-slate-50 text-base">{item.name}</span>
            {item.contactPerson && <span className="text-xs text-slate-400 font-semibold mt-0.5">Person: {item.contactPerson}</span>}
          </div>
          <span className={`font-bold text-sm ${item.outstandingBalance > 0 ? "text-red-600" : "text-slate-700"}`}>
            Due: ₹{item.outstandingBalance.toLocaleString()}
          </span>
        </div>

        <div className="flex flex-col gap-1 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2 font-semibold">
          {item.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{item.phone}</span>
            </div>
          )}
          {item.city && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{item.city}, {item.state || ""}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-50 dark:border-slate-800 pt-2 mt-1">
          <Button
            size="sm"
            variant="ghost"
            onPress={() => router.push(`/trading/suppliers/${item.id}`)}
            className="border-none min-w-0 p-1 text-slate-700 dark:text-slate-300 font-bold"
          >
            <Eye className="w-4 h-4 mr-1 text-slate-500" />
            <span>Open Profile</span>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3.5 sm:gap-6">
      <Header
        title="Suppliers directory"
        subtitle="Manage finished goods suppliers, outstanding bills and payment receipts"
        action={
          <Button
            variant="primary"
            onPress={() => setIsFormOpen(true)}
            className="w-full sm:w-auto font-bold rounded-xl h-11 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-50 dark:text-slate-950 border-none"
            size="md"
          >
            <Plus className="w-4.5 h-4.5 mr-1.5" />
            <span>Add Supplier</span>
          </Button>
        }
      />

      <div className="flex justify-end items-center">
        {/* Automatic Live Search Input */}
        <div className="relative flex items-center w-full md:max-w-xs">
          <Search className="absolute left-3.5 text-slate-400 w-4.5 h-4.5" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10 pr-4 py-2 w-full rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-800 dark:bg-slate-950 dark:focus:border-slate-100 outline-none text-sm transition-all font-semibold"
          />
        </div>
      </div>

      <Card>
        {isPending ? (
          <TableSkeleton rows={5} />
        ) : (
          <Table<ContactData>
            headers={tableHeaders}
            data={suppliers}
            renderCell={renderCell}
            renderMobileCard={renderMobileCard}
            keyField="id"
            onRowClick={(item) => router.push(`/trading/suppliers/${item.id}`)}
            emptyState={
              <div className="py-12 text-center text-slate-500 font-medium">
                No active suppliers found. Click "Add Supplier" to register one.
              </div>
            }
          />
        )}

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <span className="text-xs text-slate-500 dark:text-slate-400">Total items: {total}</span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                isDisabled={page === 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                isDisabled={page === totalPages}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Slide-over Drawer Form */}
      <ContactFormDrawer
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        defaultType="SUPPLIER"
        onSuccess={loadSuppliers}
      />
    </div>
  );
}

export default function SuppliersPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-slate-500">Loading suppliers...</div>}>
      <SuppliersPageContent />
    </Suspense>
  );
}
