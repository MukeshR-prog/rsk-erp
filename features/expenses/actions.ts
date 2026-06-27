"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function handlePrismaError(error: any, defaultMsg: string): string {
  if (error && error.code === "P2002") {
    const target = error.meta?.target;
    const targetStr = JSON.stringify(target).toLowerCase();
    if (targetStr.includes("phone")) {
      return "A contact with this phone number already exists.";
    }
    if (targetStr.includes("email")) {
      return "A contact with this email address already exists.";
    }
    if (targetStr.includes("code")) {
      return "A product with this SKU already exists.";
    }
    if (targetStr.includes("name")) {
      return "This name already exists.";
    }
    return "A duplicate record was detected.";
  }
  return String(error?.message || defaultMsg);
}

export async function getExpenseCategories(params: {
  search?: string;
  page?: number;
  pageSize?: number;
  showInactive?: boolean;
}) {
  try {
    const { search = "", page = 1, pageSize = 10, showInactive = false } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (search) {
      where.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (!showInactive) {
      where.isActive = true;
    }

    const [items, total] = await Promise.all([
      prisma.expenseCategory.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.expenseCategory.count({ where }),
    ]);

    return {
      success: true,
      data: items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error("getExpenseCategories failed:", error);
    return {
      success: false,
      error: String(error),
      data: [],
      meta: { total: 0, page: 1, pageSize: 10, totalPages: 0 },
    };
  }
}

export async function createExpenseCategory(name: string) {
  try {
    const item = await prisma.expenseCategory.create({
      data: { name },
    });

    revalidatePath("/master-data/expense-categories");
    return {
      success: true,
      data: {
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("createExpenseCategory failed:", error);
    return { success: false, error: handlePrismaError(error, "Failed to create category.") };
  }
}

export async function updateExpenseCategory(id: string, name: string) {
  try {
    const item = await prisma.expenseCategory.update({
      where: { id },
      data: { name },
    });

    revalidatePath("/master-data/expense-categories");
    return {
      success: true,
      data: {
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("updateExpenseCategory failed:", error);
    return { success: false, error: handlePrismaError(error, "Failed to update category.") };
  }
}

// Backward compatible wrapper
export async function upsertExpenseCategory(data: { id?: string; name: string }) {
  if (data.id) {
    return updateExpenseCategory(data.id, data.name);
  } else {
    return createExpenseCategory(data.name);
  }
}

export async function toggleExpenseCategoryStatus(id: string, isActive: boolean) {
  try {
    const item = await prisma.expenseCategory.update({
      where: { id },
      data: { isActive },
    });

    revalidatePath("/master-data/expense-categories");
    return {
      success: true,
      data: {
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("toggleExpenseCategoryStatus failed:", error);
    return { success: false, error: String(error) };
  }
}
