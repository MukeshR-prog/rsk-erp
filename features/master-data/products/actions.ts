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

export async function getProducts(params: {
  search?: string;
  page?: number;
  pageSize?: number;
  showInactive?: boolean;
  type?: "RAW_MATERIAL" | "FINISHED_GOOD" | "TRADING_PRODUCT" | "ALL";
  categoryId?: string;
  unitId?: string;
}) {
  try {
    const {
      search = "",
      page = 1,
      pageSize = 10,
      showInactive = false,
      type = "ALL",
      categoryId = "ALL",
      unitId = "ALL",
    } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    if (!showInactive) {
      where.isActive = true;
    }

    if (type !== "ALL") {
      where.type = type;
    }

    if (categoryId !== "ALL") {
      where.categoryId = categoryId;
    }

    if (unitId !== "ALL") {
      where.unitId = unitId;
    }

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: "asc" },
        include: {
          category: true,
          unit: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      success: true,
      data: items.map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        type: item.type,
        description: item.description,
        imageUrl: item.imageUrl,
        volumeMl: item.volumeMl,
        color: item.color,
        currentStock: Number(item.currentStock),
        averageCost: Number(item.averageCost),
        purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
        sellingPrice: item.sellingPrice ? Number(item.sellingPrice) : null,
        minStockAlert: item.minStockAlert ? Number(item.minStockAlert) : null,
        hsnCode: item.hsnCode,
        gstRate: item.gstRate ? Number(item.gstRate) : null,
        isActive: item.isActive,
        piecesPerBox: item.piecesPerBox,
        categoryId: item.categoryId,
        unitId: item.unitId,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        category: item.category ? { id: item.category.id, name: item.category.name } : null,
        unit: item.unit ? { id: item.unit.id, name: item.unit.name } : null,
      })),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error("getProducts failed:", error);
    return {
      success: false,
      error: String(error),
      data: [],
      meta: { total: 0, page: 1, pageSize: 10, totalPages: 0 },
    };
  }
}

export async function getProductDetails(id: string) {
  try {
    const item = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        unit: true,
      },
    });

    if (!item) {
      return { success: false, error: "Product not found." };
    }

    return {
      success: true,
      data: {
        id: item.id,
        code: item.code,
        name: item.name,
        type: item.type,
        description: item.description,
        imageUrl: item.imageUrl,
        volumeMl: item.volumeMl,
        color: item.color,
        currentStock: Number(item.currentStock),
        averageCost: Number(item.averageCost),
        purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
        sellingPrice: item.sellingPrice ? Number(item.sellingPrice) : null,
        minStockAlert: item.minStockAlert ? Number(item.minStockAlert) : null,
        hsnCode: item.hsnCode,
        gstRate: item.gstRate ? Number(item.gstRate) : null,
        isActive: item.isActive,
        piecesPerBox: item.piecesPerBox,
        categoryId: item.categoryId,
        unitId: item.unitId,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        category: item.category ? { id: item.category.id, name: item.category.name } : null,
        unit: item.unit ? { id: item.unit.id, name: item.unit.name } : null,
      },
    };
  } catch (error) {
    console.error("getProductDetails failed:", error);
    return { success: false, error: String(error) };
  }
}

export async function createProduct(data: {
  code: string;
  name: string;
  type: "RAW_MATERIAL" | "FINISHED_GOOD" | "TRADING_PRODUCT";
  description?: string;
  imageUrl?: string;
  volumeMl?: string;
  color?: string;
  purchasePrice?: number | null;
  sellingPrice?: number | null;
  minStockAlert?: number | null;
  categoryId?: string;
  unitId?: string;
  piecesPerBox?: number | null;
}) {
  try {
    const {
      code,
      name,
      type,
      description,
      imageUrl,
      volumeMl,
      color,
      purchasePrice,
      sellingPrice,
      minStockAlert,
      categoryId,
      unitId,
      piecesPerBox,
    } = data;

    const payload = {
      code,
      name,
      type,
      description: description || null,
      imageUrl: imageUrl || null,
      volumeMl: volumeMl || null,
      color: color || null,
      purchasePrice: purchasePrice ?? null,
      sellingPrice: sellingPrice ?? null,
      minStockAlert: minStockAlert ?? null,
      categoryId: categoryId || null,
      unitId: unitId || null,
      piecesPerBox: piecesPerBox ?? null,
    };

    const item = await prisma.product.create({
      data: {
        ...payload,
        currentStock: 0,
        averageCost: 0,
      },
    });

    revalidatePath("/master-data/products");
    return {
      success: true,
      data: {
        ...item,
        currentStock: Number(item.currentStock),
        averageCost: Number(item.averageCost),
        purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
        sellingPrice: item.sellingPrice ? Number(item.sellingPrice) : null,
        minStockAlert: item.minStockAlert ? Number(item.minStockAlert) : null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("createProduct failed:", error);
    return { success: false, error: handlePrismaError(error, "Failed to create product.") };
  }
}

export async function updateProduct(id: string, data: {
  code: string;
  name: string;
  type: "RAW_MATERIAL" | "FINISHED_GOOD" | "TRADING_PRODUCT";
  description?: string;
  imageUrl?: string;
  volumeMl?: string;
  color?: string;
  purchasePrice?: number | null;
  sellingPrice?: number | null;
  minStockAlert?: number | null;
  categoryId?: string;
  unitId?: string;
  piecesPerBox?: number | null;
}) {
  try {
    const {
      code,
      name,
      type,
      description,
      imageUrl,
      volumeMl,
      color,
      purchasePrice,
      sellingPrice,
      minStockAlert,
      categoryId,
      unitId,
      piecesPerBox,
    } = data;

    const payload = {
      code,
      name,
      type,
      description: description || null,
      imageUrl: imageUrl || null,
      volumeMl: volumeMl || null,
      color: color || null,
      purchasePrice: purchasePrice ?? null,
      sellingPrice: sellingPrice ?? null,
      minStockAlert: minStockAlert ?? null,
      categoryId: categoryId || null,
      unitId: unitId || null,
      piecesPerBox: piecesPerBox ?? null,
    };

    const item = await prisma.product.update({
      where: { id },
      data: payload,
    });

    revalidatePath("/master-data/products");
    revalidatePath(`/master-data/products/${id}`);

    return {
      success: true,
      data: {
        ...item,
        currentStock: Number(item.currentStock),
        averageCost: Number(item.averageCost),
        purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
        sellingPrice: item.sellingPrice ? Number(item.sellingPrice) : null,
        minStockAlert: item.minStockAlert ? Number(item.minStockAlert) : null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("updateProduct failed:", error);
    return { success: false, error: handlePrismaError(error, "Failed to update product.") };
  }
}

// Backward compatible wrapper
export async function upsertProduct(data: {
  id?: string;
  code: string;
  name: string;
  type: "RAW_MATERIAL" | "FINISHED_GOOD" | "TRADING_PRODUCT";
  description?: string;
  imageUrl?: string;
  volumeMl?: string;
  color?: string;
  purchasePrice?: number | null;
  sellingPrice?: number | null;
  minStockAlert?: number | null;
  categoryId?: string;
  unitId?: string;
  piecesPerBox?: number | null;
}) {
  const { id, ...payload } = data;
  if (id) {
    return updateProduct(id, payload);
  } else {
    return createProduct(payload);
  }
}

export async function toggleProductStatus(id: string, isActive: boolean) {
  try {
    const item = await prisma.product.update({
      where: { id },
      data: { isActive },
    });

    revalidatePath("/master-data/products");
    revalidatePath(`/master-data/products/${id}`);

    return {
      success: true,
      data: {
        ...item,
        currentStock: Number(item.currentStock),
        averageCost: Number(item.averageCost),
        purchasePrice: item.purchasePrice ? Number(item.purchasePrice) : null,
        sellingPrice: item.sellingPrice ? Number(item.sellingPrice) : null,
        minStockAlert: item.minStockAlert ? Number(item.minStockAlert) : null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("toggleProductStatus failed:", error);
    return { success: false, error: String(error) };
  }
}

// Helpers for loaders
export async function getProductCategoriesList() {
  try {
    const items = await prisma.productCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return items;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getUnitsList() {
  try {
    const items = await prisma.unit.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return items;
  } catch (error) {
    console.error(error);
    return [];
  }
}
