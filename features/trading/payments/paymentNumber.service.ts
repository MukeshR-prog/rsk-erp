import { Prisma } from "@prisma/client";

/**
 * Service to automatically generate unique, sequential payment numbers.
 * Format: PAY-YYYY-000001
 */
export const PaymentNumberService = {
  /**
   * Generates the next sequential payment number for the current year.
   */
  async generateNextPaymentNumber(tx: Prisma.TransactionClient): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `PAY-${currentYear}-`;

    // Query for the highest payment number in the current year
    const lastPayment = await tx.payment.findFirst({
      where: {
        paymentNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        paymentNumber: "desc",
      },
      select: {
        paymentNumber: true,
      },
    });

    if (!lastPayment) {
      return `${prefix}000001`;
    }

    // Extract sequence number, increment it, and pad with leading zeros
    const lastNumberStr = lastPayment.paymentNumber.replace(prefix, "");
    const lastSeq = parseInt(lastNumberStr, 10);
    const nextSeq = isNaN(lastSeq) ? 1 : lastSeq + 1;
    const nextSeqPadded = String(nextSeq).padStart(6, "0");

    return `${prefix}${nextSeqPadded}`;
  },
};
