"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export async function updateSettings(data: { 
  festName: string, 
  festMoto: string, 
  festLogo: string,
  candidateRegistrationDeadline: string | null,
  programAssignmentDeadline: string | null
}) {
  try {
    await prisma.globalSetting.upsert({
      where: { id: "default" },
      update: {
        festName: data.festName,
        festMoto: data.festMoto,
        festLogo: data.festLogo,
        candidateRegistrationDeadline: data.candidateRegistrationDeadline ? new Date(data.candidateRegistrationDeadline) : null,
        programAssignmentDeadline: data.programAssignmentDeadline ? new Date(data.programAssignmentDeadline) : null,
      },
      create: {
        id: "default",
        festName: data.festName,
        festMoto: data.festMoto,
        festLogo: data.festLogo,
        candidateRegistrationDeadline: data.candidateRegistrationDeadline ? new Date(data.candidateRegistrationDeadline) : null,
        programAssignmentDeadline: data.programAssignmentDeadline ? new Date(data.programAssignmentDeadline) : null,
      }
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to update settings:", error);
    return { success: false, error: "Failed to update settings" };
  }
}

export async function exportAllData() {
  try {
    const data = {
      events: await prisma.event.findMany({ include: { categories: true } }),
      teams: await prisma.team.findMany(),
      programs: await prisma.program.findMany(),
      candidates: await prisma.candidate.findMany(),
      programAssignments: await prisma.programAssignment.findMany(),
      results: await prisma.result.findMany(),
      settings: await prisma.globalSetting.findFirst()
    };
    return { success: true, data };
  } catch (error) {
    console.error("Export failed:", error);
    return { success: false, error: "Export failed" };
  }
}

export async function resetSystem() {
  try {
    // Order matters due to foreign keys
    await prisma.result.deleteMany({});
    await prisma.programAssignment.deleteMany({});
    await prisma.candidate.deleteMany({});
    await prisma.program.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.team.deleteMany({});
    await prisma.event.deleteMany({});
    // We keep GlobalSetting and Users to avoid locking out the admin
    
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Reset failed:", error);
    return { success: false, error: "Reset failed" };
  }
}

export async function importData(data: any) {
  try {
    // Wipe first
    await resetSystem();

    // Import Event & Categories
    for (const event of data.events) {
      await prisma.event.create({
        data: {
          id: event.id,
          name: event.name,
          startDate: event.startDate,
          endDate: event.endDate,
          categories: {
            create: event.categories.map((c: any) => ({
              id: c.id,
              name: c.name,
              chestNumberOffset: c.chestNumberOffset,
              posterBgUrl: c.posterBgUrl
            }))
          }
        }
      });
    }

    // Import Teams
    if (data.teams) {
      await prisma.team.createMany({ data: data.teams });
    }

    // Import Programs
    if (data.programs) {
      await prisma.program.createMany({ data: data.programs });
    }

    // Import Candidates
    if (data.candidates) {
      await prisma.candidate.createMany({ data: data.candidates });
    }

    // Import Assignments
    if (data.programAssignments) {
      await prisma.programAssignment.createMany({ data: data.programAssignments });
    }

    // Import Results
    if (data.results) {
      await prisma.result.createMany({ data: data.results });
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Import failed:", error);
    return { success: false, error: "Import failed. File might be corrupted." };
  }
}

export async function updatePassword(userId: string, password: string) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to update password:", error);
    return { success: false, error: "Failed to update password" };
  }
}
