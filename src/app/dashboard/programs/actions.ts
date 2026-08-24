"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createProgram(data: { 
  programCode?: string | null, 
  name: string, 
  type: string, 
  categoryId: string | null, 
  eventId: string, 
  candidateLimitPerTeam?: number, 
  teamsAllowed?: number,
  membersPerSquad?: number,
  duration?: number 
}) {
  try {
    await prisma.program.create({
      data: {
        programCode: data.programCode,
        name: data.name,
        type: data.type,
        categoryId: data.categoryId,
        eventId: data.eventId,
        candidateLimitPerTeam: data.candidateLimitPerTeam || 1,
        teamsAllowed: data.teamsAllowed || (data.type === "INDIVIDUAL" ? 1 : Math.max(1, Math.round((data.candidateLimitPerTeam || 1) / (data.membersPerSquad || 5)))),
        membersPerSquad: data.membersPerSquad || (data.type === "INDIVIDUAL" ? 1 : 5),
        duration: data.duration || 10,
      }
    });

    revalidatePath("/dashboard/programs");
    return { success: true };
  } catch (error) {
    console.error("Failed to create program:", error);
    return { success: false, error: "Failed to create program" };
  }
}

export async function updateProgram(id: string, data: { 
  programCode?: string | null, 
  name: string, 
  type: string, 
  categoryId: string | null, 
  candidateLimitPerTeam?: number,
  teamsAllowed?: number,
  membersPerSquad?: number
}) {
  try {
    await prisma.program.update({
      where: { id },
      data: {
        programCode: data.programCode,
        name: data.name,
        type: data.type,
        categoryId: data.categoryId,
        candidateLimitPerTeam: data.candidateLimitPerTeam,
        teamsAllowed: data.teamsAllowed || (data.type === "INDIVIDUAL" ? 1 : 1),
        membersPerSquad: data.membersPerSquad || (data.type === "INDIVIDUAL" ? 1 : 5),
      }
    });

    revalidatePath("/dashboard/programs");
    return { success: true };
  } catch (error) {
    console.error("Failed to update program:", error);
    return { success: false, error: "Failed to update program" };
  }
}

export async function bulkImportPrograms(eventId: string, programs: any[]) {
  try {
    const results = await prisma.program.createMany({
      data: programs.map(p => ({
        programCode: p.programCode?.toString() || null,
        name: p.name,
        type: p.type || "INDIVIDUAL",
        categoryId: p.categoryId,
        eventId: eventId,
        candidateLimitPerTeam: parseInt(p.candidateLimitPerTeam) || 1,
        teamsAllowed: parseInt(p.teamsAllowed) || 1,
        membersPerSquad: parseInt(p.membersPerSquad) || 5,
        duration: parseInt(p.duration) || 10,
      }))
    });

    revalidatePath("/dashboard/programs");
    return { success: true, count: results.count };
  } catch (error) {
    console.error("Failed to bulk import programs:", error);
    return { success: false, error: "Failed to import programs. Check your Excel format." };
  }
}

export async function deleteProgram(id: string) {
  try {
    await prisma.program.delete({ where: { id } });

    revalidatePath("/dashboard/programs");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete program:", error);
    return { success: false, error: "Failed to delete program" };
  }
}
