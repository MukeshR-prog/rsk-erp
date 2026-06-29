import { Prisma, PrismaClient, PurchasePaymentStatus } from "@prisma/client";
import { PaymentNumberService } from "./paymentNumber.service";

export interface CreatePaymentInput {
  contactId: string;
  purchaseId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: "CASH" | "BANK_TRANSFER" | "UPI" | "CHEQUE";
  referenceNumber?: string;
  notes?: string;
  createdById?: string;
}

export const PaymentService = {
  /**
   * Sum of all COMPLETED payments against a purchase.
   */
  async calculatePurchasePaid(
    purchaseId: string,
    tx: Prisma.TransactionClient
  ): Promise<number> {
    const aggregate = await tx.payment.aggregate({
      where: {
        purchaseId,
        paymentType: "SUPPLIER_PAYMENT",
        status: "COMPLETED",
      },
      _sum: {
        amount: true,
      },
    });
    return Number(aggregate._sum.amount || 0);
  },

  /**
   * Recalculates and updates the payment status of a purchase.
   */
  async updatePurchaseStatus(
    purchaseId: string,
    tx: Prisma.TransactionClient
  ): Promise<PurchasePaymentStatus> {
    const purchase = await tx.purchase.findUnique({
      where: { id: purchaseId },
      select: { grandTotal: true },
    });

    if (!purchase) {
      throw new Error(`Purchase ${purchaseId} not found.`);
    }

    const grandTotal = Number(purchase.grandTotal);
    const totalPaid = await this.calculatePurchasePaid(purchaseId, tx);

    let paymentStatus: PurchasePaymentStatus = "UNPAID";
    if (totalPaid >= grandTotal) {
      paymentStatus = "PAID";
    } else if (totalPaid > 0) {
      paymentStatus = "PARTIALLY_PAID";
    }

    await tx.purchase.update({
      where: { id: purchaseId },
      data: { paymentStatus },
    });

    return paymentStatus;
  },

  /**
   * Validates supplier payment rules.
   */
  async validateSupplierPayment(
    data: CreatePaymentInput,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    // 1. Validate supplier existence
    const supplier = await tx.contact.findUnique({
      where: { id: data.contactId },
      select: { type: true, isActive: true },
    });

    if (!supplier) {
      throw new Error("Supplier does not exist.");
    }
    if (supplier.type !== "SUPPLIER") {
      throw new Error("The selected contact is not registered as a supplier.");
    }
    if (!supplier.isActive) {
      throw new Error("Cannot record payment for an inactive supplier.");
    }

    // 2. Validate amount
    if (data.amount <= 0) {
      throw new Error("Payment amount must be greater than zero.");
    }

    // 3. Validate purchase existence and ownership
    const purchase = await tx.purchase.findUnique({
      where: { id: data.purchaseId },
      select: { supplierId: true, grandTotal: true, status: true },
    });

    if (!purchase) {
      throw new Error("The referenced purchase invoice does not exist.");
    }
    if (purchase.supplierId !== data.contactId) {
      throw new Error("The referenced purchase does not belong to the selected supplier.");
    }
    if (purchase.status === "CANCELLED") {
      throw new Error("Cannot record a payment against a cancelled purchase invoice.");
    }

    // 4. Validate remaining balance
    const totalPaid = await this.calculatePurchasePaid(data.purchaseId, tx);
    const grandTotal = Number(purchase.grandTotal);
    const remainingBalance = Math.max(0, grandTotal - totalPaid);

    // Use absolute epsilon tolerance for floating-point comparisons
    if (data.amount > remainingBalance + 0.01) {
      throw new Error(
        `Payment amount (₹${data.amount.toFixed(2)}) exceeds the remaining balance (₹${remainingBalance.toFixed(2)}) on this invoice.`
      );
    }
  },

  /**
   * Creates a supplier payment record and recalculates purchase payment status.
   */
  async createSupplierPayment(
    data: CreatePaymentInput,
    tx: Prisma.TransactionClient
  ) {
    // Validate rules
    await this.validateSupplierPayment(data, tx);

    // Generate serial number
    const paymentNumber = await PaymentNumberService.generateNextPaymentNumber(tx);

    // Create payment record
    const payment = await tx.payment.create({
      data: {
        paymentNumber,
        contactId: data.contactId,
        purchaseId: data.purchaseId,
        paymentType: "SUPPLIER_PAYMENT",
        amount: new Prisma.Decimal(data.amount),
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber || null,
        notes: data.notes || null,
        status: "COMPLETED",
        createdById: data.createdById || null,
      },
    });

    // Update purchase invoice payment status
    await this.updatePurchaseStatus(data.purchaseId, tx);

    return payment;
  },

  /**
   * Soft-cancels a supplier payment and updates purchase payment status.
   */
  async cancelSupplierPayment(
    paymentId: string,
    cancellationReason: string,
    updatedById: string,
    tx: Prisma.TransactionClient
  ) {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      select: { status: true, purchaseId: true, amount: true },
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

    // If linked to a purchase, update purchase status
    if (payment.purchaseId) {
      await this.updatePurchaseStatus(payment.purchaseId, tx);
    }

    return updatedPayment;
  },
};
