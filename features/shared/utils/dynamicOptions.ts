import { Prisma } from "@prisma/client";

/**
 * Automatically resolves a dynamically entered product name.
 * If the product name doesn't exist, it creates a new Product on the fly.
 */
export async function resolveDynamicProduct(
  productId: string,
  tx: Prisma.TransactionClient,
  type: "FINISHED_GOOD" | "TRADING_PRODUCT" | "RAW_MATERIAL" = "TRADING_PRODUCT"
): Promise<string> {
  if (!productId || !productId.startsWith("NEW_OPTION:")) {
    return productId;
  }

  const name = productId.replace("NEW_OPTION:", "").trim();

  // 1. Check if a product with this exact name already exists
  const existing = await tx.product.findUnique({
    where: { name },
  });

  if (existing) {
    return existing.id;
  }

  // 2. Generate a unique code sequentially or with random suffix
  let code = "";
  let isUnique = false;
  let attempts = 0;
  while (!isUnique && attempts < 20) {
    const count = await tx.product.count();
    const rand = Math.floor(100 + Math.random() * 900);
    code = `AUTO-${type.substring(0, 3)}-${count + 1}-${rand}`;
    
    const match = await tx.product.findUnique({ where: { code } });
    if (!match) {
      isUnique = true;
    }
    attempts++;
  }

  // 3. Find a default active unit
  let unit = await tx.unit.findFirst({ where: { isActive: true } });
  if (!unit) {
    unit = await tx.unit.create({
      data: { name: "PCS", isActive: true },
    });
  }

  // 4. Create the new product
  const newProduct = await tx.product.create({
    data: {
      code,
      name,
      type,
      currentStock: 0,
      averageCost: 0,
      isActive: true,
      unitId: unit.id,
    },
  });

  return newProduct.id;
}
