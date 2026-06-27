import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:51214/postgres?sslmode=disable";

const pool = new pg.Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ["error", "warn"],
});

async function main() {
  console.log("Starting seeding master data...");

  // 1. Seed Units
  const units = ["PCS", "ROLL", "KG", "BOX", "PACK", "BUNDLE"];
  console.log("Seeding Units...");
  for (const name of units) {
    await prisma.unit.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // 2. Seed Product Categories
  const productCategories = [
    "Paper Cups",
    "Paper Rolls",
    "Bottom Rolls",
    "Tissues",
    "Packaging",
    "Raw Materials",
  ];
  console.log("Seeding Product Categories...");
  for (const name of productCategories) {
    await prisma.productCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // 3. Seed Expense Categories
  const expenseCategories = [
    "Fuel",
    "Electricity",
    "Labour",
    "Packing",
    "Transport",
    "Maintenance",
    "Office Expense",
    "Miscellaneous",
  ];
  console.log("Seeding Expense Categories...");
  for (const name of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
    await prisma.$disconnect();
  });
