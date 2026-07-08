"use client";

import { useEffect, useState, useTransition, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { TableSkeleton } from "@/components/ui/Skeleton";
import {
  Button,
  Modal,
  ModalBackdrop,
  ModalContainer,
  ModalDialog,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tab,
  Tabs,
} from "@heroui/react";
import { Search, Plus, Edit, Trash2, CheckCircle, User, Phone, MapPin, X } from "lucide-react";
import toast from "react-hot-toast";
import { getContacts, upsertContact, toggleContactStatus } from "@/features/master-data/contacts/actions";
import { contactSchema, ContactFormValues } from "@/features/master-data/contacts/validations";
import { PhoneInput } from "@/components/ui/form/PhoneInput";
import { GSTInput } from "@/components/ui/form/GSTInput";
import { CurrencyInput } from "@/components/ui/form/CurrencyInput";

interface ContactData {
  id: string;
  name: string;
  type: "CUSTOMER" | "SUPPLIER";
  contactPerson?: string | null;
  phone?: string | null;
  altPhone?: string | null;
  email?: string | null;
  gstNumber?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  openingBalance: number;
  outstandingBalance: number;
  notes?: string | null;
  isActive: boolean;
}

function ContactsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");

  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "CUSTOMER" | "SUPPLIER">("ALL");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (typeParam === "CUSTOMER" || typeParam === "SUPPLIER") {
      setActiveTab(typeParam);
    } else {
      setActiveTab("ALL");
    }
  }, [typeParam]);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactData | null>(null);
  const [formPending, setFormPending] = useState(false);

  // Deactivate States
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deactivatingContact, setDeactivatingContact] = useState<ContactData | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(contactSchema),
  });

  const renderError = (err: any) => {
    if (!err || !err.message) return null;
    return <span className="text-xs text-red-550 mt-0.5">{String(err.message)}</span>;
  };

  const loadContacts = () => {
    startTransition(async () => {
      const res = await getContacts({
        search,
        page,
        pageSize: 10,
        showInactive,
        type: activeTab,
      });

      if (res.success && res.data) {
        setContacts(res.data as ContactData[]);
        setTotal(res.meta.total);
        setTotalPages(res.meta.totalPages);
      } else {
        toast.error("Failed to load contacts");
      }
    });
  };

  useEffect(() => {
    loadContacts();
  }, [page, showInactive, activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadContacts();
  };

  const handleOpenForm = (contact: ContactData | null = null, e?: any) => {
    if (e) e.stopPropagation();
    setEditingContact(contact);
    if (contact) {
      setValue("name", contact.name);
      setValue("type", contact.type);
      setValue("contactPerson", contact.contactPerson || "");
      setValue("phone", contact.phone || "");
      setValue("altPhone", contact.altPhone || "");
      setValue("email", contact.email || "");
      setValue("gstNumber", contact.gstNumber || "");
      setValue("address", contact.address || "");
      setValue("city", contact.city || "");
      setValue("state", contact.state || "");
      setValue("pincode", contact.pincode || "");
      setValue("openingBalance", contact.openingBalance);
      setValue("notes", contact.notes || "");
    } else {
      reset({
        name: "",
        type: "CUSTOMER",
        contactPerson: "",
        phone: "",
        altPhone: "",
        email: "",
        gstNumber: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        openingBalance: 0,
        notes: "",
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingContact(null);
    reset();
  };

  const onSave = async (values: any) => {
    try {
      setFormPending(true);
      const res = await upsertContact({
        id: editingContact?.id,
        ...values,
      });

      if (res.success) {
        toast.success(editingContact ? "Contact updated" : "Contact created");
        handleCloseForm();
        loadContacts();
      } else {
        toast.error(res.error || "Failed to save contact");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setFormPending(false);
    }
  };

  const handleToggleActiveClick = (contact: ContactData, e: any) => {
    e.stopPropagation();
    setDeactivatingContact(contact);
    setConfirmOpen(true);
  };

  const handleConfirmToggleActive = async () => {
    if (!deactivatingContact) return;
    try {
      const targetState = !deactivatingContact.isActive;
      const res = await toggleContactStatus(deactivatingContact.id, targetState);

      if (res.success) {
        toast.success(targetState ? "Contact activated" : "Contact soft-deleted");
        loadContacts();
      } else {
        toast.error(res.error || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setConfirmOpen(false);
      setDeactivatingContact(null);
    }
  };

  const tableHeaders = [
    { key: "name", label: "Contact Name", isRowHeader: true },
    { key: "type", label: "Type" },
    { key: "phone", label: "Phone" },
    { key: "openingBalance", label: "Opening Balance" },
    { key: "status", label: "Status" },
    { key: "actions", label: "Actions", className: "w-28 text-right" },
  ];

  const renderCell = (item: ContactData, columnKey: string) => {
    switch (columnKey) {
      case "type":
        return (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
              item.type === "CUSTOMER"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                : "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400"
            }`}
          >
            {item.type}
          </span>
        );
      case "openingBalance":
        return <span className="font-semibold">₹{item.openingBalance.toLocaleString()}</span>;
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
              onPress={(e) => handleOpenForm(item, e)}
              aria-label="Edit contact"
              className="min-w-0 p-1.5 text-slate-500 border-none shadow-none hover:bg-slate-100"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onPress={(e) => handleToggleActiveClick(item, e)}
              aria-label={item.isActive ? "Deactivate contact" : "Activate contact"}
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
        return <span>{String(item[columnKey as keyof ContactData]) || "—"}</span>;
    }
  };

  const renderMobileCard = (item: ContactData) => {
    return (
      <div className="flex flex-col gap-2.5 w-full">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 dark:text-slate-50 text-base">{item.name}</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  item.type === "CUSTOMER"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                    : "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400"
                }`}
              >
                {item.type}
              </span>
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  item.isActive
                    ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                }`}
              >
                {item.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <span className="font-bold text-slate-900 dark:text-slate-50 text-sm">
            Opening: ₹{item.openingBalance.toLocaleString()}
          </span>
        </div>

        <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-900 pt-2">
          {item.contactPerson && (
            <div className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Person: {item.contactPerson}</span>
            </div>
          )}
          {item.phone && (
            <div className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Phone: {item.phone}</span>
            </div>
          )}
          {item.city && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Location: {item.city}, {item.state || ""}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-50 dark:border-slate-905/30 pt-2">
          <Button size="sm" variant="ghost" onPress={(e) => handleOpenForm(item, e)} className="border-none min-w-0 p-1 text-slate-600">
            <Edit className="w-4 h-4 mr-1 text-slate-650" />
            <span>Edit</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={(e) => handleToggleActiveClick(item, e)}
            className="border-none min-w-0 p-1"
          >
            {item.isActive ? (
              <Trash2 className="w-4 h-4 mr-1 text-red-500" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
            )}
            <span>{item.isActive ? "Disable" : "Enable"}</span>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3.5 sm:gap-6">
      <Header
        title="Contacts Catalog"
        subtitle="Manage Customers and Suppliers for invoice trading"
        action={
          <Button
            variant="primary"
            onPress={() => handleOpenForm(null)}
            className="w-full sm:w-auto font-bold rounded-xl h-11"
            size="md"
          >
            <Plus className="w-4.5 h-4.5 mr-1.5" />
            <span>Add Contact</span>
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => {
            setPage(1);
            setActiveTab(key as any);
          }}
          aria-label="Contact Types Filters"
        >
          <Tab key="ALL">All Contacts</Tab>
          <Tab key="CUSTOMER">Customers Only</Tab>
          <Tab key="SUPPLIER">Suppliers Only</Tab>
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <form onSubmit={handleSearch} className="flex gap-2 w-full sm:max-w-xs">
            <div className="relative flex items-center w-full">
              <Search className="absolute left-3.5 text-slate-400 w-4.5 h-4.5" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-800 dark:bg-slate-950 dark:focus:border-slate-100 outline-none text-sm transition-all font-semibold"
              />
            </div>
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>

          <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-900 shadow-sm">
            <span className="text-sm font-semibold text-slate-650 dark:text-slate-400">Show Inactive</span>
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
      </div>

      <Card>
        {isPending ? (
          <TableSkeleton rows={5} />
        ) : (
          <Table<ContactData>
            headers={tableHeaders}
            data={contacts}
            renderCell={renderCell}
            renderMobileCard={renderMobileCard}
            keyField="id"
            onRowClick={(item) => router.push(`/master-data/contacts/${item.id}`)}
            emptyState={
              <div className="py-12 text-center text-slate-500 font-medium">
                No customer or supplier contacts found.
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
          className={`relative w-full max-w-2xl h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between transform transition-transform duration-300 ease-out ${
            isFormOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <form onSubmit={handleSubmit(onSave)} className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-lg font-bold text-slate-900 dark:text-slate-50">
                {editingContact ? "Edit Contact" : "Add Customer or Supplier"}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        Contact Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Distributors"
                        {...register("name")}
                        className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-950 ${
                          errors.name ? "border-red-500 focus:border-red-600" : "border-slate-200 focus:border-slate-900 dark:border-slate-800 dark:focus:border-slate-100"
                        }`}
                      />
                      {renderError(errors.name)}
                    </div>

                    <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        Contact Type *
                      </label>
                      <select
                        {...register("type")}
                        className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950 dark:focus:border-slate-100 transition-all font-semibold"
                      >
                        <option value="CUSTOMER">CUSTOMER</option>
                        <option value="SUPPLIER">SUPPLIER</option>
                      </select>
                      {renderError(errors.type)}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Kumar"
                        {...register("contactPerson")}
                        className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-950 ${
                          errors.contactPerson ? "border-red-500" : "border-slate-200 dark:border-slate-800"
                        }`}
                      />
                      {renderError(errors.contactPerson)}
                    </div>

                    <GSTInput
                      label="GST Number"
                      placeholder="e.g. 33AAAAA1111A1Z1"
                      error={errors.gstNumber}
                      {...register("gstNumber")}
                    />

                    <PhoneInput
                      label="Primary Phone"
                      placeholder="e.g. 9876543210"
                      error={errors.phone}
                      {...register("phone")}
                    />

                    <PhoneInput
                      label="Alternate Phone"
                      placeholder="e.g. 9876543211"
                      error={errors.altPhone}
                      {...register("altPhone")}
                    />

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. contact@ramesh.com"
                        {...register("email")}
                        className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-955 ${
                          errors.email ? "border-red-500" : "border-slate-200 dark:border-slate-800"
                        }`}
                      />
                      {renderError(errors.email)}
                    </div>

                    <CurrencyInput
                      label="Opening Balance (₹)"
                      placeholder="e.g. 5000"
                      error={errors.openingBalance}
                      {...register("openingBalance", { valueAsNumber: true })}
                    />

                    <div className="flex flex-col gap-1.5 col-span-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        Street Address
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 12, Main Street, Industrial Estate"
                        {...register("address")}
                        className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-950 ${
                          errors.address ? "border-red-500" : "border-slate-200 dark:border-slate-800"
                        }`}
                      />
                      {renderError(errors.address)}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-350">City</label>
                      <input
                        type="text"
                        placeholder="e.g. Erode"
                        {...register("city")}
                        className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-950 ${
                          errors.city ? "border-red-500" : "border-slate-200 dark:border-slate-800"
                        }`}
                      />
                      {renderError(errors.city)}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-350">State</label>
                      <input
                        type="text"
                        placeholder="e.g. Tamil Nadu"
                        {...register("state")}
                        className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-950 ${
                          errors.state ? "border-red-500" : "border-slate-200 dark:border-slate-800"
                        }`}
                      />
                      {renderError(errors.state)}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Pincode</label>
                      <input
                        type="text"
                        placeholder="e.g. 638001"
                        {...register("pincode")}
                        className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-950 ${
                          errors.pincode ? "border-red-500" : "border-slate-200 dark:border-slate-800"
                        }`}
                      />
                      {renderError(errors.pincode)}
                    </div>

                    <div className="flex flex-col gap-1.5 col-span-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-350">Notes</label>
                      <input
                        type="text"
                        placeholder="Write any comments..."
                        {...register("notes")}
                        className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-950 border-slate-200 dark:border-slate-800`}
                      />
                      {renderError(errors.notes)}
                    </div>
                  </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
              <Button variant="ghost" onPress={handleCloseForm} type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit" isPending={formPending} className="px-5 font-semibold bg-emerald-600 hover:bg-emerald-700 border-none text-white">
                {editingContact ? "Save Changes" : "Create"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Soft Delete confirmation */}
      {confirmOpen && deactivatingContact && (
        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => {
            setConfirmOpen(false);
            setDeactivatingContact(null);
          }}
          title={deactivatingContact.isActive ? "Deactivate Contact" : "Activate Contact"}
          message={`Are you sure you want to ${
            deactivatingContact.isActive ? "deactivate" : "activate"
          } the contact "${deactivatingContact.name}"?`}
          onConfirm={handleConfirmToggleActive}
          confirmText={deactivatingContact.isActive ? "Deactivate" : "Activate"}
          isDanger={deactivatingContact.isActive}
        />
      )}
    </div>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-slate-500">Loading contacts registry...</div>}>
      <ContactsPageContent />
    </Suspense>
  );
}
