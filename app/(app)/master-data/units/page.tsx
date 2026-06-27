"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Search, Plus, Edit, Trash2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { getUnits, upsertUnit, toggleUnitStatus } from "@/features/units/actions";
import { unitSchema, UnitFormValues } from "@/features/units/validations";

interface UnitData {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export default function UnitsPage() {
  const [units, setUnits] = useState<UnitData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<UnitData | null>(null);
  const [formPending, setFormPending] = useState(false);

  // Deactivate States
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deactivatingUnit, setDeactivatingUnit] = useState<UnitData | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(unitSchema),
  });

  const loadUnits = () => {
    startTransition(async () => {
      const res = await getUnits({
        search,
        page,
        pageSize: 10,
        showInactive,
      });

      if (res.success && res.data) {
        setUnits(res.data as UnitData[]);
        setTotal(res.meta.total);
        setTotalPages(res.meta.totalPages);
      } else {
        toast.error("Failed to load units");
      }
    });
  };

  useEffect(() => {
    loadUnits();
  }, [page, showInactive]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadUnits();
  };

  const handleOpenForm = (unit: UnitData | null = null) => {
    setEditingUnit(unit);
    if (unit) {
      setValue("name", unit.name);
    } else {
      reset({ name: "" });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingUnit(null);
    reset({ name: "" });
  };

  const onSave = async (values: any) => {
    try {
      setFormPending(true);
      const res = await upsertUnit({
        id: editingUnit?.id,
        name: values.name,
      });

      if (res.success) {
        toast.success(editingUnit ? "Unit updated" : "Unit created");
        handleCloseForm();
        loadUnits();
      } else {
        toast.error(res.error || "Failed to save unit");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setFormPending(false);
    }
  };

  const handleToggleActiveClick = (unit: UnitData) => {
    setDeactivatingUnit(unit);
    setConfirmOpen(true);
  };

  const handleConfirmToggleActive = async () => {
    if (!deactivatingUnit) return;
    try {
      const targetState = !deactivatingUnit.isActive;
      const res = await toggleUnitStatus(deactivatingUnit.id, targetState);

      if (res.success) {
        toast.success(targetState ? "Unit activated" : "Unit soft-deleted");
        loadUnits();
      } else {
        toast.error(res.error || "Failed to update unit status");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setConfirmOpen(false);
      setDeactivatingUnit(null);
    }
  };

  const tableHeaders = [
    { key: "name", label: "Unit Name", isRowHeader: true },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions", className: "w-24 text-right" },
  ];

  const renderCell = (item: UnitData, columnKey: string) => {
    switch (columnKey) {
      case "status":
        return (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
              item.isActive
                ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
            }`}
          >
            {item.isActive ? "Active" : "Inactive"}
          </span>
        );
      case "actions":
        return (
          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              variant="ghost"
              onPress={() => handleOpenForm(item)}
              aria-label="Edit unit"
              className="min-w-0 p-1.5 text-slate-500 border-none shadow-none hover:bg-slate-100"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onPress={() => handleToggleActiveClick(item)}
              aria-label={item.isActive ? "Deactivate unit" : "Activate unit"}
              className="min-w-0 p-1.5 border-none shadow-none hover:bg-slate-150"
            >
              {item.isActive ? (
                <Trash2 className="w-4 h-4 text-red-655" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-655" />
              )}
            </Button>
          </div>
        );
      default:
        return <span>{String(item[columnKey as keyof UnitData])}</span>;
    }
  };

  const renderMobileCard = (item: UnitData) => {
    return (
      <div className="flex justify-between items-center w-full">
        <div className="flex flex-col gap-1">
          <span className="font-bold text-slate-900 dark:text-slate-50">{item.name}</span>
          <span
            className={`inline-flex self-start px-2 py-0.5 rounded-full text-[10px] font-bold ${
              item.isActive
                ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
            }`}
          >
            {item.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onPress={() => handleOpenForm(item)}
            className="min-w-0 p-1.5 border-none"
          >
            <Edit className="w-4 h-4 text-slate-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => handleToggleActiveClick(item)}
            className="min-w-0 p-1.5 border-none"
          >
            {item.isActive ? (
              <Trash2 className="w-4 h-4 text-red-600" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-600" />
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Units of Measurement"
        subtitle="Manage units for stock and transaction items (e.g. KG, PCS, BOX)"
        action={
          <Button
            variant="primary"
            onPress={() => handleOpenForm(null)}
            className="w-full sm:w-auto font-bold rounded-xl h-11"
            size="md"
          >
            <Plus className="w-4.5 h-4.5 mr-1.5" />
            <span>Add Unit</span>
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <form onSubmit={handleSearch} className="flex gap-2 w-full md:max-w-md">
          <div className="relative flex items-center w-full">
            <Search className="absolute left-3.5 text-slate-400 w-4.5 h-4.5" />
            <input
              type="text"
              placeholder="Search unit name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-800 dark:bg-slate-950 dark:focus:border-slate-100 outline-none text-sm transition-all font-semibold"
            />
          </div>
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-3 bg-white dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-900 shadow-sm">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Show Inactive</span>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => {
                setPage(1);
                setShowInactive(e.target.checked);
              }}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900 dark:peer-checked:bg-slate-50"></div>
          </label>
        </div>
      </div>

      <Card>
        {isPending ? (
          <div className="py-20 text-center font-medium text-slate-500">Loading units...</div>
        ) : (
          <Table<UnitData>
            headers={tableHeaders}
            data={units}
            renderCell={renderCell}
            renderMobileCard={renderMobileCard}
            keyField="id"
            emptyState={
              <div className="py-12 text-center text-slate-500 font-medium">
                No units found.
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

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <Modal isOpen={isFormOpen} onOpenChange={(open) => { if (!open) handleCloseForm(); }}>
          <ModalBackdrop />
          <ModalContainer>
            <ModalDialog className="max-w-md mx-4">
              <form onSubmit={handleSubmit(onSave)}>
                <ModalHeader className="pt-6 px-6">
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-50">
                    {editingUnit ? "Edit Unit" : "Add Unit of Measurement"}
                  </span>
                </ModalHeader>
                <ModalBody className="px-6 py-2">
                  <div className="flex flex-col gap-4 py-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-350">
                        Unit Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. BOX"
                        {...register("name")}
                        className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-950 ${
                          errors.name
                            ? "border-red-500 focus:border-red-650"
                            : "border-slate-200 focus:border-slate-900 dark:border-slate-800 dark:focus:border-slate-100"
                        }`}
                      />
                      {errors.name?.message && (
                        <span className="text-xs text-red-500 mt-0.5">{String(errors.name.message)}</span>
                      )}
                    </div>
                  </div>
                </ModalBody>
                <ModalFooter className="px-6 pb-6 pt-4 gap-3">
                  <Button variant="ghost" onPress={handleCloseForm} type="button">
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" isPending={formPending} className="px-5 font-semibold">
                    {editingUnit ? "Save Changes" : "Create"}
                  </Button>
                </ModalFooter>
              </form>
            </ModalDialog>
          </ModalContainer>
        </Modal>
      )}

      {/* Soft Delete confirmation */}
      {confirmOpen && deactivatingUnit && (
        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => {
            setConfirmOpen(false);
            setDeactivatingUnit(null);
          }}
          title={deactivatingUnit.isActive ? "Deactivate Unit" : "Activate Unit"}
          message={`Are you sure you want to ${
            deactivatingUnit.isActive ? "deactivate" : "activate"
          } the unit "${deactivatingUnit.name}"?`}
          onConfirm={handleConfirmToggleActive}
          confirmText={deactivatingUnit.isActive ? "Deactivate" : "Activate"}
          isDanger={deactivatingUnit.isActive}
        />
      )}
    </div>
  );
}
