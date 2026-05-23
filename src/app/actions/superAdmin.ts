"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";

// Middleware helper to ensure user is SUPER_ADMIN
async function ensureSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Super Admin access required");
  }
  return session;
}

export async function getSuperAdminData() {
  try {
    await ensureSuperAdmin();

    const [totalVisits, totalEvents, events, users] = await Promise.all([
      prisma.pageVisit.count(),
      prisma.event.count(),
      prisma.event.findMany({
        select: {
          id: true,
          name: true,
          createdAt: true,
          _count: {
            select: {
              pageVisits: true,
              teams: true,
              programs: true,
              users: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.findMany({
        where: {
          role: { in: ["ADMIN", "MANAGER", "JUDGE"] }
        },
        select: {
          id: true,
          username: true,
          role: true,
          createdAt: true,
          event: {
            select: {
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Group visits by date for simple charts if needed
    // (We will present the raw numbers and fests breakdown on the dashboard)
    return {
      success: true,
      data: {
        totalVisits,
        totalEvents,
        events,
        users
      }
    };
  } catch (error: any) {
    console.error("Super Admin fetch failed:", error);
    return { success: false, error: error.message || "Unauthorized" };
  }
}

export async function createFest(name: string) {
  try {
    await ensureSuperAdmin();

    if (!name || name.trim() === "") {
      return { success: false, error: "Event name is required" };
    }

    const newEvent = await prisma.event.create({
      data: {
        name: name.trim()
      }
    });

    // Create a default GlobalSetting record if it doesn't exist
    // Usually it exists as 'default'
    await prisma.globalSetting.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        festName: name.trim(),
        festMoto: "Celebrating Creativity"
      }
    });

    revalidatePath("/super-admin");
    revalidatePath("/");
    return { success: true, eventId: newEvent.id };
  } catch (error: any) {
    console.error("Failed to create fest:", error);
    return { success: false, error: error.message || "Failed to create event" };
  }
}

export async function createFestUser(data: {
  username: string;
  password?: string;
  role: "ADMIN" | "MANAGER" | "JUDGE";
  eventId: string;
}) {
  try {
    await ensureSuperAdmin();

    const username = data.username.trim();
    if (!username || !data.password) {
      return { success: false, error: "Username and password are required" };
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { username }
    });

    if (existing) {
      return { success: false, error: "Username is already taken" };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: data.role,
        eventId: data.eventId
      }
    });

    revalidatePath("/super-admin");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create user:", error);
    return { success: false, error: error.message || "Failed to create user" };
  }
}
