"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
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
import { Edit, Trash2, CheckCircle, Package, FileText, Info } from "lucide-react";
import toast from "react-hot-toast";
import {
  getProductDetails,
  upsertProduct,
  toggleProductStatus,
  getProductCategoriesList,
  getUnitsList,
} from "@/features/master-data/products/actions";
import { productSchema, ProductFormValues } from "@/features/master-data/products/validations";
import CategorySelector from "@/components/ui/CategorySelector";
import UnitSelector from "@/components/ui/UnitSelector";
import { PriceInput } from "@/components/ui/form/PriceInput";
import { QuantityInput } from "@/components/ui/form/QuantityInput";

interface ProductData {
  id: string;
  code: string;
  name: string;
  type: "RAW_MATERIAL" | "FINISHED_GOOD" | "TRADING_PRODUCT";
  description?: string | null;
  volumeMl?: string | null;
  color?: string | null;
  currentStock: number;
  averageCost: number;
  purchasePrice?: number | null;
  sellingPrice?: number | null;
  minStockAlert?: number | null;
  categoryId?: string | null;
  unitId?: string | null;
  isActive: boolean;
  category?: { name: string } | null;
  unit?: { name: string } | null;
}

interface DropdownOption {
  id: string;
  name: string;
}

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [product, setProduct] = useState<ProductData | null>(null);
  const [categories, setCategories] = useState<DropdownOption[]>([]);
  const [units, setUnits] = useState<DropdownOption[]>([]);
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
    watch,
    control,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(productSchema),
  });

  const renderError = (err: any) => {
    if (!err || !err.message) return null;
    return <span className="text-xs text-red-500 mt-0.5">{String(err.message)}</span>;
  };

  const selectedType = watch("type");

  const loadDataOptions = async () => {
    const [catsRes, unitsRes] = await Promise.all([
      getProductCategoriesList(),
      getUnitsList(),
    ]);
    setCategories(catsRes);
    setUnits(unitsRes);
  };

  const loadProduct = async () => {
    try {
      setLoading(true);
      const res = await getProductDetails(id);
      if (res.success && res.data) {
        setProduct(res.data as ProductData);
      } else {
        toast.error(res.error || "Failed to load product");
        router.push("/master-data/products");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDataOptions();
    loadProduct();
  }, [id]);

  const handleOpenForm = () => {
    if (!product) return;
    setValue("code", product.code);
    setValue("name", product.name);
    setValue("type", product.type);
    setValue("description", product.description || "");
    setValue("volumeMl", product.volumeMl || "");
    setValue("color", product.color || "");
    setValue("purchasePrice", product.purchasePrice || null);
    setValue("sellingPrice", product.sellingPrice || null);
    setValue("minStockAlert", product.minStockAlert || null);
    setValue("categoryId", product.categoryId || "");
    setValue("unitId", product.unitId || "");
    setIsFormOpen(true);
  };

  const onSave = async (values: any) => {
    try {
      setFormPending(true);
      const res = await upsertProduct({
        id,
        ...values,
      });

      if (res.success) {
        toast.success("Product updated");
        setIsFormOpen(false);
        loadProduct();
      } else {
        toast.error(res.error || "Failed to save product");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setFormPending(false);
    }
  };

  const handleToggleActive = async () => {
    if (!product) return;
    try {
      const targetState = !product.isActive;
      const res = await toggleProductStatus(product.id, targetState);

      if (res.success) {
        toast.success(targetState ? "Product activated" : "Product soft-deleted");
        loadProduct();
      } else {
        toast.error(res.error || "Failed to update status");
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
        Loading product details...
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="flex flex-col gap-6">
      <Header
        title={`[${product.code}] ${product.name}`}
        subtitle={`${product.type.replace("_", " ")} Catalog Profile`}
        backHref="/master-data/products"
        action={
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onPress={handleOpenForm}
              className="flex-1 sm:flex-initial font-semibold rounded-xl"
            >
              <Edit className="w-4 h-4 mr-1.5" />
              <span>Edit Details</span>
            </Button>
            <Button
              variant={product.isActive ? "danger" : "outline"}
              onPress={() => setConfirmOpen(true)}
              className="flex-1 sm:flex-initial font-semibold rounded-xl"
            >
              {product.isActive ? (
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
          { id: "details", label: "Details" },
          { id: "purchases", label: "Purchases" },
          { id: "sales", label: "Sales" },
          { id: "production", label: "Production Batches" },
          { id: "stock", label: "Stock History" },
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
            <Card title="Product Information" className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm py-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    Product Code
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-100 uppercase">
                    {product.code}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    Product Type
                  </span>
                  <span
                    className={`inline-flex self-start px-2.5 py-0.5 mt-1 rounded-full text-xs font-semibold ${
                      product.type === "RAW_MATERIAL"
                        ? "bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-400"
                        : product.type === "FINISHED_GOOD"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                    }`}
                  >
                    {product.type.replace("_", " ")}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    Category
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {product.category?.name || "—"}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    Measurement Unit
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {product.unit?.name || "—"}
                  </span>
                </div>

                {(product.type === "FINISHED_GOOD" || product.type === "TRADING_PRODUCT") && (
                  <>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                        Volume Capacity
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {product.volumeMl || "—"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                        Color / Style
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {product.color || "—"}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-0.5 col-span-1 md:col-span-2">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    Description
                  </span>
                  <span className="text-slate-700 dark:text-slate-200">
                    {product.description || "No description recorded."}
                  </span>
                </div>
              </div>
            </Card>

            {/* Stock and Price Card */}
            <Card title="Inventory & Pricing">
              <div className="flex flex-col gap-4 text-sm py-2">
                <div className="flex flex-col gap-0.5 bg-slate-50 dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    Current Stock (Read Only)
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white text-2xl mt-1">
                    {product.currentStock} {product.unit?.name || ""}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    Default Purchase Price
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                    {product.purchasePrice !== null && product.purchasePrice !== undefined ? `₹${product.purchasePrice.toLocaleString()}` : "—"}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    Default Selling Price
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                    {product.sellingPrice !== null && product.sellingPrice !== undefined ? `₹${product.sellingPrice.toLocaleString()}` : "—"}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    Average Unit Cost (WAC)
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-350 font-bold">
                    ₹{product.averageCost.toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                    Min Stock Alert Level
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-350">
                    {product.minStockAlert !== null && product.minStockAlert !== undefined ? `${product.minStockAlert} ${product.unit?.name || ""}` : "—"}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "purchases" && (
          <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-350">Purchase Invoices</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mt-2">
              Purchase invoice records and supplier bills detailing imports of this product will show here after Phase 3 (Trading) is completed.
            </p>
          </div>
        )}

        {activeTab === "sales" && (
          <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-350">Sales History</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mt-2">
              Customer billing invoices containing transactions of this product will show here after Phase 3 (Trading) is completed.
            </p>
          </div>
        )}

        {activeTab === "production" && (
          <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-350">Production Logs</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mt-2">
              Manufacturing production logs showing finished goods outputs or raw material consumption batches will appear here after Phase 4.
            </p>
          </div>
        )}

        {activeTab === "stock" && (
          <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <Info className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-350">Stock Movements</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mt-2">
              Stock movement ledger statements tracking purchase additions, production outputs, and sales reductions will show here after Phase 3/4.
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
                    Edit Product Details
                  </span>
                </ModalHeader>
                <ModalBody className="px-6 py-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        Product Code *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. PC-150-RED"
                        {...register("code")}
                        className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-950 ${
                          errors.code ? "border-red-500" : "border-slate-200 dark:border-slate-800"
                        }`}
                      />
                      {renderError(errors.code)}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Paper Cup 150ml Red"
                        {...register("name")}
                        className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-950 ${
                          errors.name ? "border-red-500" : "border-slate-200 dark:border-slate-800"
                        }`}
                      />
                      {renderError(errors.name)}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        Product Type *
                      </label>
                      <select
                        {...register("type")}
                        className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950 dark:focus:border-slate-100 transition-all font-semibold"
                      >
                        <option value="RAW_MATERIAL">RAW MATERIAL</option>
                        <option value="FINISHED_GOOD">FINISHED GOOD</option>
                        <option value="TRADING_PRODUCT">TRADING PRODUCT</option>
                      </select>
                      {renderError(errors.type)}
                    </div>

                    <Controller
                      name="categoryId"
                      control={control}
                      render={({ field }) => (
                        <CategorySelector
                          categories={categories}
                          selectedKey={field.value || ""}
                          onSelectionChange={field.onChange}
                          isInvalid={!!errors.categoryId}
                          errorMessage={errors.categoryId?.message as string}
                          label="Product Category"
                        />
                      )}
                    />

                    <Controller
                      name="unitId"
                      control={control}
                      render={({ field }) => (
                        <UnitSelector
                          units={units}
                          selectedKey={field.value || ""}
                          onSelectionChange={field.onChange}
                          isInvalid={!!errors.unitId}
                          errorMessage={errors.unitId?.message as string}
                          label="Unit of Measure"
                        />
                      )}
                    />

                    <QuantityInput
                      label="Min Stock Alert Level"
                      placeholder="e.g. 50"
                      error={errors.minStockAlert}
                      {...register("minStockAlert", { valueAsNumber: true })}
                    />

                    <PriceInput
                      label="Default Buy Price (₹)"
                      placeholder="e.g. 1.20"
                      error={errors.purchasePrice}
                      {...register("purchasePrice", { valueAsNumber: true })}
                    />

                    <PriceInput
                      label="Default Sell Price (₹)"
                      placeholder="e.g. 1.80"
                      error={errors.sellingPrice}
                      {...register("sellingPrice", { valueAsNumber: true })}
                    />

                    {(selectedType === "FINISHED_GOOD" || selectedType === "TRADING_PRODUCT") && (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                            Volume Capacity (ml)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 150ml"
                            {...register("volumeMl")}
                            className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-950 ${
                              errors.volumeMl ? "border-red-500" : "border-slate-200 dark:border-slate-800"
                            }`}
                          />
                          {renderError(errors.volumeMl)}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                            Color / Style
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Red / Multi-color"
                            {...register("color")}
                            className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-950 ${
                              errors.color ? "border-red-500" : "border-slate-200 dark:border-slate-800"
                            }`}
                          />
                          {renderError(errors.color)}
                        </div>
                      </>
                    )}

                    <div className="flex flex-col gap-1.5 col-span-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-350">
                        Product Description
                      </label>
                      <input
                        type="text"
                        placeholder="Brief specifications or notes..."
                        {...register("description")}
                        className="flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition-all font-semibold dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                      />
                      {renderError(errors.description)}
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
          title={product.isActive ? "Deactivate Product" : "Activate Product"}
          message={`Are you sure you want to ${
            product.isActive ? "deactivate" : "activate"
          } the product "${product.name}"?`}
          onConfirm={handleToggleActive}
          confirmText={product.isActive ? "Deactivate" : "Activate"}
          isDanger={product.isActive}
        />
      )}
    </div>
  );
}
