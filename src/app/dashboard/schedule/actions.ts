"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

export async function autoScheduleSequentialPrograms(data: {
  eventId: string;
  startDate: string;
  defaultVenue: string;
  startTimePerDay: string; // e.g. "09:00"
  breakDurationMinutes: number;
}) {
  try {
    const programs = await prisma.program.findMany({
      where: { eventId: data.eventId },
      orderBy: { createdAt: 'asc' }
    });

    if (programs.length === 0) return { success: false, error: "No programs found" };

    let currentDateTime = new Date(`${data.startDate}T${data.startTimePerDay}:00`);

    const updates = [];

    for (const program of programs) {
      const durationMin = program.duration || 15;

      updates.push(
        prisma.program.update({
          where: { id: program.id },
          data: {
            venue: program.venue || data.defaultVenue,
            startTime: new Date(currentDateTime),
          }
        })
      );

      // Increment time by program duration + break duration
      const totalMinutes = durationMin + (data.breakDurationMinutes || 0);
      currentDateTime = new Date(currentDateTime.getTime() + totalMinutes * 60000);
    }

    await prisma.$transaction(updates);

    revalidatePath("/dashboard/schedule");
    return { success: true, count: updates.length };
  } catch (error: any) {
    console.error("Failed auto sequential schedule:", error);
    return { success: false, error: error.message || "Failed to auto-schedule" };
  }
}
