"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ManufacturingService } from "./manufacturing.service";
import { z } from "zod";

// Zod schemas for input validation
const expenseSchema = z.object({
  categoryId: z.string().min(1, "Expense category is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  notes: z.string().nullable().optional(),
  expenseDate: z.preprocess((val) => new Date(val as string), z.date()),
});

const editExpenseSchema = expenseSchema.extend({
  id: z.string().uuid("Invalid expense ID"),
});

const productionSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  boxesProduced: z.number().positive("Boxes produced must be greater than zero"),
  piecesPerBox: z.number().int().positive("Pieces per box must be a positive integer"),
  estimatedRate: z.number().nonnegative("Estimated rate must be positive or zero").default(0.0),
  notes: z.string().nullable().optional(),
  productionDate: z.preprocess((val) => new Date(val as string), z.date()),
});

const editProductionSchema = productionSchema.extend({
  id: z.string().uuid("Invalid production ID"),
});

// =========================================================================
// Manufacturing Expense Actions
// =========================================================================

export async function createExpenseAction(rawData: any) {
  try {
    const validated = expenseSchema.parse(rawData);
    const expense = await ManufacturingService.createExpense(validated);

    revalidatePath("/manufacturing/expenses");
    revalidatePath("/manufacturing"); // dashboard
    return { success: true, data: { ...expense, amount: Number(expense.amount) } };
  } catch (error: any) {
    console.error("createExpenseAction failed:", error);
    return { success: false, error: error.errors?.[0]?.message || error.message || "Failed to create expense" };
  }
}

export async function updateExpenseAction(rawData: any) {
  try {
    const validated = editExpenseSchema.parse(rawData);
    const expense = await ManufacturingService.updateExpense(validated);

    revalidatePath("/manufacturing/expenses");
    revalidatePath("/manufacturing"); // dashboard
    return { success: true, data: { ...expense, amount: Number(expense.amount) } };
  } catch (error: any) {
    console.error("updateExpenseAction failed:", error);
    return { success: false, error: error.errors?.[0]?.message || error.message || "Failed to update expense" };
  }
}

export async function deleteExpenseAction(id: string) {
  try {
    await ManufacturingService.deleteExpense(id);

    revalidatePath("/manufacturing/expenses");
    revalidatePath("/manufacturing"); // dashboard
    return { success: true };
  } catch (error: any) {
    console.error("deleteExpenseAction failed:", error);
    return { success: false, error: error.message || "Failed to delete expense" };
  }
}

export async function getExpensesAction(params: {
  search?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const start = params.startDate ? new Date(params.startDate) : undefined;
    const end = params.endDate ? new Date(params.endDate) : undefined;

    const res = await ManufacturingService.getExpenses({
      search: params.search,
      categoryId: params.categoryId,
      startDate: start,
      endDate: end,
      page: params.page,
      pageSize: params.pageSize,
    });

    return { success: true, data: res };
  } catch (error: any) {
    console.error("getExpensesAction failed:", error);
    return { success: false, error: error.message || "Failed to load expenses" };
  }
}

// =========================================================================
// Production Entry Actions
// =========================================================================

export async function createProductionEntryAction(rawData: any) {
  try {
    const validated = productionSchema.parse(rawData);
    const entry = await ManufacturingService.createProductionEntry(validated);

    revalidatePath("/manufacturing/production");
    revalidatePath("/manufacturing/stock");
    revalidatePath("/manufacturing"); // dashboard
    revalidatePath("/trading/stock"); // shared centralized stock
    return {
      success: true,
      data: {
        ...entry,
        boxesProduced: Number(entry.boxesProduced),
        totalPieces: Number(entry.totalPieces),
        estimatedRate: Number((entry as any).estimatedRate || 0.0),
      },
    };
  } catch (error: any) {
    console.error("createProductionEntryAction failed:", error);
    return { success: false, error: error.errors?.[0]?.message || error.message || "Failed to log production" };
  }
}

export async function updateProductionEntryAction(rawData: any) {
  try {
    const validated = editProductionSchema.parse(rawData);
    const entry = await ManufacturingService.updateProductionEntry(validated);

    revalidatePath("/manufacturing/production");
    revalidatePath("/manufacturing/stock");
    revalidatePath("/manufacturing"); // dashboard
    revalidatePath("/trading/stock"); // shared centralized stock
    return {
      success: true,
      data: {
        ...entry,
        boxesProduced: Number(entry.boxesProduced),
        totalPieces: Number(entry.totalPieces),
        estimatedRate: Number((entry as any).estimatedRate || 0.0),
      },
    };
  } catch (error: any) {
    console.error("updateProductionEntryAction failed:", error);
    return { success: false, error: error.errors?.[0]?.message || error.message || "Failed to update production" };
  }
}

export async function deleteProductionEntryAction(id: string) {
  try {
    await ManufacturingService.deleteProductionEntry(id);

    revalidatePath("/manufacturing/production");
    revalidatePath("/manufacturing/stock");
    revalidatePath("/manufacturing"); // dashboard
    revalidatePath("/trading/stock"); // shared centralized stock
    return { success: true };
  } catch (error: any) {
    console.error("deleteProductionEntryAction failed:", error);
    return { success: false, error: error.message || "Failed to delete production" };
  }
}

export async function getProductionEntriesAction(params: {
  search?: string;
  productId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const start = params.startDate ? new Date(params.startDate) : undefined;
    const end = params.endDate ? new Date(params.endDate) : undefined;

    const res = await ManufacturingService.getProductionEntries({
      search: params.search,
      productId: params.productId,
      startDate: start,
      endDate: end,
      page: params.page,
      pageSize: params.pageSize,
    });

    return { success: true, data: res };
  } catch (error: any) {
    console.error("getProductionEntriesAction failed:", error);
    return { success: false, error: error.message || "Failed to load production entries" };
  }
}

export async function getProductionProductsAction() {
  try {
    const items = await prisma.product.findMany({
      where: {
        isActive: true,
        type: { in: ["FINISHED_GOOD", "TRADING_PRODUCT"] }
      },
      select: {
        id: true,
        name: true,
        code: true,
        piecesPerBox: true
      },
      orderBy: { name: "asc" }
    });
    return {
      success: true,
      data: items.map((x: any) => ({
        ...x,
        piecesPerBox: x.piecesPerBox || 1000
      }))
    };
  } catch (error: any) {
    console.error("getProductionProductsAction failed:", error);
    return { success: false, error: error.message || "Failed to load production products" };
  }
}
