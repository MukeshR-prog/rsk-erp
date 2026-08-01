import { prisma } from "@/lib/prisma";
import { LedgerService } from "@/features/trading/payments/ledger.service";
import { Prisma } from "@prisma/client";

export const DashboardService = {
  /**
   * Calculates metrics for the Trading Dashboard.
   */
  async getTradingMetrics(startDate?: string, endDate?: string) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    let rangeStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0,
      0
    );
    let rangeEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999
    );

    if (startDate) {
      rangeStart = new Date(startDate);
    }
    if (endDate) {
      rangeEnd = new Date(endDate);
      rangeEnd.setHours(23, 59, 59, 999);
    }

    const dateFilter: Prisma.DateTimeFilter = {
      gte: rangeStart,
      lte: rangeEnd,
    };

    // 1. Purchases for period
    const todayPurchasesAgg = await prisma.purchase.aggregate({
      where: {
        status: "COMPLETED",
        purchaseDate: dateFilter,
      },
      _sum: { grandTotal: true },
    });
    const todayPurchases = Number(todayPurchasesAgg._sum.grandTotal || 0);

    // 2. Sales for period
    const todaySalesAgg = await prisma.sale.aggregate({
      where: {
        status: "COMPLETED",
        saleDate: dateFilter,
      },
      _sum: { grandTotal: true },
    });
    const todaySales = Number(todaySalesAgg._sum.grandTotal || 0);

    // 2b. Total Purchases & Sales (historical sums)
    const totalPurchasesAgg = await prisma.purchase.aggregate({
      where: { status: "COMPLETED" },
      _sum: { grandTotal: true },
    });
    const totalPurchases = Number(totalPurchasesAgg._sum.grandTotal || 0);

    const totalSalesAgg = await prisma.sale.aggregate({
      where: { status: "COMPLETED" },
      _sum: { grandTotal: true },
    });
    const totalSales = Number(totalSalesAgg._sum.grandTotal || 0);

    // 3. Payments for period (SUPPLIER_PAYMENT)
    const todayPaymentsAgg = await prisma.payment.aggregate({
      where: {
        paymentType: "SUPPLIER_PAYMENT",
        status: "COMPLETED",
        paymentDate: dateFilter,
      },
      _sum: { amount: true },
    });
    const todayPayments = Number(todayPaymentsAgg._sum.amount || 0);

    // 4. Collections for period (CUSTOMER_RECEIPT)
    const todayCollectionsAgg = await prisma.payment.aggregate({
      where: {
        paymentType: "CUSTOMER_RECEIPT",
        status: "COMPLETED",
        paymentDate: dateFilter,
      },
      _sum: { amount: true },
    });
    const todayCollections = Number(todayCollectionsAgg._sum.amount || 0);

    // 5. Outstanding Suppliers
    const suppliers = await prisma.contact.findMany({
      where: { type: "SUPPLIER", isActive: true },
      select: { id: true },
    });
    let supplierOutstanding = 0;
    for (const s of suppliers) {
      supplierOutstanding += await LedgerService.getSupplierOutstanding(
        s.id,
        prisma,
      );
    }

    // 6. Outstanding Customers
    const customers = await prisma.contact.findMany({
      where: { type: "CUSTOMER", isActive: true },
      select: { id: true },
    });
    let customerOutstanding = 0;
    for (const c of customers) {
      customerOutstanding += await LedgerService.getCustomerOutstanding(
        c.id,
        prisma,
      );
    }

    // 7. Recent Sales (5 most recent completed sales)
    const recentSales = await prisma.sale.findMany({
      orderBy: { saleDate: "desc" },
      take: 5,
      include: {
        customer: { select: { name: true } },
      },
    });

    // Recent Purchases (5 most recent completed purchases)
    const recentPurchases = await prisma.purchase.findMany({
      orderBy: { purchaseDate: "desc" },
      take: 5,
      include: {
        supplier: { select: { name: true } },
      },
    });

    // 8. Recent Payments (5 most recent completed payments)
    const recentPayments = await prisma.payment.findMany({
      orderBy: { paymentDate: "desc" },
      take: 5,
      include: {
        contact: { select: { name: true } },
      },
    });

    // 9. Current Stock Value (Sum of Product currentStock * averageCost)
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { currentStock: true, averageCost: true },
    });
    const currentStockValue = products.reduce(
      (sum, p) =>
        sum + Number(p.currentStock || 0) * Number(p.averageCost || 0),
      0,
    );

    // 10. Low Stock Products
    const lowStockProducts = await prisma.product.findMany({
      where: { isActive: true, currentStock: { lte: 10 } },
      orderBy: { currentStock: "asc" },
      take: 5,
      select: { id: true, name: true, code: true, currentStock: true },
    });

    // Top Purchased Products (summing line quantities from completed purchases)
    const topPurchasesAgg = await prisma.purchaseItem.groupBy({
      by: ["productId"],
      where: { purchase: { status: "COMPLETED" } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });
    const topPurchasedIds = topPurchasesAgg.map((x) => x.productId);
    const topPurchasedProducts = await prisma.product.findMany({
      where: { id: { in: topPurchasedIds } },
      select: { id: true, name: true, code: true },
    });
    const topPurchased = topPurchasesAgg.map((agg) => {
      const p = topPurchasedProducts.find((x) => x.id === agg.productId);
      return {
        id: agg.productId,
        name: p?.name || "Unknown Product",
        code: p?.code || "",
        totalQty: Number(agg._sum.quantity || 0),
      };
    });

    // Top Sold Products (summing line quantities from completed sales)
    const topSalesAgg = await prisma.saleItem.groupBy({
      by: ["productId"],
      where: { sale: { status: "COMPLETED" } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });
    const topSoldIds = topSalesAgg.map((x) => x.productId);
    const topSoldProducts = await prisma.product.findMany({
      where: { id: { in: topSoldIds } },
      select: { id: true, name: true, code: true },
    });
    const topSold = topSalesAgg.map((agg) => {
      const p = topSoldProducts.find((x) => x.id === agg.productId);
      return {
        id: agg.productId,
        name: p?.name || "Unknown Product",
        code: p?.code || "",
        totalQty: Number(agg._sum.quantity || 0),
      };
    });

    // Monthly Sales
    const monthlySalesAgg = await prisma.sale.aggregate({
      where: {
        status: "COMPLETED",
        saleDate: { gte: startOfMonth, lte: endOfToday },
      },
      _sum: { grandTotal: true },
    });
    const monthlySales = Number(monthlySalesAgg._sum.grandTotal || 0);

    // Monthly Purchases
    const monthlyPurchasesAgg = await prisma.purchase.aggregate({
      where: {
        status: "COMPLETED",
        purchaseDate: { gte: startOfMonth, lte: endOfToday },
      },
      _sum: { grandTotal: true },
    });
    const monthlyPurchases = Number(monthlyPurchasesAgg._sum.grandTotal || 0);

    // Count all low stock items
    const lowStockCount = await prisma.product.count({
      where: { isActive: true, currentStock: { lte: 10 } },
    });

    // Cash flow: today's collections minus today's payments
    const todayCashFlow = todayCollections - todayPayments;

    // Direct P&L totals (P&L trading part)
    const grossProfit = totalSales - totalPurchases;

    return {
      metrics: {
        todayPurchases,
        todaySales,
        monthlyPurchases,
        monthlySales,
        totalPurchases,
        totalSales,
        supplierOutstanding,
        customerOutstanding,
        currentStockValue,
        todayCashFlow,
        grossProfit,
        todayPayments,
        todayCollections,
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
        type: p.paymentType,
        status: p.status,
      })),
      topPurchasedProducts: topPurchased,
      topSoldProducts: topSold,
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
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0,
      0,
    );
    const endOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999,
    );
    const startOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );
    const endOfMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    const startOfYear = new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0);
    const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);

    // 1. Expenses Today, Month, Year
    const expensesTodayAgg = await prisma.manufacturingExpense.aggregate({
      where: { expenseDate: { gte: startOfToday, lte: endOfToday } },
      _sum: { amount: true },
    });
    const todayExpenses = Number(expensesTodayAgg._sum.amount || 0);

    const expensesMonthAgg = await prisma.manufacturingExpense.aggregate({
      where: { expenseDate: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    });
    const monthlyExpenses = Number(expensesMonthAgg._sum.amount || 0);

    const expensesYearAgg = await prisma.manufacturingExpense.aggregate({
      where: { expenseDate: { gte: startOfYear, lte: endOfYear } },
      _sum: { amount: true },
    });
    const yearlyExpenses = Number(expensesYearAgg._sum.amount || 0);

    // 2. Manufacturing Sales Month, Year
    const salesMonthAgg = await prisma.manufacturingSale.aggregate({
      where: { saleDate: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    });
    const monthlySales = Number(salesMonthAgg._sum.amount || 0);

    const salesYearAgg = await prisma.manufacturingSale.aggregate({
      where: { saleDate: { gte: startOfYear, lte: endOfYear } },
      _sum: { amount: true },
    });
    const yearlySales = Number(salesYearAgg._sum.amount || 0);

    // 3. Profit Calculations
    const monthlyProfit = monthlySales - monthlyExpenses;
    const yearlyProfit = yearlySales - yearlyExpenses;

    // 4. Recent Expenses & Recent Manufacturing Sales
    const recentExpenses = await prisma.manufacturingExpense.findMany({
      take: 5,
      orderBy: { expenseDate: "desc" },
      include: { category: true },
    });

    const recentSales = await prisma.manufacturingSale.findMany({
      take: 5,
      orderBy: { saleDate: "desc" },
    });

    // 5. Chart Data (Monthly trends for current year)
    const monthlyTrendsMap: Record<number, { monthName: string; sales: number; expenses: number; profit: number }> = {};
    for (let m = 0; m < 12; m++) {
      const d = new Date(today.getFullYear(), m, 1);
      const name = d.toLocaleDateString("en-IN", { month: "short" });
      monthlyTrendsMap[m] = { monthName: name, sales: 0, expenses: 0, profit: 0 };
    }

    const yearExpenses = await prisma.manufacturingExpense.findMany({
      where: { expenseDate: { gte: startOfYear, lte: endOfYear } },
    });
    yearExpenses.forEach((e) => {
      const m = new Date(e.expenseDate).getMonth();
      if (monthlyTrendsMap[m]) {
        monthlyTrendsMap[m].expenses += Number(e.amount);
      }
    });

    const yearSales = await prisma.manufacturingSale.findMany({
      where: { saleDate: { gte: startOfYear, lte: endOfYear } },
    });
    yearSales.forEach((s: any) => {
      const m = new Date(s.saleDate).getMonth();
      if (monthlyTrendsMap[m]) {
        monthlyTrendsMap[m].sales += Number(s.amount);
      }
    });

    const trendData = Object.values(monthlyTrendsMap).map((x) => ({
      ...x,
      profit: x.sales - x.expenses,
    }));

    return {
      todayExpenses,
      monthlyExpenses,
      yearlyExpenses,
      monthlySales,
      yearlySales,
      monthlyProfit,
      yearlyProfit,
      trendData,
      recentExpenses: recentExpenses.map((x) => ({
        id: x.id,
        number: x.expenseNumber,
        categoryName: x.category.name,
        description: x.description,
        amount: Number(x.amount),
        date: x.expenseDate.toISOString(),
      })),
      recentSales: recentSales.map((x: any) => ({
        id: x.id,
        amount: Number(x.amount),
        description: x.description,
        date: x.saleDate.toISOString(),
      })),
    };
  },

  /**
   * Calculates metrics for the Purchases Dashboard.
   */
  async getPurchaseMetrics(startDate?: string, endDate?: string) {
    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0,
      0,
    );
    const endOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999,
    );

    const whereAll: Prisma.PurchaseWhereInput = { status: "COMPLETED" };
    const wherePending: Prisma.PurchaseWhereInput = {
      status: "COMPLETED",
      paymentStatus: { in: ["UNPAID", "PARTIALLY_PAID"] },
    };

    if (startDate || endDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
      whereAll.purchaseDate = dateFilter;
      wherePending.purchaseDate = dateFilter;
    }

    const [allCompleted, todayCompleted, pendingPayments] = await Promise.all([
      // 1. Total Purchases
      prisma.purchase.aggregate({
        where: whereAll,
        _sum: { grandTotal: true },
      }),
      // 2. Today's Purchases
      prisma.purchase.aggregate({
        where: {
          status: "COMPLETED",
          purchaseDate: { gte: startOfToday, lte: endOfToday },
        },
        _sum: { grandTotal: true },
      }),
      // 3. Pending Payments
      prisma.purchase.aggregate({
        where: wherePending,
        _sum: { grandTotal: true },
      }),
    ]);

    return {
      totalPurchases: Number(allCompleted._sum.grandTotal || 0),
      todayPurchases: Number(todayCompleted._sum.grandTotal || 0),
      pendingPayments: Number(pendingPayments._sum.grandTotal || 0),
    };
  },

  /**
   * Unified P&L Report Calculations
   */
  async getProfitLossMetrics(
    filter: "daily" | "weekly" | "monthly" | "yearly" | string,
  ) {
    const today = new Date();
    let startDate = new Date();

    if (filter === "daily") {
      startDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 30,
      ); // Last 30 days
    } else if (filter === "weekly") {
      startDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 84,
      ); // Last 12 weeks
    } else if (filter === "monthly") {
      startDate = new Date(today.getFullYear() - 1, today.getMonth(), 1); // Last 12 months
    } else {
      startDate = new Date(today.getFullYear() - 5, 0, 1); // Last 5 years
    }

    // 1. Fetch completed sales in period
    const sales = await prisma.sale.findMany({
      where: { status: "COMPLETED", saleDate: { gte: startDate } },
      select: { saleDate: true, grandTotal: true },
    });

    // 2. Fetch completed purchases in period
    const purchases = await prisma.purchase.findMany({
      where: { status: "COMPLETED", purchaseDate: { gte: startDate } },
      select: { purchaseDate: true, grandTotal: true },
    });

    // 3. Fetch completed manufacturing expenses in period
    const expenses = await prisma.manufacturingExpense.findMany({
      where: { expenseDate: { gte: startDate } },
      select: { expenseDate: true, amount: true },
    });

    // Grouping helper
    const getGroupKey = (date: Date): string => {
      const d = new Date(date);
      if (filter === "daily") {
        return d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        });
      } else if (filter === "weekly") {
        // Simple week number grouping
        const onejan = new Date(d.getFullYear(), 0, 1);
        const weekNum = Math.ceil(
          ((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) /
            7,
        );
        return `Wk ${weekNum}-${d.getFullYear()}`;
      } else if (filter === "monthly") {
        return d.toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit",
        });
      } else {
        return String(d.getFullYear());
      }
    };

    const dataMap: Record<
      string,
      { label: string; sales: number; purchases: number; expenses: number }
    > = {};

    // Initialize labels chronologically
    let runner = new Date(startDate);
    const endRange = new Date();
    while (runner <= endRange) {
      const key = getGroupKey(runner);
      dataMap[key] = { label: key, sales: 0, purchases: 0, expenses: 0 };
      if (filter === "daily") {
        runner.setDate(runner.getDate() + 1);
      } else if (filter === "weekly") {
        runner.setDate(runner.getDate() + 7);
      } else if (filter === "monthly") {
        runner.setMonth(runner.getMonth() + 1);
      } else {
        runner.setFullYear(runner.getFullYear() + 1);
      }
    }

    // Force current date's key is in map
    const finalKey = getGroupKey(endRange);
    if (!dataMap[finalKey]) {
      dataMap[finalKey] = {
        label: finalKey,
        sales: 0,
        purchases: 0,
        expenses: 0,
      };
    }

    // Populate Sales
    sales.forEach((s) => {
      const key = getGroupKey(s.saleDate);
      if (dataMap[key]) {
        dataMap[key].sales += Number(s.grandTotal);
      }
    });

    // Populate Purchases
    purchases.forEach((p) => {
      const key = getGroupKey(p.purchaseDate);
      if (dataMap[key]) {
        dataMap[key].purchases += Number(p.grandTotal);
      }
    });

    // Populate Expenses
    expenses.forEach((e) => {
      const key = getGroupKey(e.expenseDate);
      if (dataMap[key]) {
        dataMap[key].expenses += Number(e.amount);
      }
    });

    const chartData = Object.values(dataMap).map((item) => {
      const grossProfit = item.sales - item.purchases;
      const netProfit = grossProfit - item.expenses;
      return {
        ...item,
        grossProfit,
        netProfit,
      };
    });

    // Aggregate totals for the filter duration
    const totalSales = sales.reduce((sum, s) => sum + Number(s.grandTotal), 0);
    const totalPurchases = purchases.reduce(
      (sum, p) => sum + Number(p.grandTotal),
      0,
    );
    const totalExpenses = expenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );

    const grossProfit = totalSales - totalPurchases;
    const netProfit = grossProfit - totalExpenses;

    // Additional P&L items
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { currentStock: true, averageCost: true },
    });
    const currentInventoryValue = products.reduce(
      (sum, p) =>
        sum + Number(p.currentStock || 0) * Number(p.averageCost || 0),
      0,
    );

    // Sum outstanding dynamically
    const suppliers = await prisma.contact.findMany({
      where: { type: "SUPPLIER", isActive: true },
      select: { id: true },
    });
    let outstandingSupplierAmount = 0;
    for (const s of suppliers) {
      outstandingSupplierAmount += await LedgerService.getSupplierOutstanding(
        s.id,
        prisma,
      );
    }

    const customers = await prisma.contact.findMany({
      where: { type: "CUSTOMER", isActive: true },
      select: { id: true },
    });
    let outstandingCustomerAmount = 0;
    for (const c of customers) {
      outstandingCustomerAmount += await LedgerService.getCustomerOutstanding(
        c.id,
        prisma,
      );
    }

    return {
      period: filter,
      summary: {
        totalSales,
        totalPurchases,
        totalExpenses,
        grossProfit,
        netProfit,
        currentInventoryValue,
        outstandingSupplierAmount,
        outstandingCustomerAmount,
      },
      chartData,
    };
  },

  /**
   * Calculates metrics for Manufacturing Reports.
   */
  async getManufacturingReports(filter: string) {
    const today = new Date();
    let startDate = new Date();

    if (filter === "daily") {
      startDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 30,
      );
    } else if (filter === "weekly") {
      startDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 84,
      );
    } else if (filter === "monthly") {
      startDate = new Date(today.getFullYear() - 1, today.getMonth(), 1);
    } else {
      startDate = new Date(today.getFullYear() - 5, 0, 1);
    }

    const expenses = await prisma.manufacturingExpense.findMany({
      where: { expenseDate: { gte: startDate } },
      include: { category: true },
    });

    const sales = await prisma.manufacturingSale.findMany({
      where: { saleDate: { gte: startDate } },
    });

    const getGroupKey = (date: Date): string => {
      const d = new Date(date);
      if (filter === "daily") {
        return d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        });
      } else if (filter === "weekly") {
        const onejan = new Date(d.getFullYear(), 0, 1);
        const weekNum = Math.ceil(
          ((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) /
            7,
        );
        return `Wk ${weekNum}-${d.getFullYear()}`;
      } else if (filter === "monthly") {
        return d.toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit",
        });
      } else {
        return String(d.getFullYear());
      }
    };

    const dataMap: Record<
      string,
      {
        label: string;
        expenses: number;
        sales: number;
        netProfit: number;
      }
    > = {};

    let runner = new Date(startDate);
    const endRange = new Date();
    while (runner <= endRange) {
      const key = getGroupKey(runner);
      dataMap[key] = {
        label: key,
        expenses: 0,
        sales: 0,
        netProfit: 0,
      };
      if (filter === "daily") {
        runner.setDate(runner.getDate() + 1);
      } else if (filter === "weekly") {
        runner.setDate(runner.getDate() + 7);
      } else if (filter === "monthly") {
        runner.setMonth(runner.getMonth() + 1);
      } else {
        runner.setFullYear(runner.getFullYear() + 1);
      }
    }

    const finalKey = getGroupKey(endRange);
    if (!dataMap[finalKey]) {
      dataMap[finalKey] = {
        label: finalKey,
        expenses: 0,
        sales: 0,
        netProfit: 0,
      };
    }

    expenses.forEach((e) => {
      const key = getGroupKey(e.expenseDate);
      if (dataMap[key]) {
        dataMap[key].expenses += Number(e.amount);
      }
    });

    sales.forEach((s: any) => {
      const key = getGroupKey(s.saleDate);
      if (dataMap[key]) {
        dataMap[key].sales += Number(s.amount);
      }
    });

    const chartData = Object.values(dataMap).map((item) => {
      const netProfit = item.sales - item.expenses;
      return {
        ...item,
        netProfit,
      };
    });

    const catMap: Record<string, number> = {};
    expenses.forEach((e) => {
      const catName = e.category.name;
      catMap[catName] = (catMap[catName] || 0) + Number(e.amount);
    });
    const expenseBreakdown = Object.entries(catMap).map(([name, value]) => ({
      name,
      value,
    }));

    const totalExpenses = expenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );
    const totalSales = sales.reduce(
      (sum: number, s: any) => sum + Number(s.amount),
      0,
    );
    const netProfit = totalSales - totalExpenses;

    return {
      summary: {
        totalExpenses,
        totalSales,
        netProfit,
      },
      expenseBreakdown,
      chartData,
    };
  },
};
