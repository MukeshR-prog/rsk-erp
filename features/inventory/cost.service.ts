import { Prisma } from "@prisma/client";

/**
 * Cost Calculation Service for Inventory Valuations.
 */
export const CostService = {
  /**
   * Recalculates the Weighted Average Cost (WAC) of a product when new stock is added.
   * WAC = (Existing Stock Value + New Stock Value) / (Existing Stock Qty + New Stock Qty)
   */
  calculateWeightedAverageCost(
    currentStock: number | Prisma.Decimal,
    currentAverageCost: number | Prisma.Decimal,
    addedQuantity: number | Prisma.Decimal,
    addedRate: number | Prisma.Decimal
  ): Prisma.Decimal {
    const existingQty = new Prisma.Decimal(String(currentStock));
    const existingAvg = new Prisma.Decimal(String(currentAverageCost));
    const addedQty = new Prisma.Decimal(String(addedQuantity));
    const addedPrice = new Prisma.Decimal(String(addedRate));

    const totalQty = existingQty.add(addedQty);
    if (totalQty.lessThanOrEqualTo(0)) {
      return new Prisma.Decimal(0);
    }

    const existingValue = existingQty.mul(existingAvg);
    const addedValue = addedQty.mul(addedPrice);
    const totalValue = existingValue.add(addedValue);

    return totalValue.div(totalQty);
  },

  /**
   * Calculates the current total valuation of stock for a single product.
   */
  async calculateProductStockValue(
    productId: string,
    tx: Prisma.TransactionClient
  ): Promise<number> {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { currentStock: true, averageCost: true },
    });

    if (!product) {
      return 0;
    }

    return Number(product.currentStock || 0) * Number(product.averageCost || 0);
  },

  /**
   * Calculates the grand total valuation of all active inventory stocks.
   */
  async calculateTotalInventoryValue(tx: Prisma.TransactionClient): Promise<number> {
    const products = await tx.product.findMany({
      where: { isActive: true },
      select: { currentStock: true, averageCost: true },
    });

    return products.reduce(
      (sum, p) => sum + Number(p.currentStock || 0) * Number(p.averageCost || 0),
      0
    );
  },
};
