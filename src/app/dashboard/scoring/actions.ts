"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Helper to determine Grade based on marks
function calculateGrade(marks: number) {
  if (marks >= 80) return "A";
  if (marks >= 60) return "B";
  return null;
}

// Helper to recalculate ranks and points for a specific program
async function recalculateProgramResults(programId: string, manualUpdateId?: string) {
  const results = await prisma.result.findMany({
    where: { programId },
    orderBy: { marks: 'desc' },
    include: { 
      program: { 
        include: { 
          category: { include: { pointMatrix: true } },
          event: { include: { generalPointMatrix: true } }
        } 
      } 
    }
  });

  if (results.length === 0) return;

  const program = results[0].program;
  const programType = program.type;
  
  let pointsConfig = { rank1: 5, rank2: 3, rank3: 1, gradeA: 5, gradeB: 3 };

  if (programType === "GENERAL") {
    const eventMatrix = program.event?.generalPointMatrix;
    if (eventMatrix?.generalPoints) {
      try {
        pointsConfig = JSON.parse(eventMatrix.generalPoints);
      } catch (e) {}
    }
  } else {
    const categoryMatrix = program.category?.pointMatrix;
    if (categoryMatrix) {
      let pointsConfigStr = programType === "INDIVIDUAL" ? categoryMatrix.individualPoints : categoryMatrix.groupPoints;
      try {
        if (pointsConfigStr) pointsConfig = JSON.parse(pointsConfigStr);
      } catch (e) {}
    }
  }

  // Assign ranks, handle ties
  let currentRank = 1;
  let currentMarks = results[0].marks;
  let sameRankCount = 0;

  for (let i = 0; i < results.length; i++) {
    const res = results[i];
    
    // If this result was manually updated, we might want to preserve its rank/grade
    // BUT usually points must match the rank. 
    // For now, auto-recalculate everything based on marks UNLESS we are in "Manual Entry" mode.
    
    if (res.marks < currentMarks) {
      currentRank += sameRankCount;
      currentMarks = res.marks;
      sameRankCount = 1;
    } else {
      sameRankCount++;
    }

    const rank = currentRank <= 3 ? currentRank : null;
    const grade = calculateGrade(res.marks);
    
    let points = 0;
    if (rank === 1) points += pointsConfig.rank1 || 0;
    else if (rank === 2) points += pointsConfig.rank2 || 0;
    else if (rank === 3) points += pointsConfig.rank3 || 0;

    if (grade === "A") points += pointsConfig.gradeA || 0;
    else if (grade === "B") points += pointsConfig.gradeB || 0;

    await prisma.result.update({
      where: { id: res.id },
      data: { rank, grade, points }
    });
  }
}

export async function submitMarks(data: { 
  eventId: string, 
  programId: string, 
  candidateId?: string,
  chestNumber?: string, 
  teamId?: string,
  marks: number,
  manualRank?: number | null,
  manualGrade?: string | null
}) {
  try {
    const program = await prisma.program.findUnique({
      where: { id: data.programId },
      include: { 
        category: { include: { pointMatrix: true } }, 
        event: { include: { generalPointMatrix: true } } 
      }
    });

    if (!program) return { success: false, error: "Program not found" };

    let candidateId: string | null = data.candidateId || null;
    let teamId: string | null = data.teamId || null;

    if (!candidateId && data.chestNumber) {
      const candidate = await prisma.candidate.findUnique({
        where: { chestNumber: data.chestNumber }
      });
      if (candidate) candidateId = candidate.id;
    }

    if (!candidateId && !teamId) {
      return { success: false, error: "Candidate or Team must be specified" };
    }

    // If manual mode, we calculate points immediately
    let points = 0;
    let rank = data.manualRank || null;
    let grade = data.manualGrade || null;

    if (data.manualRank || data.manualGrade) {
       let pointsConfig = { rank1: 5, rank2: 3, rank3: 1, gradeA: 5, gradeB: 3 };
       if (program.type === "GENERAL") {
         if (program.event.generalPointMatrix?.generalPoints) pointsConfig = JSON.parse(program.event.generalPointMatrix.generalPoints);
       } else if (program.category?.pointMatrix) {
         const str = program.type === "INDIVIDUAL" ? program.category.pointMatrix.individualPoints : program.category.pointMatrix.groupPoints;
         if (str) pointsConfig = JSON.parse(str);
       }

       if (rank === 1) points += pointsConfig.rank1 || 0;
       else if (rank === 2) points += pointsConfig.rank2 || 0;
       else if (rank === 3) points += pointsConfig.rank3 || 0;

       if (grade === "A") points += pointsConfig.gradeA || 0;
       else if (grade === "B") points += pointsConfig.gradeB || 0;
    }

    if (candidateId) {
      await prisma.result.upsert({
        where: { candidateId_programId: { candidateId, programId: data.programId } },
        update: { 
          marks: data.marks, 
          rank: data.manualRank !== undefined ? data.manualRank : undefined, 
          grade: data.manualGrade !== undefined ? data.manualGrade : undefined,
          points: (data.manualRank || data.manualGrade) ? points : undefined
        },
        create: {
          candidateId,
          programId: data.programId,
          marks: data.marks,
          rank: data.manualRank || null,
          grade: data.manualGrade || null,
          points: points,
          isPublished: false
        }
      });
    } else if (teamId) {
      await prisma.result.upsert({
        where: { teamId_programId: { teamId, programId: data.programId } },
        update: { 
          marks: data.marks, 
          rank: data.manualRank !== undefined ? data.manualRank : undefined, 
          grade: data.manualGrade !== undefined ? data.manualGrade : undefined,
          points: (data.manualRank || data.manualGrade) ? points : undefined
        },
        create: {
          teamId,
          programId: data.programId,
          marks: data.marks,
          rank: data.manualRank || null,
          grade: data.manualGrade || null,
          points: points,
          isPublished: false
        }
      });
    }

    revalidatePath("/dashboard/scoring");
    return { success: true };
  } catch (error) {
    console.error("Submission failed:", error);
    return { success: false, error: "Failed to submit results" };
  }
}

export async function submitBulkProgramResults(data: {
  eventId: string;
  programId: string;
  entries: Array<{
    candidateId?: string;
    chestNumber?: string;
    teamId?: string;
    rank?: number | null;
    grade?: string | null;
    marks?: number;
  }>;
}) {
  try {
    const program = await prisma.program.findUnique({
      where: { id: data.programId },
      include: {
        category: { include: { pointMatrix: true } },
        event: { include: { generalPointMatrix: true } }
      }
    });

    if (!program) return { success: false, error: "Program not found" };

    let pointsConfig = { rank1: 5, rank2: 3, rank3: 1, gradeA: 5, gradeB: 3 };
    if (program.type === "GENERAL") {
      if (program.event.generalPointMatrix?.generalPoints) {
        try { pointsConfig = JSON.parse(program.event.generalPointMatrix.generalPoints); } catch (e) {}
      }
    } else if (program.category?.pointMatrix) {
      const str = program.type === "INDIVIDUAL" ? program.category.pointMatrix.individualPoints : program.category.pointMatrix.groupPoints;
      if (str) {
        try { pointsConfig = JSON.parse(str); } catch (e) {}
      }
    }

    for (const entry of data.entries) {
      if (!entry.rank && !entry.grade && (entry.marks === undefined || entry.marks === 0)) {
        continue;
      }

      let points = 0;
      if (entry.rank === 1) points += pointsConfig.rank1 || 0;
      else if (entry.rank === 2) points += pointsConfig.rank2 || 0;
      else if (entry.rank === 3) points += pointsConfig.rank3 || 0;

      if (entry.grade === "A") points += pointsConfig.gradeA || 0;
      else if (entry.grade === "B") points += pointsConfig.gradeB || 0;

      const marks = entry.marks !== undefined ? entry.marks : points;

      if (entry.candidateId || entry.chestNumber) {
        let candidateId = entry.candidateId;
        if (!candidateId && entry.chestNumber) {
          const cand = await prisma.candidate.findUnique({ where: { chestNumber: entry.chestNumber } });
          if (cand) candidateId = cand.id;
        }

        if (candidateId) {
          await prisma.result.upsert({
            where: { candidateId_programId: { candidateId, programId: data.programId } },
            update: {
              marks,
              rank: entry.rank || null,
              grade: entry.grade || null,
              points
            },
            create: {
              candidateId,
              programId: data.programId,
              marks,
              rank: entry.rank || null,
              grade: entry.grade || null,
              points,
              isPublished: false
            }
          });
        }
      } else if (entry.teamId) {
        await prisma.result.upsert({
          where: { teamId_programId: { teamId: entry.teamId, programId: data.programId } },
          update: {
            marks,
            rank: entry.rank || null,
            grade: entry.grade || null,
            points
          },
          create: {
            teamId: entry.teamId,
            programId: data.programId,
            marks,
            rank: entry.rank || null,
            grade: entry.grade || null,
            points,
            isPublished: false
          }
        });
      }
    }

    revalidatePath("/dashboard/scoring");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Bulk submission failed:", error);
    return { success: false, error: "Failed to submit program results" };
  }
}

export async function togglePublishResult(id: string, isPublished: boolean) {
  try {
    await prisma.result.update({ where: { id }, data: { isPublished } });
    revalidatePath("/dashboard/scoring");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update publication status" };
  }
}

export async function publishProgramResults(programId: string) {
  try {
    await prisma.result.updateMany({
      where: { programId },
      data: { isPublished: true }
    });
    revalidatePath("/dashboard/scoring");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to publish program results" };
  }
}

export async function deleteResult(id: string) {
  try {
    const result = await prisma.result.findUnique({ where: { id }, include: { program: true } });
    if (!result) return { success: false, error: "Result not found" };
    await prisma.result.delete({ where: { id } });
    await recalculateProgramResults(result.programId);
    revalidatePath("/dashboard/scoring");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete result" };
  }
}

export async function updateResultMark(id: string, marks: number) {
  try {
    const result = await prisma.result.update({ where: { id }, data: { marks } });
    await recalculateProgramResults(result.programId);
    revalidatePath("/dashboard/scoring");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update result" };
  }
}
