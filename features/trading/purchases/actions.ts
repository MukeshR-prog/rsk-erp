"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PurchaseFilters } from "./types";
import { purchaseSchema } from "./validations";
import { PurchaseService } from "./purchase.service";
import { PurchaseStatus, PurchasePaymentStatus } from "@prisma/client";

/**
 * Fetch purchases list with pagination, search, and filters.
 */
export async function getPurchases(filters: PurchaseFilters) {
  try {
    const data = await PurchaseService.getPurchases(filters, prisma);
    return {
      success: true,
      data: data.items,
      pagination: {
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages,
      },
    };
  } catch (error: any) {
    console.error("getPurchases error:", error);
    return {
      success: false,
      error: "Failed to fetch purchases.",
    };
  }
}

/**
 * Fetch a single purchase invoice with complete details.
 */
export async function getPurchaseDetails(id: string) {
  try {
    const data = await PurchaseService.getPurchaseDetails(id, prisma);
    if (!data) {
      return { success: false, error: "Purchase not found." };
    }
    return { success: true, data };
  } catch (error: any) {
    console.error("getPurchaseDetails error:", error);
    return { success: false, error: "Failed to load purchase details." };
  }
}

/**
 * Create a new purchase invoice.
 */
export async function createPurchase(rawData: any) {
  try {
    // 1. Zod Validation
    const parsed = purchaseSchema.safeParse(rawData);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join(", ");
      return { success: false, error: messages };
    }

    const values = parsed.data;

    // 2. Database transaction wrapper
    const result = await prisma.$transaction(async (tx) => {
      return await PurchaseService.createPurchase(values, tx);
    });

    revalidatePath("/trading/purchases");
    revalidatePath("/trading");

    return { success: true, data: { id: result.id, purchaseNumber: result.purchaseNumber } };
  } catch (error: any) {
    console.error("createPurchase action error:", error);
    return {
      success: false,
      error: error.message || "Failed to create purchase invoice.",
    };
  }
}

/**
 * Cancel a completed purchase invoice.
 * Reverses stock levels.
 */
export async function cancelPurchase(id: string) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      return await PurchaseService.cancelPurchase(id, tx);
    });

    revalidatePath("/trading/purchases");
    revalidatePath(`/trading/purchases/${id}`);
    revalidatePath("/trading");

    return { success: true, data: { id: result.id, status: result.status } };
  } catch (error: any) {
    console.error("cancelPurchase action error:", error);
    return { success: false, error: error.message || "Failed to cancel purchase invoice." };
  }
}

/**
 * Fetch list of suppliers for select selectors.
 */
export async function getSuppliersList() {
  try {
    const list = await prisma.contact.findMany({
      where: {
        type: "SUPPLIER",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    return { success: true, data: list };
  } catch (error) {
    console.error("getSuppliersList error:", error);
    return { success: false, error: "Failed to load suppliers." };
  }
}

/**
 * Fetch list of active products for purchase creation dropdown.
 */
export async function getProductsList() {
  try {
    const list = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        volumeMl: true,
        color: true,
        purchasePrice: true,
        unitId: true,
        unit: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
    return {
      success: true,
      data: list.map((p: any) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        type: p.type,
        volumeMl: p.volumeMl,
        color: p.color,
        purchasePrice: p.purchasePrice ? Number(p.purchasePrice) : 0,
        unitId: p.unitId || "",
        unitName: p.unit?.name || "PCS",
      })),
    };
  } catch (error) {
    console.error("getProductsList error:", error);
    return { success: false, error: "Failed to load products." };
  }
}
