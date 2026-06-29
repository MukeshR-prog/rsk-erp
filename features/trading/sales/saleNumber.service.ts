import { Prisma } from "@prisma/client";
import { NumberGeneratorService } from "@/features/shared/services/numberGenerator.service";

/**
 * Service to automatically generate unique, sequential sale numbers.
 * Format: SAL-YYYY-000001
 */
export const SaleNumberService = {
  /**
   * Generates the next sequential sale number for the current year.
   */
  async generateNextSaleNumber(tx: Prisma.TransactionClient): Promise<string> {
    return NumberGeneratorService.generateNumber("SAL", tx);
  },
};
