import { prisma } from "@/lib/prisma";
import { LedgerService } from "@/features/trading/payments/ledger.service";

export const DashboardService = {
  /**
   * Calculates metrics for the Trading Dashboard.
   */
  async getTradingMetrics() {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);

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

    // 2. Today's Sales
    const todaySalesAgg = await prisma.sale.aggregate({
      where: {
        status: "COMPLETED",
        saleDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      _sum: {
        grandTotal: true,
      },
    });
    const todaySales = Number(todaySalesAgg._sum.grandTotal || 0);

    // 2b. Monthly Sales
    const monthlySalesAgg = await prisma.sale.aggregate({
      where: {
        status: "COMPLETED",
        saleDate: {
          gte: startOfMonth,
          lte: endOfToday,
        },
      },
      _sum: {
        grandTotal: true,
      },
    });
    const monthlySales = Number(monthlySalesAgg._sum.grandTotal || 0);

    // 3. Today's Payments (SUPPLIER_PAYMENT)
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

    // 4. Today's Collections (CUSTOMER_RECEIPT)
    const todayCollectionsAgg = await prisma.payment.aggregate({
      where: {
        paymentType: "CUSTOMER_RECEIPT",
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
    const todayCollections = Number(todayCollectionsAgg._sum.amount || 0);

    // 5. Outstanding Suppliers
    const suppliers = await prisma.contact.findMany({
      where: {
        type: "SUPPLIER",
        isActive: true,
      },
      select: { id: true },
    });
    let supplierOutstanding = 0;
    for (const s of suppliers) {
      supplierOutstanding += await LedgerService.getSupplierOutstanding(s.id, prisma);
    }

    // 6. Outstanding Customers
    const customers = await prisma.contact.findMany({
      where: {
        type: "CUSTOMER",
        isActive: true,
      },
      select: { id: true },
    });
    let customerOutstanding = 0;
    for (const c of customers) {
      customerOutstanding += await LedgerService.getCustomerOutstanding(c.id, prisma);
    }

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

    // 7b. Recent Sales (5 most recent completed sales)
    const recentSales = await prisma.sale.findMany({
      orderBy: {
        saleDate: "desc",
      },
      take: 5,
      include: {
        customer: {
          select: { name: true },
        },
      },
    });

    // 8. Recent Payments (5 most recent completed payments)
    const recentPayments = await prisma.payment.findMany({
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

    // 8b. Top Customers
    const topCustomersAgg = await prisma.sale.groupBy({
      by: ["customerId"],
      where: {
        status: "COMPLETED",
      },
      _sum: {
        grandTotal: true,
      },
      orderBy: {
        _sum: {
          grandTotal: "desc",
        },
      },
      take: 5,
    });
    const topCustomersIds = topCustomersAgg.map((x) => x.customerId);
    const topCustomersProfiles = await prisma.contact.findMany({
      where: {
        id: { in: topCustomersIds },
      },
      select: { id: true, name: true },
    });
    const topCustomers = topCustomersAgg.map((agg) => {
      const profile = topCustomersProfiles.find((p) => p.id === agg.customerId);
      return {
        id: agg.customerId,
        name: profile?.name || "Unknown Customer",
        totalSales: Number(agg._sum.grandTotal || 0),
      };
    });

    // 9. Current Stock Value (Sum of Product currentStock * averageCost)
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      select: {
        currentStock: true,
        averageCost: true,
      },
    });
    let currentStockValue = 0;
    products.forEach((p) => {
      currentStockValue += Number(p.currentStock || 0) * Number(p.averageCost || 0);
    });

    // 9b. Low Stock Products
    const lowStockProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        currentStock: {
          lte: 10,
        },
      },
      orderBy: {
        currentStock: "asc",
      },
      take: 5,
      select: {
        id: true,
        name: true,
        code: true,
        currentStock: true,
      },
    });

    // 10. Low Stock Count
    const lowStockCount = await prisma.product.count({
      where: {
        isActive: true,
        currentStock: {
          lte: 10,
        },
      },
    });

    const todayCashFlow = todayCollections - todayPayments;

    return {
      metrics: {
        todayPurchases,
        todaySales,
        monthlySales,
        todayPayments,
        todayCollections,
        todayCashFlow,
        supplierOutstanding,
        customerOutstanding,
        currentStockValue,
        lowStockCount,
      },
      recentPurchases: recentPurchases.map((p) => ({
        id: p.id,
        number: p.purchaseNumber,
        supplierName: p.supplier.name,
        date: p.purchaseDate.toISOString(),
        grandTotal: Number(p.grandTotal),
        paymentStatus: p.paymentStatus,
      })),
      recentSales: recentSales.map((s) => ({
        id: s.id,
        number: s.saleNumber,
        customerName: s.customer.name,
        date: s.saleDate.toISOString(),
        grandTotal: Number(s.grandTotal),
        paymentStatus: s.paymentStatus,
      })),
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        number: p.paymentNumber,
        supplierName: p.contact.name,
        date: p.paymentDate.toISOString(),
        amount: Number(p.amount),
        status: p.status,
      })),
      topCustomers,
      lowStockProducts: lowStockProducts.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        currentStock: Number(p.currentStock),
      })),
    };
  },

  /**
   * Calculates metrics for the Manufacturing Dashboard.
   */
  async getManufacturingMetrics() {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    // 1. Production Today
    const productionTodayAgg = await prisma.productionBatch.aggregate({
      where: {
        status: "COMPLETED",
        batchDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      _sum: {
        quantityProduced: true,
      },
    });
    const productionToday = Number(productionTodayAgg._sum.quantityProduced || 0);

    // 2. Raw Material Consumption Today
    const materialConsumedAgg = await prisma.productionMaterial.aggregate({
      where: {
        batch: {
          status: "COMPLETED",
          batchDate: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      },
      _sum: {
        quantityConsumed: true,
      },
    });
    const rawMaterialConsumption = Number(materialConsumedAgg._sum.quantityConsumed || 0);

    // 3. Finished Goods Produced Today
    // Same as batch production count for today
    const finishedGoodsProduced = productionToday;

    // 4. Today's Manufacturing Cost (Materials + Expenses)
    const costAgg = await prisma.productionBatch.aggregate({
      where: {
        status: "COMPLETED",
        batchDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      _sum: {
        totalBatchCost: true,
      },
    });
    const manufacturingCost = Number(costAgg._sum.totalBatchCost || 0);

    // 5. Today's Production Expenses (Indirect / Row Expenses)
    const expensesAgg = await prisma.productionExpense.aggregate({
      where: {
        batch: {
          status: "COMPLETED",
          batchDate: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      },
      _sum: {
        amount: true,
      },
    });
    const productionExpenses = Number(expensesAgg._sum.amount || 0);

    // 6. Current Raw Material Stock
    const rmProducts = await prisma.product.findMany({
      where: {
        type: "RAW_MATERIAL",
        isActive: true,
      },
      select: { currentStock: true },
    });
    let currentRawMaterialStock = rmProducts.reduce((sum, p) => sum + Number(p.currentStock || 0), 0);

    // 7. Current Finished Goods Stock
    const fgProducts = await prisma.product.findMany({
      where: {
        type: "FINISHED_GOOD",
        isActive: true,
      },
      select: { currentStock: true },
    });
    let currentFinishedGoodsStock = fgProducts.reduce((sum, p) => sum + Number(p.currentStock || 0), 0);

    return {
      productionToday,
      rawMaterialConsumption,
      finishedGoodsProduced,
      manufacturingCost,
      productionExpenses,
      currentRawMaterialStock,
      currentFinishedGoodsStock,
    };
  },

  /**
   * Calculates metrics for the Purchases module.
   */
  async getPurchaseMetrics() {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const [allCompleted, todayCompleted, pendingPayments] = await Promise.all([
      // 1. Total Purchases
      prisma.purchase.aggregate({
        where: { status: "COMPLETED" },
        _sum: { grandTotal: true },
      }),
      // 2. Today's Purchases
      prisma.purchase.aggregate({
        where: {
          status: "COMPLETED",
          purchaseDate: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
        _sum: { grandTotal: true },
      }),
      // 3. Pending Payments
      prisma.purchase.aggregate({
        where: {
          status: "COMPLETED",
          paymentStatus: {
            in: ["UNPAID", "PARTIALLY_PAID"],
          },
        },
        _sum: { grandTotal: true },
      }),
    ]);

    return {
      totalPurchases: Number(allCompleted._sum.grandTotal || 0),
      todayPurchases: Number(todayCompleted._sum.grandTotal || 0),
      pendingPayments: Number(pendingPayments._sum.grandTotal || 0),
    };
  },
};
