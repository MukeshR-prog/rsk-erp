import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NumberGeneratorService } from "@/features/shared/services/numberGenerator.service";

export interface CreateExpenseInput {
  categoryId: string;
  description: string;
  amount: number;
  notes?: string | null;
  expenseDate: Date;
}

export interface UpdateExpenseInput {
  id: string;
  categoryId: string;
  description: string;
  amount: number;
  notes?: string | null;
  expenseDate: Date;
}

export interface CreateManufacturingSaleInput {
  saleDate: Date;
  amount: number;
  description?: string | null;
}

export interface UpdateManufacturingSaleInput {
  id: string;
  saleDate: Date;
  amount: number;
  description?: string | null;
}

export const ManufacturingService = {
  // =========================================================================
  // Manufacturing Expense CRUD
  // =========================================================================

  async createExpense(data: CreateExpenseInput) {
    return prisma.$transaction(async (tx) => {
      const expenseNumber = await NumberGeneratorService.generateNumber("EXP", tx);

      const expense = await tx.manufacturingExpense.create({
        data: {
          expenseNumber,
          categoryId: data.categoryId,
          description: data.description,
          amount: new Prisma.Decimal(data.amount),
          notes: data.notes || null,
          expenseDate: data.expenseDate,
        },
        include: {
          category: true,
        },
      });

      return expense;
    });
  },

  async updateExpense(data: UpdateExpenseInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.manufacturingExpense.findUnique({
        where: { id: data.id },
      });

      if (!existing) {
        throw new Error(`Expense record not found with ID: ${data.id}`);
      }

      const updated = await tx.manufacturingExpense.update({
        where: { id: data.id },
        data: {
          categoryId: data.categoryId,
          description: data.description,
          amount: new Prisma.Decimal(data.amount),
          notes: data.notes || null,
          expenseDate: data.expenseDate,
        },
        include: {
          category: true,
        },
      });

      return updated;
    });
  },

  async deleteExpense(id: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.manufacturingExpense.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error(`Expense record not found with ID: ${id}`);
      }

      await tx.manufacturingExpense.delete({
        where: { id },
      });

      return { success: true };
    });
  },

  async getExpenses(params: {
    search?: string;
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }) {
    const { search = "", categoryId = "", startDate, endDate, page = 1, pageSize = 10 } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ManufacturingExpenseWhereInput = {};

    if (search) {
      where.description = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (categoryId && categoryId !== "ALL") {
      where.categoryId = categoryId;
    }

    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) {
        where.expenseDate.gte = startDate;
      }
      if (endDate) {
        where.expenseDate.lte = endDate;
      }
    }

    const [items, total] = await Promise.all([
      prisma.manufacturingExpense.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { expenseDate: "desc" },
        include: {
          category: true,
        },
      }),
      prisma.manufacturingExpense.count({ where }),
    ]);

    return {
      items: items.map((x) => ({
        ...x,
        amount: Number(x.amount),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },

  // =========================================================================
  // Manufacturing Sales Revenue CRUD
  // =========================================================================

  async createManufacturingSale(data: CreateManufacturingSaleInput) {
    const sale = await prisma.manufacturingSale.create({
      data: {
        saleDate: data.saleDate,
        amount: new Prisma.Decimal(data.amount),
        description: data.description || null,
      },
    });

    return {
      ...sale,
      amount: Number(sale.amount),
    };
  },

  async updateManufacturingSale(data: UpdateManufacturingSaleInput) {
    const existing = await prisma.manufacturingSale.findUnique({
      where: { id: data.id },
    });

    if (!existing) {
      throw new Error(`Manufacturing sale record not found with ID: ${data.id}`);
    }

    const updated = await prisma.manufacturingSale.update({
      where: { id: data.id },
      data: {
        saleDate: data.saleDate,
        amount: new Prisma.Decimal(data.amount),
        description: data.description || null,
      },
    });

    return {
      ...updated,
      amount: Number(updated.amount),
    };
  },

  async deleteManufacturingSale(id: string) {
    await prisma.manufacturingSale.delete({
      where: { id },
    });

    return { success: true };
  },

  async getManufacturingSales(params: {
    search?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }) {
    const { search = "", startDate, endDate, page = 1, pageSize = 10 } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ManufacturingSaleWhereInput = {};

    if (search) {
      where.description = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) {
        where.saleDate.gte = startDate;
      }
      if (endDate) {
        where.saleDate.lte = endDate;
      }
    }

    const [items, total] = await Promise.all([
      prisma.manufacturingSale.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { saleDate: "desc" },
      }),
      prisma.manufacturingSale.count({ where }),
    ]);

    return {
      items: items.map((x: any) => ({
        ...x,
        amount: Number(x.amount),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },
};
