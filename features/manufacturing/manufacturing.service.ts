import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { InventoryService } from "@/features/inventory/inventory.service";
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

export interface CreateProductionInput {
  productId: string;
  boxesProduced: number;
  piecesPerBox: number;
  notes?: string | null;
  productionDate: Date;
}

export interface UpdateProductionInput {
  id: string;
  productId: string;
  boxesProduced: number;
  piecesPerBox: number;
  notes?: string | null;
  productionDate: Date;
}

export const ManufacturingService = {
  // =========================================================================
  // Manufacturing Expense CRUD
  // =========================================================================

  async createExpense(data: CreateExpenseInput) {
    return prisma.$transaction(async (tx) => {
      // 1. Generate sequential expense code
      const expenseNumber = await NumberGeneratorService.generateNumber("EXP", tx);

      // 2. Create the expense entry
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
  // Production Entry CRUD
  // =========================================================================

  async createProductionEntry(data: CreateProductionInput) {
    return prisma.$transaction(async (tx) => {
      // 1. Verify finished goods product
      const product = await tx.product.findUnique({
        where: { id: data.productId },
        select: { id: true, type: true, currentStock: true, name: true },
      });

      if (!product) {
        throw new Error(`Product not found with ID: ${data.productId}`);
      }

      if (product.type !== "FINISHED_GOOD" && product.type !== "TRADING_PRODUCT") {
        throw new Error(`Only Finished Goods or Trading Products can be produced. Product "${product.name}" is a ${product.type}.`);
      }

      // 2. Compute total pieces
      const totalPieces = data.boxesProduced * data.piecesPerBox;

      // 3. Generate sequential production code
      const productionNumber = await NumberGeneratorService.generateNumber("PRD", tx);

      // 4. Create database entry
      const entry = await tx.productionEntry.create({
        data: {
          productionNumber,
          productId: data.productId,
          boxesProduced: new Prisma.Decimal(data.boxesProduced),
          piecesPerBox: data.piecesPerBox,
          totalPieces: new Prisma.Decimal(totalPieces),
          productionDate: data.productionDate,
          notes: data.notes || null,
        },
      });

      // 5. Increase inventory stock using InventoryService
      await InventoryService.increaseStock(
        tx,
        data.productId,
        data.boxesProduced,
        "PRODUCTION_OUTPUT",
        entry.id,
        `Production Log: ${productionNumber}`
      );

      // 6. Optional: Update piecesPerBox default on product if it was changed
      await tx.product.update({
        where: { id: data.productId },
        data: {
          piecesPerBox: data.piecesPerBox,
        },
      });

      return entry;
    });
  },

  async updateProductionEntry(data: UpdateProductionInput) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch existing production entry
      const existing = await tx.productionEntry.findUnique({
        where: { id: data.id },
      });

      if (!existing) {
        throw new Error(`Production entry not found with ID: ${data.id}`);
      }

      // 2. Validate product
      const product = await tx.product.findUnique({
        where: { id: data.productId },
        select: { id: true, type: true, name: true },
      });

      if (!product) {
        throw new Error(`Product not found with ID: ${data.productId}`);
      }

      if (product.type !== "FINISHED_GOOD" && product.type !== "TRADING_PRODUCT") {
        throw new Error(`Product "${product.name}" must be a Finished Good or Trading Product.`);
      }

      // 3. Revert old stock increase
      const oldQty = new Prisma.Decimal(existing.boxesProduced);
      await InventoryService.decreaseStock(
        tx,
        existing.productId,
        oldQty,
        "PRODUCTION_OUTPUT",
        existing.id,
        `Reversal: Editing Production ${existing.productionNumber}`
      );

      // 4. Calculate new total pieces
      const totalPieces = data.boxesProduced * data.piecesPerBox;

      // 5. Update production entry
      const updated = await tx.productionEntry.update({
        where: { id: data.id },
        data: {
          productId: data.productId,
          boxesProduced: new Prisma.Decimal(data.boxesProduced),
          piecesPerBox: data.piecesPerBox,
          totalPieces: new Prisma.Decimal(totalPieces),
          productionDate: data.productionDate,
          notes: data.notes || null,
        },
      });

      // 6. Apply new stock increase
      await InventoryService.increaseStock(
        tx,
        data.productId,
        data.boxesProduced,
        "PRODUCTION_OUTPUT",
        updated.id,
        `Production Edit: ${updated.productionNumber}`
      );

      // Update piecesPerBox default on product
      await tx.product.update({
        where: { id: data.productId },
        data: {
          piecesPerBox: data.piecesPerBox,
        },
      });

      return updated;
    });
  },

  async deleteProductionEntry(id: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch existing production entry
      const existing = await tx.productionEntry.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error(`Production entry not found with ID: ${id}`);
      }

      // 2. Revert stock before deletion
      const qty = new Prisma.Decimal(existing.boxesProduced);
      await InventoryService.decreaseStock(
        tx,
        existing.productId,
        qty,
        "PRODUCTION_OUTPUT",
        existing.id,
        `Reversal: Deleting Production ${existing.productionNumber}`
      );

      // 3. Delete DB record
      await tx.productionEntry.delete({
        where: { id },
      });

      return { success: true };
    });
  },

  async getProductionEntries(params: {
    search?: string;
    productId?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }) {
    const { search = "", productId = "", startDate, endDate, page = 1, pageSize = 10 } = params;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ProductionEntryWhereInput = {};

    if (productId && productId !== "ALL") {
      where.productId = productId;
    }

    if (search) {
      where.product = {
        name: {
          contains: search,
          mode: "insensitive",
        },
      };
    }

    if (startDate || endDate) {
      where.productionDate = {};
      if (startDate) {
        where.productionDate.gte = startDate;
      }
      if (endDate) {
        where.productionDate.lte = endDate;
      }
    }

    const [items, total] = await Promise.all([
      prisma.productionEntry.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { productionDate: "desc" },
        include: {
          product: {
            include: {
              unit: true,
            },
          },
        },
      }),
      prisma.productionEntry.count({ where }),
    ]);

    return {
      items: items.map((x) => ({
        ...x,
        boxesProduced: Number(x.boxesProduced),
        totalPieces: Number(x.totalPieces),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },
};
