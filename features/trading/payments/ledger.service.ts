import { Prisma, PrismaClient } from "@prisma/client";

/**
 * Reusable ledger service to calculate outstanding balances dynamically from transactions.
 * All calculations use database sums of completed transactions and payments to ensure consistency.
 */
export const LedgerService = {
  /**
   * Calculates the outstanding balance for a supplier.
   * Outstanding = Contact.openingBalance + Completed Purchases - Completed Supplier Payments
   */
  async getSupplierOutstanding(
    contactId: string,
    prisma: Prisma.TransactionClient | PrismaClient
  ): Promise<number> {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: { openingBalance: true, type: true },
    });

    if (!contact || contact.type !== "SUPPLIER") {
      return 0;
    }

    // 1. Sum of completed purchases
    const purchasesSum = await prisma.purchase.aggregate({
      where: {
        supplierId: contactId,
        status: "COMPLETED",
      },
      _sum: {
        grandTotal: true,
      },
    });

    // 2. Sum of completed supplier payments
    const paymentsSum = await prisma.payment.aggregate({
      where: {
        contactId,
        paymentType: "SUPPLIER_PAYMENT",
        status: "COMPLETED",
      },
      _sum: {
        amount: true,
      },
    });

    const openingBalance = Number(contact.openingBalance || 0);
    const totalPurchases = Number(purchasesSum._sum.grandTotal || 0);
    const totalPayments = Number(paymentsSum._sum.amount || 0);

    return openingBalance + totalPurchases - totalPayments;
  },

  /**
   * Calculates the outstanding balance for a customer.
   * Outstanding = Contact.openingBalance + Completed Sales - Completed Customer Receipts
   */
  async getCustomerOutstanding(
    contactId: string,
    prisma: Prisma.TransactionClient | PrismaClient
  ): Promise<number> {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: { openingBalance: true, type: true },
    });

    if (!contact || contact.type !== "CUSTOMER") {
      return 0;
    }

    // 1. Sum of completed sales
    const salesSum = await prisma.sale.aggregate({
      where: {
        customerId: contactId,
        status: "COMPLETED",
      },
      _sum: {
        grandTotal: true,
      },
    });

    // 2. Sum of completed customer receipts
    const receiptsSum = await prisma.payment.aggregate({
      where: {
        contactId,
        paymentType: "CUSTOMER_RECEIPT",
        status: "COMPLETED",
      },
      _sum: {
        amount: true,
      },
    });

    const openingBalance = Number(contact.openingBalance || 0);
    const totalSales = Number(salesSum._sum.grandTotal || 0);
    const totalReceipts = Number(receiptsSum._sum.amount || 0);

    return openingBalance + totalSales - totalReceipts;
  },

  /**
   * Calculates the remaining due balance on a specific purchase.
   * Outstanding = Purchase.grandTotal - Completed Payments
   */
  async getPurchaseOutstanding(
    purchaseId: string,
    prisma: Prisma.TransactionClient | PrismaClient
  ): Promise<number> {
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      select: { grandTotal: true, status: true },
    });

    if (!purchase || purchase.status !== "COMPLETED") {
      return 0;
    }

    const paymentsSum = await prisma.payment.aggregate({
      where: {
        purchaseId,
        paymentType: "SUPPLIER_PAYMENT",
        status: "COMPLETED",
      },
      _sum: {
        amount: true,
      },
    });

    const grandTotal = Number(purchase.grandTotal || 0);
    const totalPaid = Number(paymentsSum._sum.amount || 0);

    return Math.max(0, grandTotal - totalPaid);
  },

  /**
   * Calculates the remaining due balance on a specific sale.
   * Outstanding = Sale.grandTotal - Completed Receipts
   */
  async getSaleOutstanding(
    saleId: string,
    prisma: Prisma.TransactionClient | PrismaClient
  ): Promise<number> {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      select: { grandTotal: true, status: true },
    });

    if (!sale || sale.status !== "COMPLETED") {
      return 0;
    }

    const receiptsSum = await prisma.payment.aggregate({
      where: {
        saleId,
        paymentType: "CUSTOMER_RECEIPT",
        status: "COMPLETED",
      },
      _sum: {
        amount: true,
      },
    });

    const grandTotal = Number(sale.grandTotal || 0);
    const totalReceived = Number(receiptsSum._sum.amount || 0);

    return Math.max(0, grandTotal - totalReceived);
  },
};
