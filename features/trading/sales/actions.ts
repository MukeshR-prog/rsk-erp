"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { SaleFilters } from "./types";
import { saleSchema, CreateSaleDTO, EditSaleDTO } from "./validations";
import { SaleService } from "./sale.service";
import { createServerClient } from "@/lib/supabase/server";

/**
 * Helper to fetch the authenticated user ID on the server.
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (err) {
    console.error("getCurrentUserId failed:", err);
    return null;
  }
}

/**
 * Fetch sales list with pagination, search, and status filters.
 */
export async function getSalesAction(filters: SaleFilters) {
  try {
    const data = await SaleService.getSales(filters, prisma);
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error("getSalesAction failed:", error);
    return {
      success: false,
      error: error.message || "Failed to retrieve sales records.",
    };
  }
}

/**
 * Fetch a single sale invoice by ID.
 */
export async function getSaleDetailsAction(id: string) {
  try {
    const raw = await SaleService.getSale(id, prisma);
    if (!raw) {
      return { success: false, error: "Sale invoice record not found." };
    }
    // Serialize all Decimal values to plain JS numbers
    const data = {
      ...raw,
      discount: Number(raw.discount),
      transportCharges: Number(raw.transportCharges),
      subtotal: Number(raw.subtotal),
      grandTotal: Number(raw.grandTotal),
      customer: raw.customer ? {
        ...raw.customer,
        openingBalance: Number(raw.customer.openingBalance),
        creditLimit: raw.customer.creditLimit ? Number(raw.customer.creditLimit) : null,
      } : null,
      items: (raw.items || []).map((item: any) => ({
        ...item,
        quantity: Number(item.quantity),
        sellingRate: Number(item.sellingRate),
        discount: Number(item.discount ?? 0),
        lineTotal: Number(item.lineTotal ?? 0),
      })),
      payments: (raw.payments || []).map((p: any) => ({
        ...p,
        amount: Number(p.amount),
      })),
    };
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error("getSaleDetailsAction failed:", error);
    return {
      success: false,
      error: error.message || "Failed to retrieve sale details.",
    };
  }
}

/**
 * Creates a new customer sale invoice transaction.
 */
export async function createSaleAction(data: CreateSaleDTO) {
  try {
    const validated = saleSchema.parse(data);

    const sale = await prisma.$transaction(async (tx) => {
      return await SaleService.createSale(validated, tx);
    });

    revalidatePath("/trading/sales");
    revalidatePath("/trading");

    return {
      success: true,
      data: {
        id: sale.id,
        saleNumber: sale.saleNumber,
      },
    };
  } catch (error: any) {
    console.error("createSaleAction failed:", error);
    if (error.name === "ZodError") {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: error.message || "Failed to log sale." };
  }
}

/**
 * Edits / revises a customer sale invoice transaction.
 */
export async function editSaleAction(id: string, data: EditSaleDTO) {
  try {
    const validated = saleSchema.parse(data);

    const sale = await prisma.$transaction(async (tx) => {
      return await SaleService.editSale(id, validated, tx);
    });

    revalidatePath("/trading/sales");
    revalidatePath(`/trading/sales/${id}`);
    revalidatePath("/trading");

    return {
      success: true,
      data: {
        id: sale.id,
        saleNumber: sale.saleNumber,
      },
    };
  } catch (error: any) {
    console.error("editSaleAction failed:", error);
    if (error.name === "ZodError") {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: error.message || "Failed to update sale." };
  }
}

/**
 * Cancels a completed customer sale invoice.
 */
export async function cancelSaleAction(id: string, cancellationReason: string) {
  try {
    const userId = await getCurrentUserId();

    const sale = await prisma.$transaction(async (tx) => {
      return await SaleService.cancelSale(id, cancellationReason, userId || "system", tx);
    });

    revalidatePath("/trading/sales");
    revalidatePath(`/trading/sales/${id}`);
    revalidatePath("/trading");

    return {
      success: true,
      data: {
        id: sale.id,
        saleNumber: sale.saleNumber,
      },
    };
  } catch (error: any) {
    console.error("cancelSaleAction failed:", error);
    return { success: false, error: error.message || "Failed to cancel sale." };
  }
}

/**
 * Fetch list of active customers.
 */
export async function getCustomersAction() {
  try {
    const data = await prisma.contact.findMany({
      where: { type: "CUSTOMER", isActive: true },
      select: { id: true, name: true, phone: true },
      orderBy: { name: "asc" },
    });
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch customers list." };
  }
}

/**
 * Fetch list of active products for sales lines selectors.
 */
export async function getProductsAction() {
  try {
    const data = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true, sellingPrice: true, currentStock: true, type: true, piecesPerBox: true },
      orderBy: { name: "asc" },
    });
    return {
      success: true,
      data: data.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        type: p.type,
        sellingPrice: p.sellingPrice ? Number(p.sellingPrice) : 0,
        currentStock: p.currentStock ? Number(p.currentStock) : 0,
        piecesPerBox: p.piecesPerBox || 1000,
      })),
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch products list." };
  }
}

/**
 * Fetch stock movements linked to a sale invoice.
 */
export async function getSaleStockMovementsAction(saleId: string) {
  try {
    const data = await prisma.stockMovement.findMany({
      where: { referenceId: saleId },
      include: {
        product: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return {
      success: true,
      data: data.map((sm) => ({
        ...sm,
        quantity: Number(sm.quantity),
      })),
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch stock movements." };
  }
}
