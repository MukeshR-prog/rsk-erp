"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, FileText, Layers, Eye } from "lucide-react";
import { Button } from "@heroui/react";
import Link from "next/link";
import toast from "react-hot-toast";

import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import BomStatusBadge from "@/components/erp/bom/BomStatusBadge";
import { BomForm } from "@/components/erp/bom/BomForm";

import {
  getRecipes,
  getFinishedGoodsList,
  getRawMaterialsList,
  createRecipeAction,
} from "@/features/manufacturing/bom/actions";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function BOMRegistryPage({ searchParams }: PageProps) {
  const router = useRouter();
  const searchParamsResolved = use(searchParams);
  const triggerNew = searchParamsResolved.new === "true";

  // Core State
  const [recipes, setRecipes] = useState<any[]>([]);
  const [finishedGoods, setFinishedGoods] = useState<any[]>([]);
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form Drawer Trigger State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitPending, setIsSubmitPending] = useState(false);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const activeStatus = statusFilter === "ACTIVE" ? true : statusFilter === "INACTIVE" ? false : undefined;
      const [rRes, fgRes, rmRes] = await Promise.all([
        getRecipes({
          search,
          isActive: activeStatus,
          page,
          limit: 10,
        }),
        getFinishedGoodsList(),
        getRawMaterialsList(),
      ]);

      if (rRes.success && rRes.data) {
        setRecipes(rRes.data.items || []);
        setTotalPages(rRes.data.totalPages || 1);
      } else {
        toast.error(rRes.error || "Failed to load BOM recipes list.");
      }

      if (fgRes.success && fgRes.data) {
        setFinishedGoods(fgRes.data);
      }
      if (rmRes.success && rmRes.data) {
        setRawMaterials(rmRes.data);
      }
    } catch (error) {
      console.error("loadData error:", error);
      toast.error("Error fetching BOM registry data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, statusFilter]);

  // Handle new recipe trigger from URL parameters
  useEffect(() => {
    if (triggerNew && finishedGoods.length > 0) {
      setIsFormOpen(true);
      // Remove query param to prevent reopen on reload
      router.replace("/manufacturing/bom");
    }
  }, [triggerNew, finishedGoods, router]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleCreateSubmit = async (values: any) => {
    setIsSubmitPending(true);
    try {
      const res = await createRecipeAction(values);
      if (res.success) {
        toast.success(`BOM Recipe "${values.name}" created successfully!`);
        setIsFormOpen(false);
        setPage(1);
        loadData();
      } else {
        toast.error(res.error || "Failed to create recipe.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while creating recipe.");
    } finally {
      setIsSubmitPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="BOM Recipes"
        subtitle="Manage bill of materials templates and finished goods raw ingredient proportions"
        action={
          <Button
            variant="primary"
            onPress={() => setIsFormOpen(true)}
            className="w-full sm:w-auto font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-none"
            size="md"
          >
            <Plus className="w-4.5 h-4.5 mr-1.5" />
            <span>Create BOM Recipe</span>
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-2.5">
          <Button
            variant={statusFilter === "" ? "primary" : "outline"}
            onPress={() => {
              setPage(1);
              setStatusFilter("");
            }}
            className="rounded-xl font-bold text-xs"
            size="sm"
          >
            All Statuses
          </Button>
          <Button
            variant={statusFilter === "ACTIVE" ? "primary" : "outline"}
            onPress={() => {
              setPage(1);
              setStatusFilter("ACTIVE");
            }}
            className="rounded-xl font-bold text-xs"
            size="sm"
          >
            Active Only
          </Button>
          <Button
            variant={statusFilter === "INACTIVE" ? "primary" : "outline"}
            onPress={() => {
              setPage(1);
              setStatusFilter("INACTIVE");
            }}
            className="rounded-xl font-bold text-xs"
            size="sm"
          >
            Inactive Only
          </Button>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:max-w-xs">
          <div className="relative flex items-center w-full">
            <Search className="absolute left-3.5 text-slate-400 w-4.5 h-4.5" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-xl border border-slate-200 focus:border-slate-900 bg-white dark:border-slate-800 dark:bg-slate-950 dark:focus:border-slate-100 outline-none text-sm transition-all font-semibold"
            />
          </div>
          <Button type="submit" variant="outline" className="rounded-xl font-bold text-xs">
            Search
          </Button>
        </form>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 font-semibold">
          Loading BOM Recipes...
        </div>
      ) : recipes.length === 0 ? (
        <EmptyState
          title="No BOM Recipes found"
          description="Build recipes to define structural material consumptions for manufacturing products."
          icon={Layers}
          action={
            <Button
              variant="outline"
              onPress={() => setIsFormOpen(true)}
              className="font-bold rounded-xl"
            >
              Add First Recipe
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Desktop Table View */}
          <div className="hidden md:block w-full overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-850">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-850">
                  <th className="px-5 py-4 font-bold text-slate-600 dark:text-slate-400">Recipe Name</th>
                  <th className="px-5 py-4 font-bold text-slate-600 dark:text-slate-400">Finished Product</th>
                  <th className="px-5 py-4 font-bold text-slate-600 dark:text-slate-400 text-center">Ingredients</th>
                  <th className="px-5 py-4 font-bold text-slate-600 dark:text-slate-400 text-right">Waste Allowance</th>
                  <th className="px-5 py-4 font-bold text-slate-600 dark:text-slate-400">Status</th>
                  <th className="px-5 py-4 font-bold text-slate-600 dark:text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 bg-white dark:bg-slate-950">
                {recipes.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {item.finishedProductName}
                        </span>
                        <span className="text-xs text-slate-500">
                          Code: {item.finishedProductCode}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center font-extrabold text-slate-700 dark:text-slate-350">
                      {item.itemCount} Items
                    </td>
                    <td className="px-5 py-4 text-right font-extrabold text-slate-800 dark:text-slate-300">
                      {item.wasteFactorPercent.toFixed(2)}%
                    </td>
                    <td className="px-5 py-4">
                      <BomStatusBadge isActive={item.isActive} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/manufacturing/bom/${item.id}`}>
                        <Button
                          variant="ghost"
                          className="h-8 rounded-lg text-emerald-600 hover:text-emerald-700 font-bold border-none shadow-none text-xs"
                          size="sm"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          <span>View Detail</span>
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {recipes.map((item) => (
              <Card key={item.id} className="border-l-4 border-l-emerald-500">
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-slate-905 dark:text-white truncate">
                        {item.name}
                      </span>
                      <span className="text-xs text-slate-450 dark:text-slate-500 truncate mt-0.5">
                        Output: {item.finishedProductName}
                      </span>
                    </div>
                    <BomStatusBadge isActive={item.isActive} />
                  </div>
                  <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 dark:border-slate-850">
                    <span className="text-xs font-semibold text-slate-400">
                      Inputs: {item.itemCount} items • Waste: {item.wasteFactorPercent.toFixed(1)}%
                    </span>
                    <Link href={`/manufacturing/bom/${item.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-emerald-600 hover:text-emerald-700 font-bold border-none shadow-none text-xs"
                      >
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
              <span className="text-xs text-slate-550 font-bold">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-lg text-xs font-bold"
                  isDisabled={page === 1}
                  onPress={() => setPage((p: number) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-lg text-xs font-bold"
                  isDisabled={page === totalPages}
                  onPress={() => setPage((p: number) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bom Creation Form Drawer Modal */}
      {isFormOpen && (
        <BomForm
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleCreateSubmit}
          finishedGoods={finishedGoods}
          rawMaterials={rawMaterials}
          isPending={isSubmitPending}
        />
      )}
    </div>
  );
}
