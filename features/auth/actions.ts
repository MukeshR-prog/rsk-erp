"use server";

import { prisma } from "@/lib/prisma";

/**
 * Synchronizes the Supabase authenticated user with the public Profile table in the database.
 * If the profile does not exist, it creates one.
 */
export async function syncProfile(userId: string, email: string) {
  try {
    const existing = await prisma.profile.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.id !== userId) {
        // If the ID in Profile doesn't match the Supabase Auth UID (e.g. database reset/recreation), update it
        const updated = await prisma.profile.update({
          where: { email },
          data: { id: userId },
        });
        return { success: true, profile: updated };
      }
      return { success: true, profile: existing };
    }

    // Create a new Profile record
    const newProfile = await prisma.profile.create({
      data: {
        id: userId,
        email,
        fullName: "RSK Owner",
        role: "OWNER",
      },
    });

    return { success: true, profile: newProfile };
  } catch (error) {
    console.error("syncProfile failed:", error);
    return { success: false, error: String(error) };
  }
}
