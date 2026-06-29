"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { LedgerService } from "@/features/trading/payments/ledger.service";

function handlePrismaError(error: any, defaultMsg: string): string {
  if (error && error.code === "P2002") {
    const target = error.meta?.target;
    const targetStr = JSON.stringify(target).toLowerCase();
    if (targetStr.includes("phone")) {
      return "A contact with this phone number already exists.";
    }
    if (targetStr.includes("email")) {
      return "A contact with this email address already exists.";
    }
    if (targetStr.includes("code")) {
      return "A product with this SKU already exists.";
    }
    if (targetStr.includes("name")) {
      return "This name already exists.";
    }
    return "A duplicate record was detected.";
  }
  return String(error?.message || defaultMsg);
}

export async function getContacts(params: {
  search?: string;
  page?: number;
  pageSize?: number;
  showInactive?: boolean;
  type?: "CUSTOMER" | "SUPPLIER" | "ALL";
}) {
  try {
    const { search = "", page = 1, pageSize = 10, showInactive = false, type = "ALL" } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
      ];
    }

    if (!showInactive) {
      where.isActive = true;
    }

    if (type !== "ALL") {
      where.type = type;
    }

    const [items, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: "asc" },
      }),
      prisma.contact.count({ where }),
    ]);

    const formatted = [];
    for (const item of items) {
      const outstandingBalance = item.type === "SUPPLIER"
        ? await LedgerService.getSupplierOutstanding(item.id, prisma)
        : await LedgerService.getCustomerOutstanding(item.id, prisma);
      formatted.push({
        ...item,
        openingBalance: Number(item.openingBalance),
        outstandingBalance,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      });
    }

    return {
      success: true,
      data: formatted,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error("getContacts failed:", error);
    return {
      success: false,
      error: String(error),
      data: [],
      meta: { total: 0, page: 1, pageSize: 10, totalPages: 0 },
    };
  }
}

export async function getContactDetails(id: string) {
  try {
    const item = await prisma.contact.findUnique({
      where: { id },
    });

    if (!item) {
      return { success: false, error: "Contact not found." };
    }

    const outstandingBalance = item.type === "SUPPLIER"
      ? await LedgerService.getSupplierOutstanding(item.id, prisma)
      : await LedgerService.getCustomerOutstanding(item.id, prisma);

    return {
      success: true,
      data: {
        ...item,
        openingBalance: Number(item.openingBalance),
        outstandingBalance,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("getContactDetails failed:", error);
    return { success: false, error: String(error) };
  }
}

export async function createContact(data: {
  name: string;
  type: "CUSTOMER" | "SUPPLIER";
  contactPerson?: string;
  phone?: string;
  altPhone?: string;
  email?: string;
  gstNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  openingBalance: number;
  notes?: string;
}) {
  try {
    const { name, type, contactPerson, phone, altPhone, email, gstNumber, address, city, state, pincode, openingBalance, notes } = data;

    const payload = {
      name,
      type,
      contactPerson: contactPerson || null,
      phone: phone || null,
      altPhone: altPhone || null,
      email: email || null,
      gstNumber: gstNumber || null,
      address: address || null,
      city: city || null,
      state: state || null,
      pincode: pincode || null,
      openingBalance: openingBalance,
      notes: notes || null,
    };

    const item = await prisma.contact.create({
      data: payload,
    });

    revalidatePath("/master-data/contacts");
    const outstandingBalance = item.type === "SUPPLIER"
      ? await LedgerService.getSupplierOutstanding(item.id, prisma)
      : await LedgerService.getCustomerOutstanding(item.id, prisma);

    return {
      success: true,
      data: {
        ...item,
        openingBalance: Number(item.openingBalance),
        outstandingBalance,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("createContact failed:", error);
    return { success: false, error: handlePrismaError(error, "Failed to create contact.") };
  }
}

export async function updateContact(id: string, data: {
  name: string;
  type: "CUSTOMER" | "SUPPLIER";
  contactPerson?: string;
  phone?: string;
  altPhone?: string;
  email?: string;
  gstNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  openingBalance: number;
  notes?: string;
}) {
  try {
    const { name, type, contactPerson, phone, altPhone, email, gstNumber, address, city, state, pincode, openingBalance, notes } = data;

    const payload = {
      name,
      type,
      contactPerson: contactPerson || null,
      phone: phone || null,
      altPhone: altPhone || null,
      email: email || null,
      gstNumber: gstNumber || null,
      address: address || null,
      city: city || null,
      state: state || null,
      pincode: pincode || null,
      openingBalance: openingBalance,
      notes: notes || null,
    };

    const item = await prisma.contact.update({
      where: { id },
      data: payload,
    });

    revalidatePath("/master-data/contacts");
    revalidatePath(`/master-data/contacts/${id}`);
    
    const outstandingBalance = item.type === "SUPPLIER"
      ? await LedgerService.getSupplierOutstanding(item.id, prisma)
      : await LedgerService.getCustomerOutstanding(item.id, prisma);

    return {
      success: true,
      data: {
        ...item,
        openingBalance: Number(item.openingBalance),
        outstandingBalance,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("updateContact failed:", error);
    return { success: false, error: handlePrismaError(error, "Failed to update contact.") };
  }
}

// Backward compatible wrapper
export async function upsertContact(data: {
  id?: string;
  name: string;
  type: "CUSTOMER" | "SUPPLIER";
  contactPerson?: string;
  phone?: string;
  altPhone?: string;
  email?: string;
  gstNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  openingBalance: number;
  notes?: string;
}) {
  const { id, ...payload } = data;
  if (id) {
    return updateContact(id, payload);
  } else {
    return createContact(payload);
  }
}

export async function toggleContactStatus(id: string, isActive: boolean) {
  try {
    const item = await prisma.contact.update({
      where: { id },
      data: { isActive },
    });

    revalidatePath("/master-data/contacts");
    revalidatePath(`/master-data/contacts/${id}`);
    
    const outstandingBalance = item.type === "SUPPLIER"
      ? await LedgerService.getSupplierOutstanding(item.id, prisma)
      : await LedgerService.getCustomerOutstanding(item.id, prisma);

    return {
      success: true,
      data: {
        ...item,
        openingBalance: Number(item.openingBalance),
        outstandingBalance,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("toggleContactStatus failed:", error);
    return { success: false, error: String(error) };
  }
}
