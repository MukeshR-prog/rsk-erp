"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@heroui/react";
import {
  FileText,
  DollarSign,
  TrendingDown,
  Calendar,
  Phone,
  MapPin,
  Building,
  Edit,
  Search
} from "lucide-react";
import toast from "react-hot-toast";
import { getContactDetails } from "@/features/master-data/contacts/actions";
import ContactFormDrawer from "@/components/erp/contacts/ContactFormDrawer";
import dayjs from "dayjs";

export default function SupplierDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  // Search & Pagination state for profile tabs
  const [tabSearch, setTabSearch] = useState("");
  const [tabPage, setTabPage] = useState(1);
  const pageSize = 10;

  const loadSupplier = async () => {
    try {
      setLoading(true);
      const res = await getContactDetails(id);
      if (res.success && res.data) {
        if (res.data.type !== "SUPPLIER") {
          toast.error("Contact is not a Supplier");
          router.push("/trading/suppliers");
          return;
        }
        setSupplier(res.data);
      } else {
        toast.error(res.error || "Failed to load supplier profile");
        router.push("/trading/suppliers");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupplier();
  }, [id]);

  useEffect(() => {
    setTabSearch("");
    setTabPage(1);
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto animate-pulse">
        <Header title="Supplier Profile" subtitle="Loading profile details..." />
        <CardSkeleton />
      </div>
    );
  }

  if (!supplier) return null;

  const tabItems = [
    { id: "profile", label: "Supplier Profile" },
    { id: "purchases", label: `Purchases History (${supplier.purchases?.length || 0})` },
    { id: "payments", label: `Payments Made (${supplier.payments?.length || 0})` },
    { id: "products", label: `Products Purchased (${supplier.products?.length || 0})` },
    { id: "ledger", label: "Recent Timeline Ledger" },
  ];

  // Tab Data Filtering & Pagination Helpers
  const getFilteredData = () => {
    const query = tabSearch.trim().toLowerCase();
    if (activeTab === "purchases") {
      const items = supplier.purchases || [];
      if (!query) return items;
      return items.filter(
        (p: any) =>
          p.number.toLowerCase().includes(query) ||
          p.paymentStatus.toLowerCase().includes(query) ||
          p.status.toLowerCase().includes(query)
      );
    }
    if (activeTab === "payments") {
      const items = supplier.payments || [];
      if (!query) return items;
      return items.filter(
        (p: any) =>
          p.number.toLowerCase().includes(query) ||
          p.method.toLowerCase().includes(query) ||
          p.status.toLowerCase().includes(query)
      );
    }
    if (activeTab === "products") {
      const items = supplier.products || [];
      if (!query) return items;
      return items.filter(
        (p: any) =>
          (p.code && p.code.toLowerCase().includes(query)) ||
          (p.name && p.name.toLowerCase().includes(query)) ||
          (p.color && p.color.toLowerCase().includes(query))
      );
    }
    if (activeTab === "ledger") {
      const items = supplier.recentTransactions || [];
      if (!query) return items;
      return items.filter(
        (t: any) =>
          t.number.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.status.toLowerCase().includes(query)
      );
    }
    return [];
  };

  const filteredItems = getFilteredData();
  const totalTabPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const paginatedItems = filteredItems.slice((tabPage - 1) * pageSize, tabPage * pageSize);

  const renderSearchAndPaginationHeader = (title: string, subtitle: string) => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">{title}</h3>
        <p className="text-xs text-slate-400 font-medium mt-0.5">{subtitle}</p>
      </div>
      <div className="relative flex items-center w-full sm:w-64">
        <Search className="absolute left-3 text-slate-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search items..."
          value={tabSearch}
          onChange={(e) => {
            setTabSearch(e.target.value);
            setTabPage(1);
          }}
          className="pl-9 pr-3 py-1.5 w-full rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-800 dark:bg-slate-950 dark:focus:border-slate-100 outline-none text-xs font-semibold"
        />
      </div>
    </div>
  );

  const renderTabPaginationFooter = () => {
    if (filteredItems.length === 0) return null;
    return (
      <div className="flex justify-between items-center mt-4 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs font-medium">
        <span className="text-slate-500">
          Showing {Math.min((tabPage - 1) * pageSize + 1, filteredItems.length)} -{" "}
          {Math.min(tabPage * pageSize, filteredItems.length)} of {filteredItems.length} items
        </span>
        {totalTabPages > 1 && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              isDisabled={tabPage === 1}
              onPress={() => setTabPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              isDisabled={tabPage === totalTabPages}
              onPress={() => setTabPage((p) => Math.min(totalTabPages, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <Header
        title={supplier.name}
        subtitle="Supplier Profile Overview"
        backHref="/trading/suppliers"
        action={
          <Button
            variant="outline"
            onPress={() => setIsEditDrawerOpen(true)}
            className="font-bold rounded-xl border-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            <Edit className="w-4 h-4 mr-1.5 text-slate-600 dark:text-slate-400" />
            <span>Edit Profile</span>
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Outstanding Balance" subtitle="Dynamic outstanding supplier balance">
          <div className="mt-2 flex items-center justify-between">
            <span className={`text-xl sm:text-2xl font-extrabold tracking-tight ${supplier.totals.outstandingBalance > 0 ? "text-red-600" : "text-slate-800 dark:text-slate-200"}`}>
              ₹{supplier.totals.outstandingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <div className="p-2 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card title="Total Purchases" subtitle="Sum of completed invoices">
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-200">
              ₹{supplier.totals.totalTransactionAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <div className="p-2 bg-slate-100 dark:bg-slate-900 text-slate-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card title="Total Paid" subtitle="Sum of dynamic disbursement payments">
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-600">
              ₹{supplier.totals.totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-6 scrollbar-hide">
        {tabItems.map((tab) => (
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

      {/* Tab Panels */}
      <div className="mt-2">
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card
              title="Supplier Information"
              className="lg:col-span-2"
              headerAction={
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setIsEditDrawerOpen(true)}
                  className="font-bold text-xs text-slate-600 hover:text-slate-900"
                >
                  <Edit className="w-3.5 h-3.5 mr-1" />
                  <span>Edit Details</span>
                </Button>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm py-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">GSTIN</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100 uppercase">{supplier.gstNumber || "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Contact Person</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{supplier.contactPerson || "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Primary Phone</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{supplier.phone || "—"}</span>
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Alternate Phone</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{supplier.altPhone || "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5 sm:col-span-2">
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Email Address</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{supplier.email || "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5 sm:col-span-2">
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Notes</span>
                  <span className="text-slate-600 dark:text-slate-400 italic">{supplier.notes || "No notes registered."}</span>
                </div>
              </div>
            </Card>

            <Card title="Business Address">
              <div className="flex flex-col gap-3 text-sm py-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Street Address</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 leading-relaxed flex items-start gap-1.5">
                    <Building className="w-4.5 h-4.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>{supplier.address || "—"}</span>
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">City & State</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{supplier.city || "—"}{supplier.state ? `, ${supplier.state}` : ""}</span>
                  </span>
                </div>
                {supplier.pincode && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Pincode</span>
                    <span className="font-mono font-semibold text-slate-850 dark:text-slate-100">{supplier.pincode}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === "purchases" && (
          <Card>
            {renderSearchAndPaginationHeader("Purchase History", "Invoices logged from this supplier")}
            <div className="mt-4">
              {paginatedItems.length > 0 ? (
                <Table
                  headers={[
                    { key: "number", label: "Invoice No" },
                    { key: "date", label: "Date" },
                    { key: "itemsCount", label: "Items Count", className: "text-right" },
                    { key: "grandTotal", label: "Invoice Amount", className: "text-right" },
                    { key: "paymentStatus", label: "Payment Status" },
                    { key: "status", label: "Status" },
                  ]}
                  data={paginatedItems}
                  keyField="id"
                  renderCell={(item: any, key: string) => {
                    if (key === "grandTotal") return <span className="font-bold">₹{item.grandTotal.toLocaleString()}</span>;
                    if (key === "date") return <span>{dayjs(item.date).format("DD MMM YYYY")}</span>;
                    if (key === "paymentStatus") {
                      return (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.paymentStatus === "PAID" ? "bg-green-50 text-green-700" : item.paymentStatus === "PARTIALLY_PAID" ? "bg-orange-50 text-orange-700" : "bg-red-50 text-red-700"
                        }`}>
                          {item.paymentStatus}
                        </span>
                      );
                    }
                    if (key === "status") {
                      return (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {item.status}
                        </span>
                      );
                    }
                    return <span>{item[key]}</span>;
                  }}
                />
              ) : (
                <div className="text-center py-10 text-slate-400 font-semibold">
                  {tabSearch ? "No matching purchase invoices found." : "No purchases recorded."}
                </div>
              )}
              {renderTabPaginationFooter()}
            </div>
          </Card>
        )}

        {activeTab === "payments" && (
          <Card>
            {renderSearchAndPaginationHeader("Payments Ledger", "Disbursements made to this supplier")}
            <div className="mt-4">
              {paginatedItems.length > 0 ? (
                <Table
                  headers={[
                    { key: "number", label: "Payment No" },
                    { key: "date", label: "Payment Date" },
                    { key: "amount", label: "Amount Paid", className: "text-right" },
                    { key: "method", label: "Method" },
                    { key: "status", label: "Status" },
                  ]}
                  data={paginatedItems}
                  keyField="id"
                  renderCell={(item: any, key: string) => {
                    if (key === "amount") return <span className="font-bold text-emerald-600">₹{item.amount.toLocaleString()}</span>;
                    if (key === "date") return <span>{dayjs(item.date).format("DD MMM YYYY")}</span>;
                    if (key === "status") {
                      return (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {item.status}
                        </span>
                      );
                    }
                    return <span>{item[key]}</span>;
                  }}
                />
              ) : (
                <div className="text-center py-10 text-slate-400 font-semibold">
                  {tabSearch ? "No matching payment records found." : "No payments recorded."}
                </div>
              )}
              {renderTabPaginationFooter()}
            </div>
          </Card>
        )}

        {activeTab === "products" && (
          <Card>
            {renderSearchAndPaginationHeader("Purchased Finished Goods", "Unique items purchased from this supplier")}
            <div className="mt-4">
              {paginatedItems.length > 0 ? (
                <Table
                  headers={[
                    { key: "code", label: "SKU / Code" },
                    { key: "name", label: "Product Name" },
                    { key: "volumeMl", label: "Volume capacity" },
                    { key: "color", label: "Color / Style" },
                    { key: "lastRate", label: "Last Purchase Rate", className: "text-right" },
                  ]}
                  data={paginatedItems}
                  keyField="id"
                  renderCell={(item: any, key: string) => {
                    if (key === "lastRate") return <span className="font-bold">₹{item.lastRate.toLocaleString()}</span>;
                    return <span>{item[key] || "—"}</span>;
                  }}
                />
              ) : (
                <div className="text-center py-10 text-slate-400 font-semibold">
                  {tabSearch ? "No matching products found." : "No purchase history items."}
                </div>
              )}
              {renderTabPaginationFooter()}
            </div>
          </Card>
        )}

        {activeTab === "ledger" && (
          <Card>
            {renderSearchAndPaginationHeader("Supplier Ledger timeline", "Combined invoices and payments chronologically")}
            <div className="mt-4">
              {paginatedItems.length > 0 ? (
                <div className="flow-root py-2">
                  <ul className="-mb-8">
                    {paginatedItems.map((tx: any, idx: number) => {
                      const isInvoice = tx.type === "INVOICE";
                      const isCompleted = tx.status === "COMPLETED";

                      return (
                        <li key={tx.id}>
                          <div className="relative pb-8">
                            {idx !== paginatedItems.length - 1 ? (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-800" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3 items-start">
                              <div>
                                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-slate-950 ${
                                  isInvoice ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                                }`}>
                                  {isInvoice ? (
                                    <FileText className="w-4 h-4" />
                                  ) : (
                                    <DollarSign className="w-4 h-4" />
                                  )}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-sm text-slate-750 dark:text-slate-250 font-bold">
                                    {tx.description}{" "}
                                    <span className="font-extrabold text-slate-900 dark:text-white">
                                      #{tx.number}
                                    </span>{" "}
                                    •{" "}
                                    <span className={`inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                                      isCompleted ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                                    }`}>
                                      {tx.status}
                                    </span>
                                  </p>
                                  <div className="flex items-center gap-1 mt-1 text-slate-400 text-xs font-semibold">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{dayjs(tx.date).format("DD MMM YYYY • hh:mm A")}</span>
                                  </div>
                                </div>
                                <div className="text-right whitespace-nowrap text-sm">
                                  <span className={`font-extrabold text-base ${isInvoice ? "text-red-600" : "text-emerald-600"}`}>
                                    {isInvoice ? "-" : "+"} ₹{tx.amount.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 font-semibold">
                  {tabSearch ? "No matching timeline entries found." : "No transactions recorded."}
                </div>
              )}
              {renderTabPaginationFooter()}
            </div>
          </Card>
        )}
      </div>

      {/* Edit Drawer */}
      <ContactFormDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        contact={supplier}
        defaultType="SUPPLIER"
        onSuccess={loadSupplier}
      />
    </div>
  );
}
