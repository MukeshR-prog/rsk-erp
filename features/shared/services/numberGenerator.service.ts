import { Prisma } from "@prisma/client";

/**
 * Shared Number Generator Service for unified sequential code generation.
 * Format: PREFIX-YYYY-000001
 */
export const NumberGeneratorService = {
  /**
   * Generates the next sequential document number for the current year.
   */
  async generateNumber(
    prefix: "PUR" | "PAY" | "SAL" | "PRD" | "EXP",
    tx: Prisma.TransactionClient
  ): Promise<string> {
    const currentYear = new Date().getFullYear();
    const yearPrefix = `${prefix}-${currentYear}-`;

    let lastNumber: string | null = null;

    switch (prefix) {
      case "PUR": {
        const last = await tx.purchase.findFirst({
          where: { purchaseNumber: { startsWith: yearPrefix } },
          orderBy: { purchaseNumber: "desc" },
          select: { purchaseNumber: true },
        });
        lastNumber = last?.purchaseNumber || null;
        break;
      }
      case "PAY": {
        const last = await tx.payment.findFirst({
          where: { paymentNumber: { startsWith: yearPrefix } },
          orderBy: { paymentNumber: "desc" },
          select: { paymentNumber: true },
        });
        lastNumber = last?.paymentNumber || null;
        break;
      }
      case "SAL": {
        const last = await tx.sale.findFirst({
          where: { saleNumber: { startsWith: yearPrefix } },
          orderBy: { saleNumber: "desc" },
          select: { saleNumber: true },
        });
        lastNumber = last?.saleNumber || null;
        break;
      }
      case "PRD": {
        const last = await tx.productionBatch.findFirst({
          where: { batchNumber: { startsWith: yearPrefix } },
          orderBy: { batchNumber: "desc" },
          select: { batchNumber: true },
        });
        lastNumber = last?.batchNumber || null;
        break;
      }
      case "EXP": {
        // Since ProductionExpense doesn't store a sequential code field in the schema,
        // we derive it dynamically from the count of batch expenses recorded in the current year.
        const count = await tx.productionExpense.count({
          where: {
            createdAt: {
              gte: new Date(currentYear, 0, 1),
            },
          },
        });
        const nextSeq = count + 1;
        const nextSeqPadded = String(nextSeq).padStart(6, "0");
        return `${yearPrefix}${nextSeqPadded}`;
      }
    }

    if (!lastNumber) {
      return `${yearPrefix}000001`;
    }

    // Extract sequence suffix and increment
    const lastNumberStr = lastNumber.replace(yearPrefix, "");
    const lastSeq = parseInt(lastNumberStr, 10);
    const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
    const nextSeqPadded = String(nextSeq).padStart(6, "0");

    return `${yearPrefix}${nextSeqPadded}`;
  },
};
