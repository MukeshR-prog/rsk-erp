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
        const last = await tx.productionEntry.findFirst({
          where: { productionNumber: { startsWith: yearPrefix } },
          orderBy: { productionNumber: "desc" },
          select: { productionNumber: true },
        });
        lastNumber = last?.productionNumber || null;
        break;
      }
      case "EXP": {
        const last = await tx.manufacturingExpense.findFirst({
          where: { expenseNumber: { startsWith: yearPrefix } },
          orderBy: { expenseNumber: "desc" },
          select: { expenseNumber: true },
        });
        lastNumber = last?.expenseNumber || null;
        break;
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
