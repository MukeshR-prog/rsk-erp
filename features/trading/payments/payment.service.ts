import { Prisma, PurchasePaymentStatus, SalePaymentStatus, PaymentType, PaymentMethod, PaymentStatus } from "@prisma/client";
import { NumberGeneratorService } from "@/features/shared/services/numberGenerator.service";

export interface CreatePaymentInput {
  contactId: string;
  purchaseId?: string | null;
  saleId?: string | null;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  referenceNumber?: string | null;
  notes?: string | null;
  createdById?: string | null;
  paymentType: PaymentType;
  isAdvance?: boolean;
}

export const PaymentService = {
  /**
   * Sum of all COMPLETED payments against a transaction.
   */
  async calculatePaidAmount(
    tx: Prisma.TransactionClient,
    filters: { purchaseId?: string | null; saleId?: string | null; paymentType: PaymentType }
  ): Promise<number> {
    const whereClause: Prisma.PaymentWhereInput = {
      status: "COMPLETED",
      paymentType: filters.paymentType,
    };

    if (filters.purchaseId) {
      whereClause.purchaseId = filters.purchaseId;
    } else if (filters.saleId) {
      whereClause.saleId = filters.saleId;
    } else {
      return 0; // If no target link is specified (e.g. advance payments), return 0
    }

    const aggregate = await tx.payment.aggregate({
      where: whereClause,
      _sum: {
        amount: true,
      },
    });

    return Number(aggregate._sum.amount || 0);
  },

  /**
   * Recalculates and updates the payment status of a purchase or sale.
   */
  async updateTransactionPaymentStatus(
    tx: Prisma.TransactionClient,
    filters: { purchaseId?: string | null; saleId?: string | null }
  ): Promise<void> {
    if (filters.purchaseId) {
      const purchase = await tx.purchase.findUnique({
        where: { id: filters.purchaseId },
        select: { grandTotal: true },
      });

      if (!purchase) {
        throw new Error(`Purchase ${filters.purchaseId} not found.`);
      }

      const grandTotal = Number(purchase.grandTotal);
      const totalPaid = await this.calculatePaidAmount(tx, {
        purchaseId: filters.purchaseId,
        paymentType: "SUPPLIER_PAYMENT",
      });

      let paymentStatus: PurchasePaymentStatus = "UNPAID";
      if (totalPaid >= grandTotal - 0.01) {
        paymentStatus = "PAID";
      } else if (totalPaid > 0) {
        paymentStatus = "PARTIALLY_PAID";
      }

      await tx.purchase.update({
        where: { id: filters.purchaseId },
        data: { paymentStatus },
      });
    } else if (filters.saleId) {
      const sale = await tx.sale.findUnique({
        where: { id: filters.saleId },
        select: { grandTotal: true },
      });

      if (!sale) {
        throw new Error(`Sale ${filters.saleId} not found.`);
      }

      const grandTotal = Number(sale.grandTotal);
      const totalPaid = await this.calculatePaidAmount(tx, {
        saleId: filters.saleId,
        paymentType: "CUSTOMER_RECEIPT",
      });

      let paymentStatus: SalePaymentStatus = "UNPAID";
      if (totalPaid >= grandTotal - 0.01) {
        paymentStatus = "PAID";
      } else if (totalPaid > 0) {
        paymentStatus = "PARTIALLY_PAID";
      }

      await tx.sale.update({
        where: { id: filters.saleId },
        data: { paymentStatus },
      });
    }
  },

  /**
   * Validates dynamic rules for both customer receipts and supplier payments.
   */
  async validatePayment(
    data: CreatePaymentInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    // 1. Validate contact profile
    const contact = await tx.contact.findUnique({
      where: { id: data.contactId },
      select: { type: true, isActive: true },
    });

    if (!contact) {
      throw new Error("Contact profile does not exist.");
    }
    if (!contact.isActive) {
      throw new Error("Cannot log payment transactions for an inactive contact.");
    }

    if (data.paymentType === "SUPPLIER_PAYMENT" && contact.type !== "SUPPLIER") {
      throw new Error("The selected profile is not registered as a supplier.");
    }
    if (data.paymentType === "CUSTOMER_RECEIPT" && contact.type !== "CUSTOMER") {
      throw new Error("The selected profile is not registered as a customer.");
    }

    // 2. Validate amount
    if (data.amount <= 0) {
      throw new Error("Payment transaction amount must be greater than zero.");
    }

    // 3. Skip invoice-specific validations if it's an advance payment
    if (data.isAdvance) {
      return;
    }

    // 4. Validate referenced invoice links
    if (data.paymentType === "SUPPLIER_PAYMENT") {
      if (!data.purchaseId) {
        throw new Error("Purchase invoice ID is required for non-advance supplier payments.");
      }

      const purchase = await tx.purchase.findUnique({
        where: { id: data.purchaseId },
        select: { supplierId: true, grandTotal: true, status: true },
      });

      if (!purchase) {
        throw new Error("The referenced purchase invoice does not exist.");
      }
      if (purchase.supplierId !== data.contactId) {
        throw new Error("The referenced purchase invoice does not match the selected supplier.");
      }
      if (purchase.status === "CANCELLED") {
        throw new Error("Cannot record payments against a cancelled purchase invoice.");
      }

      const totalPaid = await this.calculatePaidAmount(tx, {
        purchaseId: data.purchaseId,
        paymentType: "SUPPLIER_PAYMENT",
      });
      const grandTotal = Number(purchase.grandTotal);
      const remainingBalance = Math.max(0, grandTotal - totalPaid);

      if (data.amount > remainingBalance + 0.01) {
        throw new Error(
          `Payment amount (₹${data.amount.toFixed(2)}) exceeds the remaining balance (₹${remainingBalance.toFixed(2)}) on this invoice.`
        );
      }
    } else if (data.paymentType === "CUSTOMER_RECEIPT") {
      if (!data.saleId) {
        throw new Error("Sale invoice ID is required for non-advance customer receipts.");
      }

      const sale = await tx.sale.findUnique({
        where: { id: data.saleId },
        select: { customerId: true, grandTotal: true, status: true },
      });

      if (!sale) {
        throw new Error("The referenced sale invoice does not exist.");
      }
      if (sale.customerId !== data.contactId) {
        throw new Error("The referenced sale invoice does not match the selected customer.");
      }
      if (sale.status === "CANCELLED") {
        throw new Error("Cannot record receipts against a cancelled sale invoice.");
      }

      const totalPaid = await this.calculatePaidAmount(tx, {
        saleId: data.saleId,
        paymentType: "CUSTOMER_RECEIPT",
      });
      const grandTotal = Number(sale.grandTotal);
      const remainingBalance = Math.max(0, grandTotal - totalPaid);

      if (data.amount > remainingBalance + 0.01) {
        throw new Error(
          `Receipt amount (₹${data.amount.toFixed(2)}) exceeds the remaining balance (₹${remainingBalance.toFixed(2)}) on this invoice.`
        );
      }
    }
  },

  /**
   * Creates a payment record (supplier disbursement or customer receipt) inside a transaction.
   */
  async createPayment(
    data: CreatePaymentInput,
    tx: Prisma.TransactionClient
  ) {
    // Validate rules
    await this.validatePayment(data, tx);

    // Generate serial number
    const prefix = data.paymentType === "SUPPLIER_PAYMENT" ? "PAY" : "PAY"; // Always use prefix PAY for Payment numbering or follow prefix
    const paymentNumber = await NumberGeneratorService.generateNumber("PAY", tx);

    // Create payment record
    const payment = await tx.payment.create({
      data: {
        paymentNumber,
        contactId: data.contactId,
        purchaseId: data.purchaseId || null,
        saleId: data.saleId || null,
        paymentType: data.paymentType,
        amount: new Prisma.Decimal(data.amount),
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber || null,
        notes: data.notes || null,
        status: "COMPLETED",
        isAdvance: data.isAdvance ?? false,
        createdById: data.createdById || null,
      },
    });

    // Update parent invoice payment status
    await this.updateTransactionPaymentStatus(tx, {
      purchaseId: data.purchaseId,
      saleId: data.saleId,
    });

    return payment;
  },

  /**
   * Soft-cancels a payment record and updates parent invoice status.
   */
  async cancelPayment(
    paymentId: string,
    cancellationReason: string,
    updatedById: string,
    tx: Prisma.TransactionClient
  ) {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      select: { status: true, purchaseId: true, saleId: true },
    });

    if (!payment) {
      throw new Error("Payment record not found.");
    }
    if (payment.status === "CANCELLED") {
      throw new Error("This payment has already been cancelled.");
    }

    // Update payment record
    const updatedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: "CANCELLED",
        cancellationReason,
        updatedById,
      },
    });

    // Update parent invoice status
    await this.updateTransactionPaymentStatus(tx, {
      purchaseId: payment.purchaseId,
      saleId: payment.saleId,
    });

    return updatedPayment;
  },
};
