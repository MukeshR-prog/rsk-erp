"use server";

import { prisma } from "@/lib/prisma";

/**
 * Server action to look up a user's email from the database by email or mobile phone number.
 */
export async function resolveUserAuthEmailAction(identifier: string): Promise<{ success: boolean; email: string }> {
  try {
    const raw = identifier.trim();
    if (!raw) {
      return { success: false, email: "" };
    }

    const isEmail = raw.includes("@");
    if (isEmail) {
      return { success: true, email: raw.toLowerCase() };
    }

    // Clean phone number (strip all non-digit characters)
    const cleanPhone = raw.replace(/\D/g, "");

    // Query Profile table in PostgreSQL database
    const profile = await prisma.profile.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: { endsWith: cleanPhone } },
          { email: { startsWith: cleanPhone } },
        ],
      },
      select: { email: true },
    });

    if (profile && profile.email) {
      return { success: true, email: profile.email };
    }

    // Fallback if not found in Profile table directly
    return { success: true, email: `${cleanPhone}@rsk.com` };
  } catch (error) {
    console.error("resolveUserAuthEmailAction error:", error);
    const clean = identifier.replace(/\D/g, "");
    return { success: true, email: clean ? `${clean}@rsk.com` : identifier.trim().toLowerCase() };
  }
}
