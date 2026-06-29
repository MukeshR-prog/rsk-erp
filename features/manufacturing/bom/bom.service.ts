import { Prisma, PrismaClient } from "@prisma/client";
import { BOMRecipeFilters } from "./types";
import { BOMRecipeFormValues } from "./validations";

export const BOMService = {
  /**
   * Calculates total materials summary.
   */
  calculateTotalMaterials(items: { quantity: number }[]): number {
    return items.length;
  },

  /**
   * Validates duplicate names and product rules in database transactions.
   */
  async validateRecipe(
    data: BOMRecipeFormValues,
    tx: Prisma.TransactionClient,
    ignoredRecipeId?: string
  ): Promise<void> {
    // 1. Validate recipe name uniqueness
    const existingName = await tx.bOMRecipe.findFirst({
      where: {
        name: { equals: data.name, mode: "insensitive" },
        id: ignoredRecipeId ? { not: ignoredRecipeId } : undefined,
      },
    });

    if (existingName) {
      throw new Error(`A BOM Recipe with the name "${data.name}" already exists.`);
    }

    // 2. Validate finished product existence
    const finishedProduct = await tx.product.findUnique({
      where: { id: data.finishedProductId },
      select: { type: true, isActive: true },
    });

    if (!finishedProduct) {
      throw new Error("Finished product does not exist.");
    }
    if (finishedProduct.type !== "FINISHED_GOOD") {
      throw new Error("The selected product is not classified as a finished good.");
    }
    if (!finishedProduct.isActive) {
      throw new Error("Cannot associate a recipe with an inactive product.");
    }

    // 3. Validate raw materials
    const rawMaterialIds = data.items.map((i) => i.materialId);
    const rawProducts = await tx.product.findMany({
      where: { id: { in: rawMaterialIds } },
      select: { id: true, type: true, isActive: true, name: true },
    });

    const productMap = new Map(rawProducts.map((p) => [p.id, p]));

    for (const item of data.items) {
      const prod = productMap.get(item.materialId);
      if (!prod) {
        throw new Error(`Product not found with ID: ${item.materialId}`);
      }
      if (prod.type !== "RAW_MATERIAL") {
        throw new Error(`Product "${prod.name}" is not classified as a raw material.`);
      }
      if (!prod.isActive) {
        throw new Error(`Raw material "${prod.name}" is currently inactive.`);
      }
      if (item.quantity <= 0) {
        throw new Error(`Quantity for raw material "${prod.name}" must be greater than zero.`);
      }
    }
  },

  /**
   * Fetches BOM recipes with search, sorting, and page limits.
   */
  async getRecipes(filters: BOMRecipeFilters, client: PrismaClient | Prisma.TransactionClient) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.BOMRecipeWhereInput = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.finishedProductId) {
      where.finishedProductId = filters.finishedProductId;
    }

    if (filters.search) {
      where.OR = [
        {
          name: {
            contains: filters.search,
            mode: "insensitive",
          },
        },
        {
          finishedProduct: {
            name: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
        },
        {
          finishedProduct: {
            code: {
              contains: filters.search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const orderByField = filters.sortBy || "updatedAt";
    const orderByOrder = filters.sortOrder || "desc";

    const [items, total] = await Promise.all([
      client.bOMRecipe.findMany({
        where,
        include: {
          finishedProduct: {
            select: {
              name: true,
              code: true,
            },
          },
          items: true,
        },
        orderBy: {
          [orderByField]: orderByOrder,
        },
        skip,
        take: limit,
      }),
      client.bOMRecipe.count({ where }),
    ]);

    const formattedItems = items.map((item) => ({
      id: item.id,
      name: item.name,
      finishedProductId: item.finishedProductId,
      finishedProductName: item.finishedProduct.name,
      finishedProductCode: item.finishedProduct.code,
      itemCount: item.items.length,
      wasteFactorPercent: Number(item.wasteFactorPercent),
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return {
      items: formattedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Fetches full recipe details including material lines.
   */
  async getRecipeDetails(id: string, client: PrismaClient | Prisma.TransactionClient) {
    const recipe = await client.bOMRecipe.findUnique({
      where: { id },
      include: {
        finishedProduct: {
          select: {
            id: true,
            name: true,
            code: true,
            unit: { select: { name: true } },
          },
        },
        items: {
          include: {
            material: {
              select: {
                id: true,
                name: true,
                code: true,
                unit: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!recipe) {
      return null;
    }

    return {
      id: recipe.id,
      name: recipe.name,
      finishedProductId: recipe.finishedProductId,
      finishedProductName: recipe.finishedProduct.name,
      finishedProductCode: recipe.finishedProduct.code,
      finishedProductUnit: recipe.finishedProduct.unit?.name || "PCS",
      wasteFactorPercent: Number(recipe.wasteFactorPercent),
      isActive: recipe.isActive,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
      items: recipe.items.map((i) => ({
        id: i.id,
        materialId: i.materialId,
        materialName: i.material.name,
        materialCode: i.material.code,
        materialUnit: i.material.unit?.name || "PCS",
        quantity: Number(i.quantity),
      })),
    };
  },

  /**
   * Creates a new BOM recipe inside a transaction.
   */
  async createRecipe(data: BOMRecipeFormValues, tx: Prisma.TransactionClient) {
    // 1. Validate rules
    await this.validateRecipe(data, tx);

    // 2. Prevent duplicate material IDs (merge them if any slipped past validation, though validations block them)
    const mergedItems = new Map<string, number>();
    for (const item of data.items) {
      const existingQty = mergedItems.get(item.materialId) || 0;
      mergedItems.set(item.materialId, existingQty + item.quantity);
    }

    const itemsList = Array.from(mergedItems.entries()).map(([materialId, quantity]) => ({
      materialId,
      quantity: new Prisma.Decimal(quantity),
    }));

    // 3. Write recipe header and details
    const recipe = await tx.bOMRecipe.create({
      data: {
        name: data.name,
        finishedProductId: data.finishedProductId,
        wasteFactorPercent: new Prisma.Decimal(data.wasteFactorPercent),
        isActive: true,
        items: {
          create: itemsList,
        },
      },
      include: {
        items: true,
      },
    });

    return recipe;
  },

  /**
   * Updates an existing BOM recipe inside a transaction.
   */
  async updateRecipe(id: string, data: BOMRecipeFormValues, tx: Prisma.TransactionClient) {
    // 1. Verify existence
    const existingRecipe = await tx.bOMRecipe.findUnique({
      where: { id },
    });

    if (!existingRecipe) {
      throw new Error(`BOM Recipe not found with ID: ${id}`);
    }

    // 2. Validate rules
    await this.validateRecipe(data, tx, id);

    // 3. Merge raw items
    const mergedItems = new Map<string, number>();
    for (const item of data.items) {
      const existingQty = mergedItems.get(item.materialId) || 0;
      mergedItems.set(item.materialId, existingQty + item.quantity);
    }

    const itemsList = Array.from(mergedItems.entries()).map(([materialId, quantity]) => ({
      materialId,
      quantity: new Prisma.Decimal(quantity),
    }));

    // 4. Delete old details
    await tx.bOMItem.deleteMany({
      where: { recipeId: id },
    });

    // 5. Update header and insert new details
    const updated = await tx.bOMRecipe.update({
      where: { id },
      data: {
        name: data.name,
        finishedProductId: data.finishedProductId,
        wasteFactorPercent: new Prisma.Decimal(data.wasteFactorPercent),
        items: {
          create: itemsList,
        },
      },
      include: {
        items: true,
      },
    });

    return updated;
  },

  /**
   * Soft-disables a BOM recipe by setting isActive to false.
   */
  async disableRecipe(id: string, tx: Prisma.TransactionClient) {
    const existingRecipe = await tx.bOMRecipe.findUnique({
      where: { id },
    });

    if (!existingRecipe) {
      throw new Error(`BOM Recipe not found with ID: ${id}`);
    }

    const updated = await tx.bOMRecipe.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    return updated;
  },

  /**
   * Soft-enables a BOM recipe by setting isActive to true.
   */
  async enableRecipe(id: string, tx: Prisma.TransactionClient) {
    const existingRecipe = await tx.bOMRecipe.findUnique({
      where: { id },
    });

    if (!existingRecipe) {
      throw new Error(`BOM Recipe not found with ID: ${id}`);
    }

    const updated = await tx.bOMRecipe.update({
      where: { id },
      data: {
        isActive: true,
      },
    });

    return updated;
  },
};
