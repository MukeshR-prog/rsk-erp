"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Table from "@/components/ui/Table";
import {
  FileText,
  DollarSign,
  TrendingUp,
  Info,
  Calendar,
  Layers,
  Phone,
  MapPin,
  Building
} from "lucide-react";
import toast from "react-hot-toast";
import { getContactDetails } from "@/features/master-data/contacts/actions";
import dayjs from "dayjs";

export default function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const res = await getContactDetails(id);
      if (res.success && res.data) {
        if (res.data.type !== "CUSTOMER") {
          toast.error("Contact is not a Customer");
          router.push("/trading/customers");
          return;
        }
        setCustomer(res.data);
      } else {
        toast.error(res.error || "Failed to load customer profile");
        router.push("/trading/customers");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomer();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center font-medium text-slate-500">
        Loading customer profile...
      </div>
    );
  }

  if (!customer) return null;

  const tabItems = [
    { id: "profile", label: "Customer Profile" },
    { id: "sales", label: `Sales History (${customer.sales?.length || 0})` },
    { id: "payments", label: `Payments Received (${customer.payments?.length || 0})` },
    { id: "products", label: `Products Sold (${customer.products?.length || 0})` },
    { id: "ledger", label: "Recent Timeline Ledger" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Header
        title={customer.name}
        subtitle="Customer Profile Overview"
        backHref="/trading/customers"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Outstanding Balance" subtitle="Dynamic outstanding customer balance">
          <div className="mt-2 flex items-center justify-between">
            <span className={`text-xl sm:text-2xl font-extrabold tracking-tight ${customer.totals.outstandingBalance > 0 ? "text-emerald-600" : "text-slate-800 dark:text-slate-200"}`}>
              ₹{customer.totals.outstandingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card title="Total Sales" subtitle="Sum of completed invoices">
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-200">
              ₹{customer.totals.totalTransactionAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <div className="p-2 bg-slate-100 dark:bg-slate-900 text-slate-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card title="Total Payments Received" subtitle="Sum of customer receipts">
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-600">
              ₹{customer.totals.totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
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
            <Card title="Customer Information" className="lg:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm py-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">GSTIN</span>
                  <span className="font-mono font-bold text-slate-850 dark:text-slate-100 uppercase">{customer.gstNumber || "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Contact Person</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{customer.contactPerson || "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Primary Phone</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{customer.phone || "—"}</span>
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Alternate Phone</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{customer.altPhone || "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5 sm:col-span-2">
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Email Address</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{customer.email || "—"}</span>
                </div>
                <div className="flex flex-col gap-0.5 sm:col-span-2">
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Notes</span>
                  <span className="text-slate-600 dark:text-slate-400 italic">{customer.notes || "No notes registered."}</span>
                </div>
              </div>
            </Card>

            <Card title="Business Address">
              <div className="flex flex-col gap-3 text-sm py-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Street Address</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 leading-relaxed flex items-start gap-1.5">
                    <Building className="w-4.5 h-4.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>{customer.address || "—"}</span>
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">City & State</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{customer.city || "—"}{customer.state ? `, ${customer.state}` : ""}</span>
                  </span>
                </div>
                {customer.pincode && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Pincode</span>
                    <span className="font-mono font-semibold text-slate-850 dark:text-slate-100">{customer.pincode}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === "sales" && (
          <Card title="Sales Invoices History" subtitle="Invoices logged for this customer">
            {customer.sales && customer.sales.length > 0 ? (
              <Table
                headers={[
                  { key: "number", label: "Invoice No" },
                  { key: "date", label: "Date" },
                  { key: "itemsCount", label: "Items Count", className: "text-right" },
                  { key: "grandTotal", label: "Invoice Amount", className: "text-right" },
                  { key: "paymentStatus", label: "Payment Status" },
                  { key: "status", label: "Status" },
                ]}
                data={customer.sales}
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
              <div className="text-center py-10 text-slate-400 font-semibold">No sales recorded.</div>
            )}
          </Card>
        )}

        {activeTab === "payments" && (
          <Card title="Receipts Ledger" subtitle="Payments received from this customer">
            {customer.payments && customer.payments.length > 0 ? (
              <Table
                headers={[
                  { key: "number", label: "Receipt No" },
                  { key: "date", label: "Receipt Date" },
                  { key: "amount", label: "Amount Received", className: "text-right" },
                  { key: "method", label: "Method" },
                  { key: "status", label: "Status" },
                ]}
                data={customer.payments}
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
              <div className="text-center py-10 text-slate-400 font-semibold">No receipts recorded.</div>
            )}
          </Card>
        )}

        {activeTab === "products" && (
          <Card title="Sold Products" subtitle="Unique articles sold to this customer">
            {customer.products && customer.products.length > 0 ? (
              <Table
                headers={[
                  { key: "code", label: "SKU / Code" },
                  { key: "name", label: "Product Name" },
                  { key: "volumeMl", label: "Volume capacity" },
                  { key: "color", label: "Color / Style" },
                  { key: "lastRate", label: "Last Selling Rate", className: "text-right" },
                ]}
                data={customer.products}
                keyField="id"
                renderCell={(item: any, key: string) => {
                  if (key === "lastRate") return <span className="font-bold">₹{item.lastRate.toLocaleString()}</span>;
                  return <span>{item[key] || "—"}</span>;
                }}
              />
            ) : (
              <div className="text-center py-10 text-slate-400 font-semibold">No sales history items.</div>
            )}
          </Card>
        )}

        {activeTab === "ledger" && (
          <Card title="Customer Ledger timeline" subtitle="Combined invoices and receipts chronologically">
            {customer.recentTransactions && customer.recentTransactions.length > 0 ? (
              <div className="flow-root py-2">
                <ul className="-mb-8">
                  {customer.recentTransactions.map((tx: any, idx: number) => {
                    const isInvoice = tx.type === "INVOICE";
                    const isCompleted = tx.status === "COMPLETED";

                    return (
                      <li key={tx.id}>
                        <div className="relative pb-8">
                          {idx !== customer.recentTransactions.length - 1 ? (
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
                                <span className={`font-extrabold text-base ${isInvoice ? "text-red-650" : "text-emerald-600"}`}>
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
              <div className="text-center py-10 text-slate-400 font-semibold">No transactions recorded.</div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
