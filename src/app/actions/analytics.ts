"use server";

import { prisma } from "@/lib/prisma";

export async function recordVisit(eventId: string | null, path: string) {
  try {
    // Avoid logging background system routes or authentication paths
    if (
      path.startsWith("/api/") || 
      path.startsWith("/_next/") || 
      path.includes("favicon") ||
      path.includes("id-card")
    ) {
      return { success: true };
    }

    await prisma.pageVisit.create({
      data: {
        eventId: eventId || null,
        path: path.slice(0, 100) // Ensure it fits if long query params
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to record visit:", error);
    return { success: false, error: "Failed to record visit" };
  }
}
