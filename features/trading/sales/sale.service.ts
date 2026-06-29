import { Prisma, PrismaClient, SaleStatus, SalePaymentStatus } from "@prisma/client";
import { InventoryService } from "@/features/inventory/inventory.service";
import { SaleNumberService } from "./saleNumber.service";
import { CreateSaleDTO, EditSaleDTO } from "./validations";

export const SaleService = {
  /**
   * Calculates totals (subtotal, grandTotal) for sale lines.
   */
  calculateSaleTotals(
    items: { quantity: number; sellingRate: number; discount: number }[],
    discountHeader: number,
    transportCharges: number
  ) {
    let subtotal = new Prisma.Decimal(0);
    const lineTotals = items.map((item) => {
      const qty = new Prisma.Decimal(item.quantity);
      const rate = new Prisma.Decimal(item.sellingRate);
      const disc = new Prisma.Decimal(item.discount);
      const lineTotal = qty.mul(rate).sub(disc);
      subtotal = subtotal.add(lineTotal);
      return lineTotal;
    });

    const discHeader = new Prisma.Decimal(discountHeader);
    const transport = new Prisma.Decimal(transportCharges);
    const grandTotal = subtotal.sub(discHeader).add(transport);

    return {
      subtotal,
      grandTotal,
      lineTotals,
    };
  },

  /**
   * Validates customer rules and sufficient inventory availability.
   */
  async validateSale(
    customerId: string,
    items: { productId: string; quantity: number }[],
    tx: Prisma.TransactionClient,
    ignoredSaleId?: string
  ): Promise<void> {
    // 1. Validate customer existence and state
    const customer = await tx.contact.findUnique({
      where: { id: customerId },
      select: { type: true, isActive: true },
    });

    if (!customer) {
      throw new Error("Customer profile does not exist.");
    }
    if (customer.type !== "CUSTOMER") {
      throw new Error("The selected profile is not registered as a customer.");
    }
    if (!customer.isActive) {
      throw new Error("Cannot log transactions for an inactive customer.");
    }

    // 2. Validate sufficient inventory
    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { name: true, currentStock: true },
      });

      if (!product) {
        throw new Error(`Product not found with ID: ${item.productId}`);
      }

      const availableStock = Number(product.currentStock || 0);
      if (availableStock < item.quantity) {
        throw new Error(
          `Insufficient stock for product "${product.name}". Available: ${availableStock}, Requested: ${item.quantity}`
        );
      }
    }
  },

  /**
   * Creates a sale transaction inside a Prisma transaction wrapper.
   */
  async createSale(data: CreateSaleDTO, tx: Prisma.TransactionClient) {
    // 1. Merge duplicate product rows
    const mergedItems = new Map<string, { quantity: number; sellingRate: number; discount: number; remarks: string }>();
    for (const item of data.items) {
      const existing = mergedItems.get(item.productId);
      const remarks = item.remarks || "";
      if (existing) {
        const nextQty = existing.quantity + item.quantity;
        const totalRevenueBefore = existing.quantity * existing.sellingRate;
        const totalRevenueCurrent = item.quantity * item.sellingRate;
        const nextRate = nextQty > 0 ? (totalRevenueBefore + totalRevenueCurrent) / nextQty : item.sellingRate;
        const nextDiscount = existing.discount + item.discount;
        const nextRemarks = [existing.remarks, remarks].filter(Boolean).join("; ");

        mergedItems.set(item.productId, {
          quantity: nextQty,
          sellingRate: nextRate,
          discount: nextDiscount,
          remarks: nextRemarks,
        });
      } else {
        mergedItems.set(item.productId, {
          quantity: item.quantity,
          sellingRate: item.sellingRate,
          discount: item.discount,
          remarks,
        });
      }
    }

    const itemsList = Array.from(mergedItems.entries()).map(([productId, val]) => ({
      productId,
      quantity: val.quantity,
      sellingRate: val.sellingRate,
      discount: val.discount,
      remarks: val.remarks || null,
    }));

    // 2. Validate customer & stock (only if COMPLETED)
    if (data.status === "COMPLETED") {
      await this.validateSale(data.customerId, itemsList, tx);
    }

    // 3. Generate sequential invoice code
    const saleNumber = await SaleNumberService.generateNextSaleNumber(tx);

    // 4. Calculate subtotal & grandTotal
    const { subtotal, grandTotal, lineTotals } = this.calculateSaleTotals(
      itemsList,
      data.discount || 0,
      data.transportCharges || 0
    );

    // 5. Create Sale registry header
    const sale = await tx.sale.create({
      data: {
        saleNumber,
        customerId: data.customerId,
        saleDate: data.saleDate,
        reference: data.reference || null,
        notes: data.notes || null,
        discount: new Prisma.Decimal(data.discount || 0),
        transportCharges: new Prisma.Decimal(data.transportCharges || 0),
        subtotal,
        grandTotal,
        status: data.status,
        paymentStatus: "UNPAID",
        items: {
          create: itemsList.map((item, idx) => ({
            productId: item.productId,
            quantity: new Prisma.Decimal(item.quantity),
            sellingRate: new Prisma.Decimal(item.sellingRate),
            discount: new Prisma.Decimal(item.discount),
            lineTotal: lineTotals[idx],
            remarks: item.remarks,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // 6. Deduct stock if COMPLETED
    if (data.status === "COMPLETED") {
      for (const item of sale.items) {
        await InventoryService.decreaseStock(
          tx,
          item.productId,
          item.quantity,
          "SALE",
          sale.id,
          `Sale Invoice: ${saleNumber}`
        );
      }
    }

    return sale;
  },

  /**
   * Refactors / edits a sale invoice with inventory sync.
   */
  async editSale(saleId: string, data: EditSaleDTO, tx: Prisma.TransactionClient) {
    const originalSale = await tx.sale.findUnique({
      where: { id: saleId },
      include: { items: true },
    });

    if (!originalSale) {
      throw new Error(`Sale record not found with ID: ${saleId}`);
    }

    if (originalSale.status === "CANCELLED") {
      throw new Error("Cannot edit a cancelled sale invoice.");
    }

    // 1. Temporarily restore original stock level (compensation rollback)
    if (originalSale.status === "COMPLETED") {
      for (const item of originalSale.items) {
        await InventoryService.increaseStock(
          tx,
          item.productId,
          item.quantity,
          "SALE",
          originalSale.id,
          `Compensation: Edit rollback of invoice ${originalSale.saleNumber}`
        );
      }
    }

    // 2. Merge duplicate products
    const mergedItems = new Map<string, { quantity: number; sellingRate: number; discount: number; remarks: string }>();
    for (const item of data.items) {
      const existing = mergedItems.get(item.productId);
      const remarks = item.remarks || "";
      if (existing) {
        const nextQty = existing.quantity + item.quantity;
        const totalRev = existing.quantity * existing.sellingRate;
        const currentRev = item.quantity * item.sellingRate;
        const nextRate = nextQty > 0 ? (totalRev + currentRev) / nextQty : item.sellingRate;
        const nextDiscount = existing.discount + item.discount;
        const nextRemarks = [existing.remarks, remarks].filter(Boolean).join("; ");

        mergedItems.set(item.productId, {
          quantity: nextQty,
          sellingRate: nextRate,
          discount: nextDiscount,
          remarks: nextRemarks,
        });
      } else {
        mergedItems.set(item.productId, {
          quantity: item.quantity,
          sellingRate: item.sellingRate,
          discount: item.discount,
          remarks,
        });
      }
    }

    const itemsList = Array.from(mergedItems.entries()).map(([productId, val]) => ({
      productId,
      quantity: val.quantity,
      sellingRate: val.sellingRate,
      discount: val.discount,
      remarks: val.remarks || null,
    }));

    // 3. Validate new stock levels against the restored state
    if (data.status === "COMPLETED") {
      await this.validateSale(data.customerId, itemsList, tx);
    }

    // 4. Calculate subtotal & grandTotal
    const { subtotal, grandTotal, lineTotals } = this.calculateSaleTotals(
      itemsList,
      data.discount || 0,
      data.transportCharges || 0
    );

    // 5. Delete original items
    await tx.saleItem.deleteMany({
      where: { saleId },
    });

    // 6. Update Sale header and write new items
    const updatedSale = await tx.sale.update({
      where: { id: saleId },
      data: {
        customerId: data.customerId,
        saleDate: data.saleDate,
        reference: data.reference || null,
        notes: data.notes || null,
        discount: new Prisma.Decimal(data.discount || 0),
        transportCharges: new Prisma.Decimal(data.transportCharges || 0),
        subtotal,
        grandTotal,
        status: data.status,
        items: {
          create: itemsList.map((item, idx) => ({
            productId: item.productId,
            quantity: new Prisma.Decimal(item.quantity),
            sellingRate: new Prisma.Decimal(item.sellingRate),
            discount: new Prisma.Decimal(item.discount),
            lineTotal: lineTotals[idx],
            remarks: item.remarks,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // 7. Deduct stock if new status is COMPLETED
    if (data.status === "COMPLETED") {
      for (const item of updatedSale.items) {
        await InventoryService.decreaseStock(
          tx,
          item.productId,
          item.quantity,
          "SALE",
          updatedSale.id,
          `Sale Edit Invoice: ${updatedSale.saleNumber}`
        );
      }
    }

    return updatedSale;
  },

  /**
   * Soft-cancels a sale and restores stock counts.
   */
  async cancelSale(
    saleId: string,
    cancellationReason: string,
    updatedById: string,
    tx: Prisma.TransactionClient
  ) {
    const sale = await tx.sale.findUnique({
      where: { id: saleId },
      include: { items: true },
    });

    if (!sale) {
      throw new Error(`Sale record not found with ID: ${saleId}`);
    }

    if (sale.status === "CANCELLED") {
      throw new Error("This sale has already been cancelled.");
    }

    // 1. Update status to CANCELLED
    const updatedSale = await tx.sale.update({
      where: { id: saleId },
      data: {
        status: "CANCELLED",
      },
    });

    // 2. Restore stock if the cancelled sale was COMPLETED
    if (sale.status === "COMPLETED") {
      for (const item of sale.items) {
        await InventoryService.increaseStock(
          tx,
          item.productId,
          item.quantity,
          "SALE",
          sale.id,
          `Sale Cancellation Reversal: ${sale.saleNumber} - Reason: ${cancellationReason}`
        );
      }
    }

    return updatedSale;
  },

  /**
   * Fetches sales logs with query filters.
   */
  async getSales(filters: any, prisma: PrismaClient | Prisma.TransactionClient) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.SaleWhereInput = {};

    if (filters.search) {
      where.OR = [
        { saleNumber: { contains: filters.search, mode: "insensitive" } },
        { customer: { name: { contains: filters.search, mode: "insensitive" } } },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    const [items, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        orderBy: { saleDate: "desc" },
        skip,
        take: limit,
        include: {
          customer: {
            select: { name: true },
          },
        },
      }),
      prisma.sale.count({ where }),
    ]);

    return {
      items,
      total,
      pages: Math.ceil(total / limit),
      page,
      limit,
    };
  },

  /**
   * Fetch details of a single sale record.
   */
  async getSale(saleId: string, prisma: PrismaClient | Prisma.TransactionClient) {
    return prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: { name: true, code: true, volumeMl: true, color: true },
            },
          },
        },
        payments: {
          where: { status: "COMPLETED" },
          orderBy: { paymentDate: "desc" },
        },
      },
    });
  },
};
