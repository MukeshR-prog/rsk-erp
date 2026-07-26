"use server";

import { revalidatePath } from "next/cache";
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

const manufacturingSaleSchema = z.object({
  amount: z.number().positive("Sales amount must be greater than zero"),
  description: z.string().nullable().optional(),
  saleDate: z.preprocess((val) => new Date(val as string), z.date()),
});

const editManufacturingSaleSchema = manufacturingSaleSchema.extend({
  id: z.string().uuid("Invalid sale ID"),
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
// Manufacturing Sales Revenue Actions
// =========================================================================

export async function createManufacturingSaleAction(rawData: any) {
  try {
    const validated = manufacturingSaleSchema.parse(rawData);
    const sale = await ManufacturingService.createManufacturingSale(validated);

    revalidatePath("/manufacturing/sales");
    revalidatePath("/manufacturing/reports");
    revalidatePath("/manufacturing"); // dashboard
    return { success: true, data: sale };
  } catch (error: any) {
    console.error("createManufacturingSaleAction failed:", error);
    return { success: false, error: error.errors?.[0]?.message || error.message || "Failed to log manufacturing sale" };
  }
}

export async function updateManufacturingSaleAction(rawData: any) {
  try {
    const validated = editManufacturingSaleSchema.parse(rawData);
    const sale = await ManufacturingService.updateManufacturingSale(validated);

    revalidatePath("/manufacturing/sales");
    revalidatePath("/manufacturing/reports");
    revalidatePath("/manufacturing"); // dashboard
    return { success: true, data: sale };
  } catch (error: any) {
    console.error("updateManufacturingSaleAction failed:", error);
    return { success: false, error: error.errors?.[0]?.message || error.message || "Failed to update manufacturing sale" };
  }
}

export async function deleteManufacturingSaleAction(id: string) {
  try {
    await ManufacturingService.deleteManufacturingSale(id);

    revalidatePath("/manufacturing/sales");
    revalidatePath("/manufacturing/reports");
    revalidatePath("/manufacturing"); // dashboard
    return { success: true };
  } catch (error: any) {
    console.error("deleteManufacturingSaleAction failed:", error);
    return { success: false, error: error.message || "Failed to delete manufacturing sale" };
  }
}

export async function getManufacturingSalesAction(params: {
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const start = params.startDate ? new Date(params.startDate) : undefined;
    const end = params.endDate ? new Date(params.endDate) : undefined;

    const res = await ManufacturingService.getManufacturingSales({
      search: params.search,
      startDate: start,
      endDate: end,
      page: params.page,
      pageSize: params.pageSize,
    });

    return { success: true, data: res };
  } catch (error: any) {
    console.error("getManufacturingSalesAction failed:", error);
    return { success: false, error: error.message || "Failed to load manufacturing sales" };
  }
}
