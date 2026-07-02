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
    return { success: true, data: result };
  } catch (error: any) {
    console.error("createStockAdjustmentAction failed:", error);
    return { success: false, error: error.message || "Failed to make stock adjustment" };
  }
}
