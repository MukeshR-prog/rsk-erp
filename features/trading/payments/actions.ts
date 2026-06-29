"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { PaymentFilters, CreateSupplierPaymentDTO } from "./types";
import { createPaymentSchema, cancelPaymentSchema } from "./validations";
import { PaymentService } from "./payment.service";
import { LedgerService } from "./ledger.service";
import { createServerClient } from "@/lib/supabase/server";
import { Prisma } from "@prisma/client";

/**
 * Helper to fetch the authenticated user ID on the server.
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (err) {
    console.error("getCurrentUserId failed:", err);
    return null;
  }
}

/**
 * Fetch supplier payments with pagination and filters.
 */
export async function getSupplierPayments(filters: PaymentFilters) {
  try {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {
      paymentType: "SUPPLIER_PAYMENT",
    };

    if (filters.contactId) {
      where.contactId = filters.contactId;
    }

    if (filters.paymentMethod) {
      where.paymentMethod = filters.paymentMethod;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.paymentDate = {};
      if (filters.startDate) {
        where.paymentDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        // Set end date to end of the day
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.paymentDate.lte = end;
      }
    }

    if (filters.search) {
      where.OR = [
        {
          paymentNumber: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
        {
          referenceNumber: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
        {
          contact: {
            name: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          contact: {
            select: {
              name: true,
            },
          },
          purchase: {
            select: {
              purchaseNumber: true,
              grandTotal: true,
            },
          },
        },
        orderBy: {
          paymentDate: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    // Format Decimal values to Numbers
    const formattedPayments = payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
      purchase: p.purchase
        ? {
            ...p.purchase,
            grandTotal: Number(p.purchase.grandTotal),
          }
        : null,
    }));

    return {
      success: true,
      data: formattedPayments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("getSupplierPayments failed:", error);
    return {
      success: false,
      error: "Failed to retrieve supplier payments.",
    };
  }
}

/**
 * Fetch detailed view of a supplier payment.
 */
export async function getSupplierPayment(id: string) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        contact: {
          select: {
            name: true,
            phone: true,
            email: true,
            gstNumber: true,
            address: true,
          },
        },
        purchase: {
          select: {
            purchaseNumber: true,
            purchaseDate: true,
            grandTotal: true,
            subtotal: true,
            discount: true,
            transportCharges: true,
            paymentStatus: true,
          },
        },
      },
    });

    if (!payment || payment.paymentType !== "SUPPLIER_PAYMENT") {
      return { success: false, error: "Payment record not found." };
    }

    const formatted = {
      ...payment,
      amount: Number(payment.amount),
      purchase: payment.purchase
        ? {
            ...payment.purchase,
            grandTotal: Number(payment.purchase.grandTotal),
            subtotal: Number(payment.purchase.subtotal),
            discount: Number(payment.purchase.discount),
            transportCharges: Number(payment.purchase.transportCharges),
          }
        : null,
    };

    return { success: true, data: formatted };
  } catch (error) {
    console.error("getSupplierPayment failed:", error);
    return { success: false, error: "Failed to retrieve payment details." };
  }
}

/**
 * Creates a new supplier payment transaction.
 */
export async function createSupplierPaymentAction(data: CreateSupplierPaymentDTO) {
  try {
    // Validate schema
    const validated = createPaymentSchema.parse(data);

    // Get current userId for auditing
    const userId = await getCurrentUserId();

    const payment = await prisma.$transaction(async (tx) => {
      return await PaymentService.createSupplierPayment(
        {
          contactId: validated.contactId,
          purchaseId: validated.purchaseId,
          amount: validated.amount,
          paymentDate: new Date(validated.paymentDate),
          paymentMethod: validated.paymentMethod,
          referenceNumber: validated.referenceNumber,
          notes: validated.notes,
          createdById: userId || undefined,
        },
        tx
      );
    });

    // Revalidate affected views
    revalidatePath("/trading/payments");
    revalidatePath(`/trading/purchases/${data.purchaseId}`);
    revalidatePath("/trading/purchases");
    revalidatePath("/trading");

    return {
      success: true,
      data: {
        id: payment.id,
        paymentNumber: payment.paymentNumber,
      },
    };
  } catch (error: any) {
    console.error("createSupplierPaymentAction failed:", error);
    if (error.name === "ZodError") {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: error.message || "Failed to record payment." };
  }
}

/**
 * Cancels a completed supplier payment.
 */
export async function cancelSupplierPaymentAction(paymentId: string, cancellationReason: string) {
  try {
    // Validate schema
    const validated = cancelPaymentSchema.parse({ paymentId, cancellationReason });

    // Get current userId for auditing
    const userId = await getCurrentUserId();

    const payment = await prisma.$transaction(async (tx) => {
      return await PaymentService.cancelSupplierPayment(
        validated.paymentId,
        validated.cancellationReason,
        userId || "system",
        tx
      );
    });

    // Revalidate paths
    revalidatePath("/trading/payments");
    revalidatePath(`/trading/payments/${paymentId}`);
    if (payment.purchaseId) {
      revalidatePath(`/trading/purchases/${payment.purchaseId}`);
    }
    revalidatePath("/trading/purchases");
    revalidatePath("/trading");

    return { success: true };
  } catch (error: any) {
    console.error("cancelSupplierPaymentAction failed:", error);
    if (error.name === "ZodError") {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: error.message || "Failed to cancel payment." };
  }
}

/**
 * Fetch a list of pending/completed purchases with remaining balances for a supplier.
 */
export async function getPendingSupplierPurchases(supplierId: string) {
  try {
    const purchases = await prisma.purchase.findMany({
      where: {
        supplierId,
        status: "COMPLETED",
        paymentStatus: {
          in: ["UNPAID", "PARTIALLY_PAID"],
        },
      },
      orderBy: {
        purchaseDate: "asc",
      },
    });

    const formatted = [];
    for (const p of purchases) {
      const paidSum = await prisma.payment.aggregate({
        where: {
          purchaseId: p.id,
          paymentType: "SUPPLIER_PAYMENT",
          status: "COMPLETED",
        },
        _sum: {
          amount: true,
        },
      });
      const totalPaid = Number(paidSum._sum.amount || 0);
      const remainingBalance = Math.max(0, Number(p.grandTotal) - totalPaid);

      if (remainingBalance > 0) {
        formatted.push({
          id: p.id,
          purchaseNumber: p.purchaseNumber,
          purchaseDate: p.purchaseDate,
          grandTotal: Number(p.grandTotal),
          remainingBalance,
        });
      }
    }

    return { success: true, data: formatted };
  } catch (err: any) {
    console.error("getPendingSupplierPurchases failed:", err);
    return { success: false, error: err.message || "Failed to retrieve pending purchases." };
  }
}

/**
 * Fetch KPI metrics for the Supplier Payments Dashboard.
 */
export async function getPaymentDashboardMetrics() {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    // 1. Today's Supplier Payments
    const todayPayments = await prisma.payment.aggregate({
      where: {
        paymentType: "SUPPLIER_PAYMENT",
        status: "COMPLETED",
        paymentDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // 2. Total Settled / Paid
    const totalPayments = await prisma.payment.aggregate({
      where: {
        paymentType: "SUPPLIER_PAYMENT",
        status: "COMPLETED",
      },
      _sum: {
        amount: true,
      },
    });

    // 3. Pending Bills (Count of UNPAID and PARTIALLY_PAID purchases)
    const pendingBillsCount = await prisma.purchase.count({
      where: {
        status: "COMPLETED",
        paymentStatus: {
          in: ["UNPAID", "PARTIALLY_PAID"],
        },
      },
    });

    // 4. Suppliers with Outstanding (Count of contacts with type SUPPLIER and outstanding > 0)
    const suppliers = await prisma.contact.findMany({
      where: {
        type: "SUPPLIER",
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    let suppliersWithOutstanding = 0;
    for (const s of suppliers) {
      const outstanding = await LedgerService.getSupplierOutstanding(s.id, prisma);
      if (outstanding > 0.01) {
        suppliersWithOutstanding++;
      }
    }

    return {
      success: true,
      data: {
        todayPayments: Number(todayPayments._sum.amount || 0),
        totalPayments: Number(totalPayments._sum.amount || 0),
        pendingBillsCount,
        suppliersWithOutstanding,
      },
    };
  } catch (error: any) {
    console.error("getPaymentDashboardMetrics failed:", error);
    return {
      success: false,
      error: "Failed to calculate payment dashboard metrics.",
    };
  }
}

/**
 * Fetch all active suppliers for selector.
 */
export async function getSuppliersForPayments() {
  try {
    const suppliers = await prisma.contact.findMany({
      where: {
        type: "SUPPLIER",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        type: true,
        phone: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    return { success: true, data: suppliers };
  } catch (err: any) {
    console.error("getSuppliersForPayments failed:", err);
    return { success: false, error: err.message || "Failed to load suppliers list." };
  }
}

/**
 * Fetch complete data for the main Trading Dashboard.
 */
export async function getTradingDashboardData() {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    // 1. Today's Purchases
    const todayPurchasesAgg = await prisma.purchase.aggregate({
      where: {
        status: "COMPLETED",
        purchaseDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      _sum: {
        grandTotal: true,
      },
    });
    const todayPurchases = Number(todayPurchasesAgg._sum.grandTotal || 0);

    // 2. Today's Supplier Payments
    const todayPaymentsAgg = await prisma.payment.aggregate({
      where: {
        paymentType: "SUPPLIER_PAYMENT",
        status: "COMPLETED",
        paymentDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      _sum: {
        amount: true,
      },
    });
    const todayPayments = Number(todayPaymentsAgg._sum.amount || 0);

    // 3. Dynamic Supplier Outstanding (Sum of all suppliers)
    const suppliers = await prisma.contact.findMany({
      where: {
        type: "SUPPLIER",
        isActive: true,
      },
      select: { id: true },
    });

    let totalSupplierOutstanding = 0;
    for (const s of suppliers) {
      const bal = await LedgerService.getSupplierOutstanding(s.id, prisma);
      totalSupplierOutstanding += bal;
    }

    // 4. Dynamic Customer Outstanding (Sum of all customers)
    const customers = await prisma.contact.findMany({
      where: {
        type: "CUSTOMER",
        isActive: true,
      },
      select: { id: true },
    });

    let totalCustomerOutstanding = 0;
    for (const c of customers) {
      const bal = await LedgerService.getCustomerOutstanding(c.id, prisma);
      totalCustomerOutstanding += bal;
    }

    // 5. Current Stock Value (Sum of Product currentStock * averageCost)
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      select: {
        currentStock: true,
        averageCost: true,
      },
    });

    let totalStockValue = 0;
    products.forEach((p) => {
      totalStockValue += Number(p.currentStock || 0) * Number(p.averageCost || 0);
    });

    // 6. Low Stock Count (Active products with currentStock <= 10)
    const lowStockCount = await prisma.product.count({
      where: {
        isActive: true,
        currentStock: {
          lte: 10,
        },
      },
    });

    // 7. Recent Purchases (5 most recent completed purchases)
    const recentPurchases = await prisma.purchase.findMany({
      orderBy: {
        purchaseDate: "desc",
      },
      take: 5,
      include: {
        supplier: {
          select: { name: true },
        },
      },
    });

    // 8. Recent Payments (5 most recent completed payments)
    const recentPayments = await prisma.payment.findMany({
      where: {
        paymentType: "SUPPLIER_PAYMENT",
      },
      orderBy: {
        paymentDate: "desc",
      },
      take: 5,
      include: {
        contact: {
          select: { name: true },
        },
      },
    });

    return {
      success: true,
      data: {
        metrics: {
          todayPurchases,
          todaySales: 0, // Placeholder
          todayCollections: 0, // Placeholder
          todayPayments,
          customerOutstanding: totalCustomerOutstanding,
          supplierOutstanding: totalSupplierOutstanding,
          currentStockValue: totalStockValue,
          lowStockCount,
        },
        recentPurchases: recentPurchases.map((p) => ({
          id: p.id,
          number: p.purchaseNumber,
          date: p.purchaseDate,
          supplierName: p.supplier.name,
          grandTotal: Number(p.grandTotal),
          status: p.status,
          paymentStatus: p.paymentStatus,
        })),
        recentPayments: recentPayments.map((p) => ({
          id: p.id,
          number: p.paymentNumber,
          date: p.paymentDate,
          supplierName: p.contact.name,
          amount: Number(p.amount),
          status: p.status,
        })),
      },
    };
  } catch (error: any) {
    console.error("getTradingDashboardData failed:", error);
    return {
      success: false,
      error: error.message || "Failed to retrieve dashboard metrics.",
    };
  }
}
