"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
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
import { Edit, Trash2, CheckCircle, FileText, Info } from "lucide-react";
import toast from "react-hot-toast";
import { getContactDetails, upsertContact, toggleContactStatus } from "@/features/contacts/actions";
import { contactSchema, ContactFormValues } from "@/features/contacts/validations";
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

export default function ContactDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [contact, setContact] = useState<ContactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formPending, setFormPending] = useState(false);

  // Soft Delete State
  const [confirmOpen, setConfirmOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(contactSchema),
  });

  const renderError = (err: any) => {
    if (!err || !err.message) return null;
    return <span className="text-xs text-red-555 mt-0.5">{String(err.message)}</span>;
  };

  const loadContact = async () => {
    try {
      setLoading(true);
      const res = await getContactDetails(id);
      if (res.success && res.data) {
        setContact(res.data as ContactData);
      } else {
        toast.error(res.error || "Failed to load contact");
        router.push("/master-data/contacts");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContact();
  }, [id]);

  const handleOpenForm = () => {
    if (!contact) return;
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
    setIsFormOpen(true);
  };

  const onSave = async (values: any) => {
    try {
      setFormPending(true);
      const res = await upsertContact({
        id,
        ...values,
      });

      if (res.success) {
        toast.success("Contact updated");
        setIsFormOpen(false);
        loadContact();
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

  const handleToggleActive = async () => {
    if (!contact) return;
    try {
      const targetState = !contact.isActive;
      const res = await toggleContactStatus(contact.id, targetState);

      if (res.success) {
        toast.success(targetState ? "Contact activated" : "Contact soft-deleted");
        loadContact();
      } else {
        toast.error(res.error || "Failed to update contact status");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center font-medium text-slate-500">
        Loading contact details...
      </div>
    );
  }

  if (!contact) return null;

  return (
    <div className="flex flex-col gap-6">
      <Header
        title={contact.name}
        subtitle={`${contact.type} Profile`}
        backHref="/master-data/contacts"
        action={
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onPress={handleOpenForm}
              className="flex-1 sm:flex-initial font-semibold rounded-xl"
            >
              <Edit className="w-4 h-4 mr-1.5" />
              <span>Edit Profile</span>
            </Button>
            <Button
              variant={contact.isActive ? "danger" : "outline"}
              onPress={() => setConfirmOpen(true)}
              className="flex-1 sm:flex-initial font-semibold rounded-xl"
            >
              {contact.isActive ? (
                <>
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  <span>Disable</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  <span>Enable</span>
                </>
              )}
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-6 scrollbar-hide">
        {[
          { id: "details", label: "Basic Info" },
          { id: "sales", label: "Sales Invoices" },
          { id: "purchases", label: "Purchases" },
          { id: "payments", label: "Payments" },
          { id: "ledger", label: "Running Ledger" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap focus:outline-none cursor-pointer ${
              activeTab === tab.id
                ? "border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-50"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-2">
        {activeTab === "details" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Info Card */}
            <Card title="Information" className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm py-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    Contact Type
                  </span>
                  <span
                    className={`inline-flex self-start px-2.5 py-0.5 mt-1 rounded-full text-xs font-semibold ${
                      contact.type === "CUSTOMER"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                        : "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400"
                    }`}
                  >
                    {contact.type}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    Status
                  </span>
                  <span
                    className={`inline-flex self-start px-2.5 py-0.5 mt-1 rounded-full text-xs font-semibold ${
                      contact.isActive
                        ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                    }`}
                  >
                    {contact.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5 col-span-1 md:col-span-2">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    Contact Person
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {contact.contactPerson || "—"}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    GSTIN
                  </span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-100 uppercase">
                    {contact.gstNumber || "—"}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    Opening Balance
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    ₹{contact.openingBalance.toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    Primary Phone
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {contact.phone || "—"}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    Alternate Phone
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {contact.altPhone || "—"}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5 col-span-1 md:col-span-2">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    Email Address
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {contact.email || "—"}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5 col-span-1 md:col-span-2">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    Notes / Remarks
                  </span>
                  <span className="text-slate-650 dark:text-slate-350 italic">
                    {contact.notes || "No notes recorded."}
                  </span>
                </div>
              </div>
            </Card>

            {/* Address Card */}
            <Card title="Business Address">
              <div className="flex flex-col gap-3 text-sm py-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    Street Address
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 leading-relaxed">
                    {contact.address || "—"}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    City / Town
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {contact.city || "—"}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    State
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {contact.state || "—"}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    Pincode
                  </span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">
                    {contact.pincode || "—"}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "sales" && (
          <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-350">Sales History</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mt-2">
              This area will display detailed sales invoices logged against this customer after Phase 3 (Trading) is completed.
            </p>
          </div>
        )}

        {activeTab === "purchases" && (
          <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-350">Purchase History</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mt-2">
              This area will display purchase vendor bills logged against this supplier after Phase 3 (Trading) is completed.
            </p>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <Info className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-350">Payment Records</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mt-2">
              This area will show incoming customer collections or outgoing supplier payments after Phase 3 (Trading) is completed.
            </p>
          </div>
        )}

        {activeTab === "ledger" && (
          <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <Info className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-350">Customer/Supplier Ledger</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mt-2">
              Running ledger statements mapping invoice totals, payments made, and running outstanding balances will show here after Phase 3.
            </p>
          </div>
        )}
      </div>

      {/* Edit Form Modal */}
      {isFormOpen && (
        <Modal isOpen={isFormOpen} onOpenChange={(open) => { if (!open) setIsFormOpen(false); }}>
          <ModalBackdrop />
          <ModalContainer>
            <ModalDialog className="max-w-2xl mx-4">
              <form onSubmit={handleSubmit(onSave)}>
                <ModalHeader className="pt-6 px-6">
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-50">
                    Edit Contact Profile
                  </span>
                </ModalHeader>
                <ModalBody className="px-6 py-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                    <div className="flex flex-col gap-1.5 col-span-2 md:col-span-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        Contact Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Distributors"
                        {...register("name")}
                        className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-955 ${
                          errors.name ? "border-red-500" : "border-slate-200 dark:border-slate-800"
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
                        className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-955 ${
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
                        className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-950 ${
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
                </ModalBody>
                <ModalFooter className="px-6 pb-6 pt-4 gap-3">
                  <Button variant="ghost" onPress={() => setIsFormOpen(false)} type="button">
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" isPending={formPending} className="px-5 font-semibold">
                    Save Changes
                  </Button>
                </ModalFooter>
              </form>
            </ModalDialog>
          </ModalContainer>
        </Modal>
      )}

      {/* Delete/deactivate confirmation */}
      {confirmOpen && (
        <ConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title={contact.isActive ? "Deactivate Contact" : "Activate Contact"}
          message={`Are you sure you want to ${
            contact.isActive ? "deactivate" : "activate"
          } the contact "${contact.name}"?`}
          onConfirm={handleToggleActive}
          confirmText={contact.isActive ? "Deactivate" : "Activate"}
          isDanger={contact.isActive}
        />
      )}
    </div>
  );
}
