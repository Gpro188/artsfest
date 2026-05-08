"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function createTeam(data: any) {
  try {
    const existingPrefix = await prisma.team.findUnique({
      where: { prefixCode: data.prefixCode }
    });
    
    if (existingPrefix) return { success: false, error: "Prefix code already exists" };

    const existingManager = await prisma.user.findUnique({
      where: { username: data.managerUsername }
    });

    if (existingManager) return { success: false, error: "Manager username already exists" };

    const hashedPassword = await bcrypt.hash(data.managerPassword, 10);

    // Create Manager and Team in a transaction
    await prisma.$transaction(async (tx) => {
      const manager = await tx.user.create({
        data: {
          username: data.managerUsername,
          password: hashedPassword,
          role: "MANAGER"
        }
      });

      await tx.team.create({
        data: {
          name: data.name,
          prefixCode: data.prefixCode,
          eventId: data.eventId,
          managerId: manager.id,
          leaderName: data.leaderName,
          leaderPhoto: data.leaderPhoto,
          flagColor: data.flagColor,
        }
      });
    });

    revalidatePath("/dashboard/teams");
    return { success: true };
  } catch (error) {
    console.error("Failed to create team:", error);
    return { success: false, error: "Failed to create team. Ensure prefix is unique." };
  }
}

export async function updateTeam(id: string, data: any) {
  try {
    const updateData: any = {
      name: data.name,
      prefixCode: data.prefixCode,
      leaderName: data.leaderName,
      leaderPhoto: data.leaderPhoto,
      flagColor: data.flagColor,
    };

    if (data.managerPassword) {
      const hashedPassword = await bcrypt.hash(data.managerPassword, 10);
      const team = await prisma.team.findUnique({ where: { id } });
      if (team?.managerId) {
        await prisma.user.update({
          where: { id: team.managerId },
          data: { password: hashedPassword }
        });
      }
    }

    await prisma.team.update({
      where: { id },
      data: updateData
    });

    revalidatePath("/dashboard/teams");
    return { success: true };
  } catch (error) {
    console.error("Failed to update team:", error);
    return { success: false, error: "Failed to update team" };
  }
}

export async function deleteTeam(id: string) {
  try {
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) return { success: false, error: "Team not found" };

    // Delete Team and Manager in transaction
    await prisma.$transaction(async (tx) => {
      await tx.team.delete({ where: { id } });
      if (team.managerId) {
        await tx.user.delete({ where: { id: team.managerId } });
      }
    });

    revalidatePath("/dashboard/teams");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete team:", error);
    return { success: false, error: "Failed to delete team" };
  }
}
