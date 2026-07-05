"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { InventoryService } from "./inventory.service";
import { resolveDynamicProduct } from "@/features/shared/utils/dynamicOptions";
import { z } from "zod";

const adjustmentSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().refine((val) => val !== 0, { message: "Adjustment quantity cannot be zero" }),
  notes: z.string().optional(),
});

export async function createStockAdjustmentAction(rawData: any) {
  try {
    const validated = adjustmentSchema.parse(rawData);

    // Call service within a transaction
    const result = await prisma.$transaction(async (tx) => {
      let productId = validated.productId;
      if (productId.startsWith("NEW_OPTION:")) {
        productId = await resolveDynamicProduct(productId, tx, "TRADING_PRODUCT");
      }
      return await InventoryService.adjustStock(
        tx,
        productId,
        validated.quantity,
        "ADJUSTMENT",
        undefined,
        validated.notes || "Manual adjustment"
      );
    });

    revalidatePath("/trading/stock");
    revalidatePath("/manufacturing/stock");
    revalidatePath("/trading");
    revalidatePath("/manufacturing");
    return {
      success: true,
      data: {
        ...result,
        currentStock: Number(result.currentStock),
        averageCost: Number(result.averageCost),
        purchasePrice: result.purchasePrice ? Number(result.purchasePrice) : null,
        sellingPrice: result.sellingPrice ? Number(result.sellingPrice) : null,
        minStockAlert: result.minStockAlert ? Number(result.minStockAlert) : null,
        gstRate: result.gstRate ? Number(result.gstRate) : null,
      },
    };
  } catch (error: any) {
    console.error("createStockAdjustmentAction failed:", error);
    return { success: false, error: error.message || "Failed to make stock adjustment" };
  }
}

export async function getCentralizedStockAction(params: {
  search?: string;
  page?: number;
  pageSize?: number;
  type?: "FINISHED_GOOD" | "TRADING_PRODUCT" | "ALL";
}) {
  try {
    const { search = "", page = 1, pageSize = 10, type = "ALL" } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    if (type !== "ALL") {
      where.type = type;
    } else {
      where.type = { in: ["FINISHED_GOOD", "TRADING_PRODUCT"] };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.product.count({ where }),
    ]);

    const productIds = products.map((p) => p.id);

    // Group stock movements to derive totals exclusively from StockMovement (Centralized Stock Rule)
    const manufacturedAgg = await prisma.stockMovement.groupBy({
      by: ["productId"],
      where: {
        productId: { in: productIds },
        type: "PRODUCTION_OUTPUT",
      },
      _sum: { quantity: true },
    });

    const purchasedAgg = await prisma.stockMovement.groupBy({
      by: ["productId"],
      where: {
        productId: { in: productIds },
        type: "PURCHASE",
      },
      _sum: { quantity: true },
    });

    const soldAgg = await prisma.stockMovement.groupBy({
      by: ["productId"],
      where: {
        productId: { in: productIds },
        type: "SALE",
      },
      _sum: { quantity: true },
    });

    const manufacturedMap = new Map<string, number>();
    manufacturedAgg.forEach((agg) => {
      manufacturedMap.set(agg.productId, Number(agg._sum.quantity || 0));
    });

    const purchasedMap = new Map<string, number>();
    purchasedAgg.forEach((agg) => {
      purchasedMap.set(agg.productId, Number(agg._sum.quantity || 0));
    });

    const soldMap = new Map<string, number>();
    soldAgg.forEach((agg) => {
      soldMap.set(agg.productId, Math.abs(Number(agg._sum.quantity || 0)));
    });

    const list = products.map((p) => {
      const currentStock = Number(p.currentStock || 0);
      const piecesPerBox = p.piecesPerBox || 1000;
      const totalManufactured = manufacturedMap.get(p.id) || 0;
      const totalPurchased = purchasedMap.get(p.id) || 0;
      const totalSold = soldMap.get(p.id) || 0;

      return {
        id: p.id,
        code: p.code,
        name: p.name,
        type: p.type,
        color: p.color || null,
        volumeMl: p.volumeMl || null,
        piecesPerBox,
        currentStock,
        minStockAlert: p.minStockAlert ? Number(p.minStockAlert) : null,
        totalManufactured,
        totalPurchased,
        totalSold,
      };
    });

    return {
      success: true,
      data: list,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error: any) {
    console.error("getCentralizedStockAction failed:", error);
    return { success: false, error: error.message || "Failed to load centralized stock database registers." };
  }
}

