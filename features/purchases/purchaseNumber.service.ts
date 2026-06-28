import { Prisma } from "@prisma/client";

/**
 * Service to automatically generate unique, sequential purchase numbers.
 * Format: PUR-YYYY-000001
 */
export const PurchaseNumberService = {
  /**
   * Generates the next sequential purchase number for the current year.
   */
  async generateNextPurchaseNumber(tx: Prisma.TransactionClient): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `PUR-${currentYear}-`;

    // Query for the highest purchase number in the current year
    const lastPurchase = await tx.purchase.findFirst({
      where: {
        purchaseNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        purchaseNumber: "desc",
      },
      select: {
        purchaseNumber: true,
      },
    });

    if (!lastPurchase) {
      return `${prefix}000001`;
    }

    // Extract sequence number, increment it, and pad with leading zeros
    const lastNumberStr = lastPurchase.purchaseNumber.replace(prefix, "");
    const lastSeq = parseInt(lastNumberStr, 10);
    const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
    const nextSeqPadded = String(nextSeq).padStart(6, "0");

    return `${prefix}${nextSeqPadded}`;
  },
};
