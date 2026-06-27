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

export async function getUnits(params: {
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
      prisma.unit.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.unit.count({ where }),
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
    console.error("getUnits failed:", error);
    return {
      success: false,
      error: String(error),
      data: [],
      meta: { total: 0, page: 1, pageSize: 10, totalPages: 0 },
    };
  }
}

export async function createUnit(name: string) {
  try {
    const item = await prisma.unit.create({
      data: { name },
    });

    revalidatePath("/master-data/units");
    return {
      success: true,
      data: {
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("createUnit failed:", error);
    return { success: false, error: handlePrismaError(error, "Failed to create unit.") };
  }
}

export async function updateUnit(id: string, name: string) {
  try {
    const item = await prisma.unit.update({
      where: { id },
      data: { name },
    });

    revalidatePath("/master-data/units");
    return {
      success: true,
      data: {
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("updateUnit failed:", error);
    return { success: false, error: handlePrismaError(error, "Failed to update unit.") };
  }
}

// Backward compatible wrapper
export async function upsertUnit(data: { id?: string; name: string }) {
  if (data.id) {
    return updateUnit(data.id, data.name);
  } else {
    return createUnit(data.name);
  }
}

export async function toggleUnitStatus(id: string, isActive: boolean) {
  try {
    if (!isActive) {
      const activeProductsCount = await prisma.product.count({
        where: { unitId: id, isActive: true },
      });

      if (activeProductsCount > 0) {
        return {
          success: false,
          error: `Cannot deactivate. ${activeProductsCount} active products are currently using this unit.`,
        };
      }
    }

    const item = await prisma.unit.update({
      where: { id },
      data: { isActive },
    });

    revalidatePath("/master-data/units");
    return {
      success: true,
      data: {
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("toggleUnitStatus failed:", error);
    return { success: false, error: String(error) };
  }
}
