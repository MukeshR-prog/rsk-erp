"use client";

import { useEffect, useState, useTransition } from "react";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@heroui/react";
import { Plus, Trash2, Calendar, DollarSign, X } from "lucide-react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import {
  getManufacturingSalesAction,
  createManufacturingSaleAction,
  deleteManufacturingSaleAction,
} from "@/features/manufacturing/actions";
import { CurrencyInput } from "@/components/ui/form/CurrencyInput";

export default function ManufacturingSalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form State
  const [amount, setAmount] = useState<number | "">(0);
  const [saleDate, setSaleDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [description, setDescription] = useState("");

  const loadSales = async () => {
    try {
      setLoading(true);
      const res = await getManufacturingSalesAction({ page, pageSize: 10 });
      if (res.success && res.data) {
        setSales(res.data.items);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      } else {
        toast.error(res.error || "Failed to load sales history");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading sales data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [page]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid sales amount");
      return;
    }

    startTransition(async () => {
      const res = await createManufacturingSaleAction({
        amount: Number(amount),
        saleDate,
        description,
      });

      if (res.success) {
        toast.success("Manufacturing sale entry recorded!");
        setIsModalOpen(false);
        setAmount(0);
        setDescription("");
        setSaleDate(dayjs().format("YYYY-MM-DD"));
        loadSales();
      } else {
        toast.error(res.error || "Failed to save sale entry");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this sales entry?")) return;

    startTransition(async () => {
      const res = await deleteManufacturingSaleAction(id);
      if (res.success) {
        toast.success("Sales entry deleted!");
        loadSales();
      } else {
        toast.error(res.error || "Failed to delete entry");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Manufacturing Sales Entry"
        subtitle="Record total manufacturing revenue without inventory tracking"
        action={
          <Button
            variant="primary"
            onPress={() => setIsModalOpen(true)}
            className="font-bold rounded-xl"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Sales Entry</span>
          </Button>
        }
      />

      <Card title="Recorded Sales Entries" subtitle="Chronological list of manufacturing revenues">
        {loading ? (
          <TableSkeleton rows={5} />
        ) : sales.length === 0 ? (
          <div className="text-center py-10 text-slate-400 font-semibold">
            No manufacturing sales entries recorded yet.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Table
              headers={[
                { key: "saleDate", label: "Date" },
                { key: "amount", label: "Sales Amount", className: "text-right" },
                { key: "description", label: "Description" },
                { key: "actions", label: "Actions", className: "text-center" },
              ]}
              data={sales}
              keyField="id"
              renderCell={(item: any, key: string) => {
                if (key === "saleDate") {
                  return (
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {dayjs(item.saleDate).format("DD MMM YYYY")}
                    </span>
                  );
                }
                if (key === "amount") {
                  return (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  );
                }
                if (key === "description") {
                  return <span>{item.description || "—"}</span>;
                }
                if (key === "actions") {
                  return (
                    <div className="flex items-center justify-center">
                      <Button
                        variant="tertiary"
                        size="sm"
                        className="h-8 w-8 min-w-0 p-0 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500"
                        onPress={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                }
                return <span>{item[key]}</span>;
              }}
            />

            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                <span className="text-xs text-slate-500">
                  Showing {(page - 1) * 10 + 1} - {Math.min(page * 10, total)} of {total} entries
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="tertiary"
                    size="sm"
                    isDisabled={page === 1}
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="tertiary"
                    size="sm"
                    isDisabled={page === totalPages}
                    onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Slide-over Drawer Form */}
      <div
        className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
          isModalOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div
          onClick={() => setIsModalOpen(false)}
          className={`absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
            isModalOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          className={`relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between transform transition-transform duration-300 ease-out ${
            isModalOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              Log Manufacturing Sales
            </span>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-350">
                Entry Date *
              </label>
              <input
                type="date"
                required
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-850 dark:bg-slate-950 dark:focus:border-slate-100 outline-none text-sm font-semibold"
              />
            </div>

            <CurrencyInput
              label="Total Sales Amount *"
              value={amount}
              onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-350">
                Description (Optional)
              </label>
              <textarea
                placeholder="e.g. Total paper roll manufacturing sales for July"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-850 dark:bg-slate-950 dark:focus:border-slate-100 outline-none text-sm font-medium"
              />
            </div>

            <div className="mt-auto pt-6 flex gap-3 justify-end">
              <Button
                type="button"
                variant="tertiary"
                onPress={() => setIsModalOpen(false)}
                className="font-bold border border-slate-150 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isPending={isPending}
                className="font-bold rounded-xl px-5"
              >
                Save Entry
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
