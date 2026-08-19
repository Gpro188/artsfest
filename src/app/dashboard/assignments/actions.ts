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
      const team = await prisma.team.findUnique({
        where: { managerId: session.user.id },
        include: { event: true }
      });
      if (!team) return { success: false, error: "Team not found" };
      
      const now = new Date();
      if (team.event.assignmentStart && now < team.event.assignmentStart) {
        return { success: false, error: `Program assignments open on ${team.event.assignmentStart.toLocaleString()}` };
      }
      if (team.event.assignmentEnd && now > team.event.assignmentEnd) {
        return { success: false, error: "Assignment deadline has passed. Please contact Admin." };
      }
    }
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { 
        programs: { include: { program: true } }, 
        category: { include: { pointMatrix: true } },
        team: true
      }
    });

    const program = await prisma.program.findUnique({ 
      where: { id: programId },
      include: { category: true }
    });

    if (!candidate || !program) return { success: false, error: "Candidate or Program not found" };

    // Validation 1: Category Match (Match by categoryId or matching Category Name in the event)
    let isCategoryMatch = (program.type === "GENERAL" || program.categoryId === candidate.categoryId);
    if (!isCategoryMatch && program.category && candidate.category) {
      if (program.category.name.trim().toLowerCase() === candidate.category.name.trim().toLowerCase()) {
        isCategoryMatch = true;
      }
    }

    if (!isCategoryMatch) {
      return { success: false, error: "Category mismatch" };
    }

    // Auto-normalize candidate categoryId if candidate was linked to the duplicate category in another sub-event
    if (candidate.category && candidate.team && candidate.category.eventId !== candidate.team.eventId) {
      const correctCat = await prisma.category.findFirst({
        where: {
          eventId: candidate.team.eventId,
          name: { equals: candidate.category.name, mode: "insensitive" }
        }
      });
      if (correctCat && correctCat.id !== candidate.categoryId) {
        await prisma.candidate.update({
          where: { id: candidateId },
          data: { categoryId: correctCat.id }
        });
        candidate.categoryId = correctCat.id;
      }
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
      const team = await prisma.team.findUnique({
        where: { managerId: session.user.id },
        include: { event: true }
      });
      if (team && team.event.assignmentEnd && new Date() > team.event.assignmentEnd) {
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
