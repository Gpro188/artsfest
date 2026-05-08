"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function assignProgram(candidateId: string, programId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Unauthorized" };

    if (session.user.role === "MANAGER") {
      const settings = await prisma.globalSetting.findUnique({ where: { id: "default" } });
      if (settings?.programAssignmentDeadline && new Date() > new Date(settings.programAssignmentDeadline)) {
        return { success: false, error: "Assignment deadline has passed. Please contact Admin." };
      }
    }
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { 
        programs: { include: { program: true } }, 
        category: { include: { pointMatrix: true } }
      }
    });

    const program = await prisma.program.findUnique({ where: { id: programId } });

    if (!candidate || !program) return { success: false, error: "Candidate or Program not found" };

    // Validation 1: Category Match
    if (program.type !== "GENERAL" && program.categoryId !== candidate.categoryId) {
      return { success: false, error: "Category mismatch" };
    }

    // Validation 2: Max Individual Limit
    const maxLimit = candidate.category.pointMatrix?.maxIndividualPrograms || 3;
    const currentIndividualCount = candidate.programs.filter(p => p.program.type === "INDIVIDUAL").length;

    if (program.type === "INDIVIDUAL" && currentIndividualCount >= maxLimit) {
      return { success: false, error: `Exceeded max individual limit of ${maxLimit}` };
    }

    // Validation 3: Per Team Limit
    const teamLimit = program.candidateLimitPerTeam || 1;
    const teamAssignmentsCount = await prisma.programAssignment.count({
      where: {
        programId: programId,
        candidate: {
          teamId: candidate.teamId
        }
      }
    });

    if (teamAssignmentsCount >= teamLimit) {
      return { success: false, error: `Your team has already assigned ${teamLimit} candidate(s) to this program (Max limit reached).` };
    }

    await prisma.programAssignment.create({
      data: {
        candidateId,
        programId
      }
    });

    revalidatePath("/dashboard/assignments");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to assign program:", error);
    if (error.code === 'P2002') {
      return { success: false, error: "Candidate is already assigned to this program." };
    }
    return { success: false, error: error.message || "Failed to assign program." };
  }
}

export async function unassignProgram(candidateId: string, programId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Unauthorized" };

    if (session.user.role === "MANAGER") {
      const settings = await prisma.globalSetting.findUnique({ where: { id: "default" } });
      if (settings?.programAssignmentDeadline && new Date() > new Date(settings.programAssignmentDeadline)) {
        return { success: false, error: "Assignment deadline has passed. Cannot unassign program." };
      }
    }
    await prisma.programAssignment.delete({
      where: {
        candidateId_programId: {
          candidateId,
          programId
        }
      }
    });

    revalidatePath("/dashboard/assignments");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to unassign program:", error);
    if (error.code === 'P2025') {
      return { success: false, error: "Assignment not found or already removed." };
    }
    return { success: false, error: error.message || "Failed to unassign program." };
  }
}
