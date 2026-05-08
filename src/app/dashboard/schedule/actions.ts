"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function updateProgramSchedule(id: string, data: { venue: string | null, startTime: string | null, duration?: number, stageType?: string }) {
  try {
    await prisma.program.update({
      where: { id },
      data: {
        venue: data.venue,
        startTime: data.startTime ? new Date(data.startTime) : null,
        duration: data.duration !== undefined ? data.duration : undefined,
        stageType: data.stageType !== undefined ? data.stageType : undefined,
      }
    });

    revalidatePath("/dashboard/schedule");
    return { success: true };
  } catch (error) {
    console.error("Failed to update program schedule:", error);
    return { success: false, error: "Failed to update schedule" };
  }
}

export async function updateCandidateSlot(assignmentId: string, data: { slotNumber: number | null, scheduledTime: string | null }) {
  try {
    await prisma.programAssignment.update({
      where: { id: assignmentId },
      data: {
        slotNumber: data.slotNumber,
        scheduledTime: data.scheduledTime ? new Date(data.scheduledTime) : null,
      }
    });

    revalidatePath("/dashboard/schedule");
    return { success: true };
  } catch (error) {
    console.error("Failed to update candidate slot:", error);
    return { success: false, error: "Failed to update slot" };
  }
}

export async function autoCalculateCandidateSlots(programId: string) {
  try {
    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: { assignments: { orderBy: { createdAt: 'asc' } } }
    });

    if (!program || !program.startTime) return { success: false, error: "Program or Start Time not found" };

    const duration = program.duration || 10;
    const baseTime = new Date(program.startTime);

    const updates = program.assignments.map((assignment, index) => {
      let slotNumber, scheduledTime;
      if (program.type === "INDIVIDUAL") {
        slotNumber = index + 1;
        scheduledTime = new Date(baseTime.getTime() + (index * duration * 60000));
      } else {
        // Group/General programs happen all at once at the program's start time
        slotNumber = 1; 
        scheduledTime = baseTime;
      }
      return prisma.programAssignment.update({
        where: { id: assignment.id },
        data: { slotNumber, scheduledTime }
      });
    });

    await prisma.$transaction(updates);

    revalidatePath("/dashboard/schedule");
    return { success: true };
  } catch (error) {
    console.error("Failed to auto-calculate slots:", error);
    return { success: false, error: "Failed to auto-calculate slots" };
  }
}
