"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { BOMRecipeFilters } from "./types";
import { bomRecipeSchema, BOMRecipeFormValues } from "./validations";
import { BOMService } from "./bom.service";

/**
 * Fetch BOM recipes list with search filters, paging, and sorting.
 */
export async function getRecipes(filters: BOMRecipeFilters) {
  try {
    const data = await BOMService.getRecipes(filters, prisma);
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error("getRecipes failed:", error);
    return {
      success: false,
      error: error.message || "Failed to retrieve BOM Recipes.",
    };
  }
}

/**
 * Fetch a single BOM recipe with full details.
 */
export async function getRecipe(id: string) {
  try {
    const data = await BOMService.getRecipeDetails(id, prisma);
    if (!data) {
      return { success: false, error: "BOM Recipe not found." };
    }
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error("getRecipe failed:", error);
    return {
      success: false,
      error: error.message || "Failed to load BOM Recipe details.",
    };
  }
}

/**
 * Create a new BOM Recipe.
 */
export async function createRecipeAction(data: BOMRecipeFormValues) {
  try {
    const validated = bomRecipeSchema.parse(data);

    const recipe = await prisma.$transaction(async (tx) => {
      return await BOMService.createRecipe(validated, tx);
    });

    revalidatePath("/manufacturing/bom");
    revalidatePath("/manufacturing");

    return {
      success: true,
      data: {
        id: recipe.id,
        name: recipe.name,
      },
    };
  } catch (error: any) {
    console.error("createRecipeAction failed:", error);
    if (error.name === "ZodError") {
      return { success: false, error: error.errors[0].message };
    }
    return {
      success: false,
      error: error.message || "Failed to create BOM Recipe.",
    };
  }
}

/**
 * Update an existing BOM Recipe.
 */
export async function updateRecipeAction(id: string, data: BOMRecipeFormValues) {
  try {
    const validated = bomRecipeSchema.parse(data);

    const recipe = await prisma.$transaction(async (tx) => {
      return await BOMService.updateRecipe(id, validated, tx);
    });

    revalidatePath("/manufacturing/bom");
    revalidatePath(`/manufacturing/bom/${id}`);
    revalidatePath("/manufacturing");

    return {
      success: true,
      data: {
        id: recipe.id,
        name: recipe.name,
      },
    };
  } catch (error: any) {
    console.error("updateRecipeAction failed:", error);
    if (error.name === "ZodError") {
      return { success: false, error: error.errors[0].message };
    }
    return {
      success: false,
      error: error.message || "Failed to update BOM Recipe.",
    };
  }
}

/**
 * Soft disable a BOM Recipe.
 */
export async function disableRecipeAction(id: string) {
  try {
    const recipe = await prisma.$transaction(async (tx) => {
      return await BOMService.disableRecipe(id, tx);
    });

    revalidatePath("/manufacturing/bom");
    revalidatePath(`/manufacturing/bom/${id}`);
    revalidatePath("/manufacturing");

    return {
      success: true,
      data: {
        id: recipe.id,
        isActive: recipe.isActive,
      },
    };
  } catch (error: any) {
    console.error("disableRecipeAction failed:", error);
    return {
      success: false,
      error: error.message || "Failed to disable BOM Recipe.",
    };
  }
}

/**
 * Soft enable a BOM Recipe.
 */
export async function enableRecipeAction(id: string) {
  try {
    const recipe = await prisma.$transaction(async (tx) => {
      return await BOMService.enableRecipe(id, tx);
    });

    revalidatePath("/manufacturing/bom");
    revalidatePath(`/manufacturing/bom/${id}`);
    revalidatePath("/manufacturing");

    return {
      success: true,
      data: {
        id: recipe.id,
        isActive: recipe.isActive,
      },
    };
  } catch (error: any) {
    console.error("enableRecipeAction failed:", error);
    return {
      success: false,
      error: error.message || "Failed to enable BOM Recipe.",
    };
  }
}

/**
 * Fetch finished goods dropdown list.
 */
export async function getFinishedGoodsList() {
  try {
    const goods = await prisma.product.findMany({
      where: {
        type: "FINISHED_GOOD",
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        unit: { select: { name: true } },
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      success: true,
      data: goods.map((g) => ({
        id: g.id,
        code: g.code,
        name: g.name,
        unitName: g.unit?.name || "PCS",
      })),
    };
  } catch (error: any) {
    console.error("getFinishedGoodsList failed:", error);
    return {
      success: false,
      error: "Failed to load finished goods list.",
    };
  }
}

/**
 * Fetch raw materials dropdown list.
 */
export async function getRawMaterialsList() {
  try {
    const materials = await prisma.product.findMany({
      where: {
        type: "RAW_MATERIAL",
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        unit: { select: { name: true } },
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      success: true,
      data: materials.map((m) => ({
        id: m.id,
        code: m.code,
        name: m.name,
        unitName: m.unit?.name || "PCS",
      })),
    };
  } catch (error: any) {
    console.error("getRawMaterialsList failed:", error);
    return {
      success: false,
      error: "Failed to load raw materials list.",
    };
  }
}
