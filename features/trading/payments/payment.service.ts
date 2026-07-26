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

    // Update parent invoice payment status if invoice link is present
    if (data.purchaseId || data.saleId) {
      await this.updateTransactionPaymentStatus(tx, {
        purchaseId: data.purchaseId,
        saleId: data.saleId,
      });
    }

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
