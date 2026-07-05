"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  Button,
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { Search, Plus, Edit, Trash2, Calendar, Receipt, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  createExpenseAction,
  updateExpenseAction,
  deleteExpenseAction,
  getExpensesAction,
} from "@/features/manufacturing/actions";
import { getExpenseCategories, createExpenseCategory } from "@/features/master-data/categories/expense/actions";
import dayjs from "dayjs";
import { PriceInput } from "@/components/ui/form/PriceInput";

interface ExpenseData {
  id: string;
  expenseNumber: string;
  categoryId: string;
  description: string;
  amount: number;
  notes?: string | null;
  expenseDate: string;
  category: {
    name: string;
  };
}

interface CategoryOption {
  id: string;
  name: string;
}

function ExpensesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const triggerNew = searchParams.get("new") === "true";

  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  // Date Filter States
  const [datePreset, setDatePreset] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    setPage(1);

    const today = dayjs();
    switch (preset) {
      case "today":
        setStartDate(today.format("YYYY-MM-DD"));
        setEndDate(today.format("YYYY-MM-DD"));
        break;
      case "week":
        setStartDate(today.startOf("week").format("YYYY-MM-DD"));
        setEndDate(today.endOf("week").format("YYYY-MM-DD"));
        break;
      case "month":
        setStartDate(today.startOf("month").format("YYYY-MM-DD"));
        setEndDate(today.endOf("month").format("YYYY-MM-DD"));
        break;
      case "year":
        setStartDate(today.startOf("year").format("YYYY-MM-DD"));
        setEndDate(today.endOf("year").format("YYYY-MM-DD"));
        break;
      case "all":
      default:
        setStartDate("");
        setEndDate("");
        break;
    }
  };

  // Form Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseData | null>(null);
  const [formPending, setFormPending] = useState(false);

  // Combobox category states
  const [catSearch, setCatSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [creatingCat, setCreatingCat] = useState(false);

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(catSearch.toLowerCase())
  );

  // Delete States
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseData | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<any>({
    defaultValues: {
      categoryId: "",
      description: "",
      amount: 0,
      notes: "",
      expenseDate: dayjs().format("YYYY-MM-DD"),
    },
  });

  const loadCategories = async () => {
    const res = await getExpenseCategories({ showInactive: false, pageSize: 100 });
    if (res.success && res.data) {
      setCategories(res.data as any);
    }
  };

  const loadExpenses = () => {
    startTransition(async () => {
      const res = await getExpensesAction({
        search,
        categoryId: selectedCategory,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        pageSize: 10,
      });

      if (res.success && res.data) {
        setExpenses(res.data.items as any);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      } else {
        toast.error(res.error || "Failed to load expenses");
      }
    });
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [page, selectedCategory, startDate, endDate]);

  useEffect(() => {
    if (triggerNew && categories.length > 0 && !isFormOpen) {
      handleOpenForm(null);
      // Clean query param
      router.replace("/manufacturing/expenses");
    }
  }, [triggerNew, categories]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadExpenses();
  };

  const handleOpenForm = (expense: ExpenseData | null = null) => {
    setEditingExpense(expense);
    if (expense) {
      setValue("categoryId", expense.categoryId);
      setValue("description", expense.description);
      setValue("amount", expense.amount);
      setValue("notes", expense.notes || "");
      setValue("expenseDate", dayjs(expense.expenseDate).format("YYYY-MM-DD"));
      const match = categories.find((c) => c.id === expense.categoryId);
      setCatSearch(match ? match.name : "");
    } else {
      reset({
        categoryId: categories[0]?.id || "",
        description: "",
        amount: "",
        notes: "",
        expenseDate: dayjs().format("YYYY-MM-DD"),
      });
      const firstCat = categories[0];
      setCatSearch(firstCat ? firstCat.name : "");
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingExpense(null);
    setCatSearch("");
    setDropdownOpen(false);
    reset();
  };

  const onSave = async (values: any) => {
    try {
      setFormPending(true);
      const payload = {
        ...values,
        amount: Number(values.amount),
      };

      let res;
      if (editingExpense) {
        res = await updateExpenseAction({
          id: editingExpense.id,
          ...payload,
        });
      } else {
        res = await createExpenseAction(payload);
      }

      if (res.success) {
        toast.success(editingExpense ? "Expense updated" : "Expense recorded successfully");
        handleCloseForm();
        loadExpenses();
      } else {
        toast.error(res.error || "Failed to save expense");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setFormPending(false);
    }
  };

  const handleDeleteClick = (expense: ExpenseData, e: any) => {
    e.stopPropagation();
    setDeletingExpense(expense);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingExpense) return;
    try {
      const actualRes = await deleteExpenseAction(deletingExpense.id);
      if (actualRes.success) {
        toast.success("Expense deleted successfully");
        loadExpenses();
      } else {
        toast.error(actualRes.error || "Failed to delete expense");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setConfirmOpen(false);
      setDeletingExpense(null);
    }
  };

  const tableHeaders = [
    { key: "expenseNumber", label: "Expense No" },
    { key: "category", label: "Category" },
    { key: "description", label: "Description" },
    { key: "amount", label: "Amount", className: "text-right" },
    { key: "expenseDate", label: "Expense Date" },
    { key: "actions", label: "Actions", className: "w-28 text-right" },
  ];

  const renderCell = (item: ExpenseData, columnKey: string) => {
    switch (columnKey) {
      case "category":
        return (
          <span className="bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 font-bold px-2 py-0.5 rounded-lg text-xs">
            {item.category?.name || "Uncategorized"}
          </span>
        );
      case "amount":
        return <span className="font-extrabold text-red-600">₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>;
      case "expenseDate":
        return <span className="font-semibold text-slate-600 dark:text-slate-400">{dayjs(item.expenseDate).format("DD MMM YYYY")}</span>;
      case "actions":
        return (
          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              variant="ghost"
              onPress={() => handleOpenForm(item)}
              aria-label="Edit expense"
              className="min-w-0 p-1.5 text-slate-500 border-none shadow-none hover:bg-slate-100"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onPress={(e) => handleDeleteClick(item, e)}
              aria-label="Delete expense"
              className="min-w-0 p-1.5 text-red-550 border-none shadow-none hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      default:
        return <span>{String(item[columnKey as keyof ExpenseData] || "—")}</span>;
    }
  };

  const renderMobileCard = (item: ExpenseData) => {
    return (
      <div className="flex flex-col gap-2.5 w-full">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              {item.expenseNumber}
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-50 text-base">{item.description}</span>
          </div>
          <span className="font-extrabold text-red-600 text-base">
            ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 font-bold px-2 py-0.5 rounded-lg text-[10px]">
            {item.category?.name}
          </span>
          <div className="flex items-center gap-1 text-xs text-slate-400 font-semibold">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{dayjs(item.expenseDate).format("DD MMM YYYY")}</span>
          </div>
        </div>

        {item.notes && (
          <p className="text-xs text-slate-450 dark:text-slate-500 italic mt-0.5 border-t border-slate-100 dark:border-slate-850 pt-2">
            Note: {item.notes}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-50 dark:border-slate-905/30 pt-2 mt-1">
          <Button size="sm" variant="ghost" onPress={() => handleOpenForm(item)} className="border-none min-w-0 p-1 text-slate-650">
            <Edit className="w-4 h-4 mr-1 text-slate-650" />
            <span>Edit</span>
          </Button>
          <Button size="sm" variant="ghost" onPress={(e) => handleDeleteClick(item, e)} className="border-none min-w-0 p-1 text-red-500 hover:text-red-650">
            <Trash2 className="w-4 h-4 mr-1 text-red-500" />
            <span>Delete</span>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Manufacturing Expenses"
        subtitle="Manage electricity, direct transport, rolls repair and factory floor costs"
        action={
          <Button
            variant="primary"
            onPress={() => handleOpenForm(null)}
            className="w-full sm:w-auto font-bold rounded-xl h-11 bg-emerald-600 hover:bg-emerald-700 text-white border-none"
            size="md"
          >
            <Plus className="w-4.5 h-4.5 mr-1.5" />
            <span>Record Expense</span>
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        {/* Category select filter */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-150 dark:border-slate-850 shadow-sm w-full md:w-auto">
          <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Category</span>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setPage(1);
              setSelectedCategory(e.target.value);
            }}
            className="text-sm font-bold text-slate-800 dark:text-slate-200 bg-transparent border-none outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:max-w-xs">
          <div className="relative flex items-center w-full">
            <Search className="absolute left-3.5 text-slate-400 w-4.5 h-4.5" />
            <input
              type="text"
              placeholder="Search description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-800 dark:bg-slate-955 dark:focus:border-slate-100 outline-none text-sm transition-all font-semibold"
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>
      </div>

      {/* Date Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-850/60 mb-2">
        <div className="flex flex-col gap-1.5 w-full">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date Period Filter</span>
          <select
            value={datePreset}
            onChange={(e) => handleDatePresetChange(e.target.value)}
            className="h-10 rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm focus:border-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950 font-semibold"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Weekly (This Week)</option>
            <option value="month">Monthly (This Month)</option>
            <option value="year">Yearly (This Year)</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>

        {datePreset === "custom" ? (
          <>
            <div className="flex flex-col gap-1.5 w-full">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">From Date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="h-10 px-3 rounded-xl border border-slate-205 bg-white text-sm focus:border-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950 font-semibold"
              />
            </div>
            <div className="flex flex-col gap-1.5 w-full">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">To Date</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="h-10 px-3 rounded-xl border border-slate-205 bg-white text-sm focus:border-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950 font-semibold"
              />
            </div>
          </>
        ) : datePreset !== "all" ? (
          <div className="sm:col-span-3 text-xs font-bold text-slate-500 dark:text-slate-450 self-center pb-2">
            Active Filter Range: <span className="text-slate-800 dark:text-slate-200 font-extrabold">{startDate}</span> to <span className="text-slate-800 dark:text-slate-200 font-extrabold">{endDate}</span>
          </div>
        ) : null}
      </div>

      <Card>
        {isPending ? (
          <div className="py-20 text-center font-medium text-slate-500">Loading expenses log...</div>
        ) : (
          <Table<ExpenseData>
            headers={tableHeaders}
            data={expenses}
            renderCell={renderCell}
            renderMobileCard={renderMobileCard}
            keyField="id"
            emptyState={
              <div className="py-12 text-center text-slate-500 font-medium">
                No manufacturing expenses logged in this period.
              </div>
            }
          />
        )}

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
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

      {/* Expense Form Modal */}
      <div
        className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
          isFormOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {/* Backdrop overlay */}
        <div
          onClick={handleCloseForm}
          className={`absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
            isFormOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Drawer container */}
        <div
          className={`relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between transform transition-transform duration-300 ease-out ${
            isFormOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <form onSubmit={handleSubmit(onSave)} className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <span>{editingExpense ? "Edit Expense" : "Record Manufacturing Expense"}</span>
              </span>
              <button
                type="button"
                onClick={handleCloseForm}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                    Category *
                  </label>
                  
                  {/* Hidden field to store actual categoryId for useForm validation */}
                  <input type="hidden" {...register("categoryId", { required: "Category is required" })} />

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search or type new category..."
                      value={catSearch}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCatSearch(val);
                        // Find exact match to pre-set categoryId
                        const match = categories.find((c) => c.name.toLowerCase() === val.trim().toLowerCase());
                        if (match) {
                          setValue("categoryId", match.id);
                        } else {
                          setValue("categoryId", ""); // force select exact or create new
                        }
                        setDropdownOpen(true);
                      }}
                      onFocus={() => setDropdownOpen(true)}
                      className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-900 outline-none dark:border-slate-800 dark:bg-slate-955 dark:focus:border-slate-100 transition-all font-semibold"
                    />

                    {dropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                        <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white dark:bg-slate-955 shadow-lg z-20 p-1.5 flex flex-col gap-0.5">
                          {filteredCategories.length > 0 ? (
                            filteredCategories.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setValue("categoryId", c.id);
                                  setCatSearch(c.name);
                                  setDropdownOpen(false);
                                }}
                                className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-850 dark:text-slate-200 transition-colors"
                              >
                                {c.name}
                              </button>
                            ))
                          ) : (
                            <span className="px-3 py-2 text-xs text-slate-500 font-semibold italic">
                              No categories match
                            </span>
                          )}

                          {catSearch.trim() !== "" &&
                            !categories.some((c) => c.name.toLowerCase() === catSearch.trim().toLowerCase()) && (
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    setCreatingCat(true);
                                    const res = await createExpenseCategory(catSearch.trim());
                                    if (res.success && res.data) {
                                      const newCat = res.data;
                                      setCategories((prev) => [...prev, newCat]);
                                      setValue("categoryId", newCat.id);
                                      setCatSearch(newCat.name);
                                      setDropdownOpen(false);
                                      toast.success(`Category "${newCat.name}" created!`);
                                    } else {
                                      toast.error(res.error || "Failed to create category");
                                    }
                                  } catch (e) {
                                    toast.error("Failed to create category");
                                  } finally {
                                    setCreatingCat(false);
                                  }
                                }}
                                disabled={creatingCat}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors mt-1 border-t border-slate-100 dark:border-slate-800 pt-2"
                              >
                                {creatingCat ? "Creating..." : `+ Create "${catSearch}" category`}
                              </button>
                            )}
                        </div>
                      </>
                    )}
                  </div>
                  {errors.categoryId && <span className="text-xs text-red-500 font-bold">{String(errors.categoryId.message)}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-355">
                    Description *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paper Roll purchase / Electricity bill"
                    {...register("description", { required: "Description is required" })}
                    className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-955 ${
                      errors.description ? "border-red-500 focus:border-red-650" : "border-slate-200 focus:border-slate-900 dark:border-slate-808"
                    }`}
                  />
                  {errors.description && <span className="text-xs text-red-505">{String(errors.description.message)}</span>}
                </div>

                <PriceInput
                  label="Amount (₹) *"
                  placeholder="e.g. 5000"
                  error={errors.amount}
                  {...register("amount", { required: "Amount is required", valueAsNumber: true })}
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-355">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    {...register("expenseDate", { required: "Date is required" })}
                    className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-955 ${
                      errors.expenseDate ? "border-red-500 focus:border-red-655" : "border-slate-200 focus:border-slate-900 dark:border-slate-805"
                    }`}
                  />
                  {errors.expenseDate && <span className="text-xs text-red-500">{String(errors.expenseDate.message)}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-355">
                    Notes (optional)
                  </label>
                  <textarea
                    placeholder="Write details of transaction..."
                    {...register("notes")}
                    className="flex min-h-[60px] w-full rounded-xl border border-slate-205 bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-955 dark:border-slate-808 focus:border-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
              <Button variant="ghost" onPress={handleCloseForm} type="button" className="font-semibold">
                Cancel
              </Button>
              <Button variant="primary" type="submit" isPending={formPending} className="px-5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white border-none">
                {editingExpense ? "Save Changes" : "Record Expense"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation */}
      {confirmOpen && deletingExpense && (
        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => {
            setConfirmOpen(false);
            setDeletingExpense(null);
          }}
          title="Delete Expense"
          message={`Are you sure you want to permanently delete the manufacturing expense "${deletingExpense.description}" for ₹${deletingExpense.amount.toLocaleString()}?`}
          onConfirm={handleConfirmDelete}
          confirmText="Delete"
          isDanger={true}
        />
      )}
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-slate-505">Loading manufacturing expenses...</div>}>
      <ExpensesPageContent />
    </Suspense>
  );
}
