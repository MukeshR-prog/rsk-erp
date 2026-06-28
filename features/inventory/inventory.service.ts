import { Prisma, MovementType } from "@prisma/client";

/**
 * Reusable Inventory Service for handling Product stock counts
 * and logging audit-trail StockMovements.
 * 
 * IMPORTANT: Always pass the active transaction client `tx` to execute
 * within database transactions.
 */
export const InventoryService = {
  /**
   * Adjusts the product's current stock and logs a stock movement audit trail.
   */
  async adjustStock(
    tx: Prisma.TransactionClient,
    productId: string,
    quantityChange: number | Prisma.Decimal | any,
    type: MovementType,
    referenceId?: string,
    notes?: string
  ) {
    const change = new Prisma.Decimal(String(quantityChange));

    // 1. Fetch product to ensure it exists
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, currentStock: true },
    });

    if (!product) {
      throw new Error(`Product not found with ID: ${productId}`);
    }

    const currentStock = new Prisma.Decimal(String(product.currentStock));
    const newStock = currentStock.add(change);

    // 2. Validate stock levels if decrease results in negative stock
    if (newStock.lessThan(0) && change.lessThan(0)) {
      throw new Error(
        `Insufficient stock for product "${product.name}". Available: ${currentStock.toString()}, Requested adjustment: ${change.toString()}`
      );
    }

    // 3. Update Product stock
    const updatedProduct = await tx.product.update({
      where: { id: productId },
      data: {
        currentStock: newStock,
      },
    });

    // 4. Log StockMovement
    await tx.stockMovement.create({
      data: {
        productId,
        quantity: change,
        type,
        referenceId,
        notes,
      },
    });

    return updatedProduct;
  },

  /**
   * Helper to increase product stock.
   */
  async increaseStock(
    tx: Prisma.TransactionClient,
    productId: string,
    quantity: number | Prisma.Decimal | any,
    type: MovementType,
    referenceId?: string,
    notes?: string
  ) {
    const amount = new Prisma.Decimal(String(quantity));
    if (amount.lessThanOrEqualTo(0)) {
      throw new Error("Quantity to increase must be positive.");
    }
    return this.adjustStock(tx, productId, amount, type, referenceId, notes);
  },

  /**
   * Helper to decrease product stock.
   */
  async decreaseStock(
    tx: Prisma.TransactionClient,
    productId: string,
    quantity: number | Prisma.Decimal | any,
    type: MovementType,
    referenceId?: string,
    notes?: string
  ) {
    const amount = new Prisma.Decimal(String(quantity));
    if (amount.lessThanOrEqualTo(0)) {
      throw new Error("Quantity to decrease must be positive.");
    }
    return this.adjustStock(tx, productId, amount.negated(), type, referenceId, notes);
  },

  /**
   * Reverses a stock adjustment by applying the opposite quantity change.
   */
  async reverseStock(
    tx: Prisma.TransactionClient,
    productId: string,
    originalQuantityChange: number | Prisma.Decimal | any,
    type: MovementType,
    referenceId?: string,
    notes?: string
  ) {
    const original = new Prisma.Decimal(String(originalQuantityChange));
    const reversedChange = original.negated();
    return this.adjustStock(tx, productId, reversedChange, type, referenceId, notes);
  },
};
