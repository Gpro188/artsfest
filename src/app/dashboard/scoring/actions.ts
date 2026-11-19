"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import { getFestivalEventIds } from "@/lib/eventScope";

// Invalidate public caches
function invalidatePublicResults() {
  try {
    (revalidateTag as any)("public-event-data");
  } catch (e) {}
  try {
    if (typeof updateTag === "function") updateTag("public-event-data");
  } catch (e) {}
}

// Helper to determine Grade based on marks
function calculateGrade(marks: number) {
  if (marks >= 80) return "A";
  if (marks >= 60) return "B";
  if (marks >= 40) return "C";
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
  
  let pointsConfig = { rank1: 5, rank2: 3, rank3: 1, gradeA: 5, gradeB: 3, gradeC: 1 };

  if (programType === "GENERAL") {
    let generalPointsStr = program.event?.generalPointMatrix?.generalPoints;
    if (!generalPointsStr) {
      const festIds = await getFestivalEventIds(program.eventId);
      const pm = await prisma.pointMatrix.findFirst({
        where: { eventId: { in: festIds }, generalPoints: { not: null } }
      });
      generalPointsStr = pm?.generalPoints;
    }
    if (generalPointsStr) {
      try {
        pointsConfig = JSON.parse(generalPointsStr);
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
    else if (grade === "C") points += (pointsConfig as any).gradeC || 0;

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
  manualGrade?: string | null,
  status?: string,
  penaltyMarks?: number,
  penaltyReason?: string,
  penaltyTarget?: string,
  penaltyDescription?: string
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
      const festEventIds = await getFestivalEventIds(program.eventId);
      const candidate = await prisma.candidate.findFirst({
        where: {
          chestNumber: data.chestNumber,
          ...(festEventIds.length > 0 ? { team: { eventId: { in: festEventIds } } } : {})
        }
      });
      if (candidate) candidateId = candidate.id;
    }

    if (!candidateId && !teamId) {
      return { success: false, error: "Candidate or Team must be specified" };
    }

    // Resolve targetTeamId for team penalties
    let targetTeamId = teamId;
    if (!targetTeamId && candidateId) {
      const cand = await prisma.candidate.findUnique({
        where: { id: candidateId },
        select: { teamId: true }
      });
      targetTeamId = cand?.teamId || null;
    }

    const isAbsentOrDisqualified = data.status === "ABSENT" || data.status === "DISQUALIFIED";
    const status = data.status || (data.penaltyMarks && data.penaltyMarks > 0 ? "PENALIZED" : "COMPLETED");
    const penaltyMarks = data.penaltyMarks || 0;
    const penaltyReason = data.penaltyReason || null;
    const penaltyTarget = data.penaltyTarget || "INDIVIDUAL";
    const penaltyDescription = data.penaltyDescription || null;

    // Calculate net individual score
    let finalMarks = data.marks || 0;
    if (isAbsentOrDisqualified) {
      finalMarks = 0;
    } else if ((penaltyTarget === "INDIVIDUAL" || penaltyTarget === "BOTH") && penaltyMarks > 0) {
      finalMarks = Math.max(0, finalMarks - penaltyMarks);
    }

    // Calculate points based on rank / grade
    let points = 0;
    let rank = isAbsentOrDisqualified ? null : (data.manualRank || null);
    let grade = isAbsentOrDisqualified ? null : (data.manualGrade || null);

    if (!isAbsentOrDisqualified && (data.manualRank || data.manualGrade)) {
       let pointsConfig = { rank1: 5, rank2: 3, rank3: 1, gradeA: 5, gradeB: 3, gradeC: 1 };
       if (program.type === "GENERAL") {
         let generalPointsStr = program.event?.generalPointMatrix?.generalPoints;
         if (!generalPointsStr) {
           const festIds = await getFestivalEventIds(program.eventId);
           const pm = await prisma.pointMatrix.findFirst({
             where: { eventId: { in: festIds }, generalPoints: { not: null } }
           });
           generalPointsStr = pm?.generalPoints;
         }
         if (generalPointsStr) {
           try { pointsConfig = JSON.parse(generalPointsStr); } catch (e) {}
         }
       } else if (program.category?.pointMatrix) {
         const str = program.type === "INDIVIDUAL" ? program.category.pointMatrix.individualPoints : program.category.pointMatrix.groupPoints;
         if (str) pointsConfig = JSON.parse(str);
       }

       if (rank === 1) points += pointsConfig.rank1 || 0;
       else if (rank === 2) points += pointsConfig.rank2 || 0;
       else if (rank === 3) points += pointsConfig.rank3 || 0;

       if (grade === "A") points += pointsConfig.gradeA || 0;
       else if (grade === "B") points += pointsConfig.gradeB || 0;
       else if (grade === "C") points += (pointsConfig as any).gradeC || 0;
    }

    // Handle Team Grand Total Penalty sync
    if (targetTeamId) {
      await prisma.teamPenalty.deleteMany({
        where: {
          programId: data.programId,
          teamId: targetTeamId,
          ...(candidateId ? { candidateId } : {})
        }
      });

      if ((penaltyTarget === "TEAM_TOTAL" || penaltyTarget === "BOTH") && penaltyMarks > 0) {
        await prisma.teamPenalty.create({
          data: {
            eventId: program.eventId,
            teamId: targetTeamId,
            programId: data.programId,
            candidateId: candidateId || undefined,
            reason: penaltyReason || "OTHERS",
            pointsDeducted: penaltyMarks,
            description: penaltyDescription || undefined,
            issuedBy: "Admin"
          }
        });
      }
    }

    if (candidateId) {
      await prisma.result.upsert({
        where: { candidateId_programId: { candidateId, programId: data.programId } },
        update: { 
          marks: finalMarks, 
          rank: isAbsentOrDisqualified ? null : (data.manualRank !== undefined ? data.manualRank : undefined), 
          grade: isAbsentOrDisqualified ? null : (data.manualGrade !== undefined ? data.manualGrade : undefined),
          points: isAbsentOrDisqualified ? 0 : ((data.manualRank || data.manualGrade) ? points : undefined),
          status,
          penaltyMarks,
          penaltyReason,
          penaltyTarget,
          penaltyDescription
        },
        create: {
          candidateId,
          programId: data.programId,
          marks: finalMarks,
          rank: rank,
          grade: grade,
          points: points,
          status,
          penaltyMarks,
          penaltyReason,
          penaltyTarget,
          penaltyDescription,
          isPublished: false
        }
      });
    } else if (teamId) {
      await prisma.result.upsert({
        where: { teamId_programId: { teamId, programId: data.programId } },
        update: { 
          marks: finalMarks, 
          rank: isAbsentOrDisqualified ? null : (data.manualRank !== undefined ? data.manualRank : undefined), 
          grade: isAbsentOrDisqualified ? null : (data.manualGrade !== undefined ? data.manualGrade : undefined),
          points: isAbsentOrDisqualified ? 0 : ((data.manualRank || data.manualGrade) ? points : undefined),
          status,
          penaltyMarks,
          penaltyReason,
          penaltyTarget,
          penaltyDescription
        },
        create: {
          teamId,
          programId: data.programId,
          marks: finalMarks,
          rank: rank,
          grade: grade,
          points: points,
          status,
          penaltyMarks,
          penaltyReason,
          penaltyTarget,
          penaltyDescription,
          isPublished: false
        }
      });
    }

    revalidatePath("/dashboard/scoring");
    revalidatePath("/dashboard");
    revalidatePath("/");
    revalidatePath("/fest", "layout");
    revalidatePath("/domain", "layout");
    invalidatePublicResults();
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
    status?: string;
    penaltyMarks?: number;
    penaltyReason?: string;
    penaltyTarget?: string;
    penaltyDescription?: string;
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

    let pointsConfig = { rank1: 5, rank2: 3, rank3: 1, gradeA: 5, gradeB: 3, gradeC: 1 };
    if (program.type === "GENERAL") {
      let generalPointsStr = program.event?.generalPointMatrix?.generalPoints;
      if (!generalPointsStr) {
        const festIds = await getFestivalEventIds(program.eventId);
        const pm = await prisma.pointMatrix.findFirst({
          where: { eventId: { in: festIds }, generalPoints: { not: null } }
        });
        generalPointsStr = pm?.generalPoints;
      }
      if (generalPointsStr) {
        try { pointsConfig = JSON.parse(generalPointsStr); } catch (e) {}
      }
    } else if (program.category?.pointMatrix) {
      const str = program.type === "INDIVIDUAL" ? program.category.pointMatrix.individualPoints : program.category.pointMatrix.groupPoints;
      if (str) {
        try { pointsConfig = JSON.parse(str); } catch (e) {}
      }
    }

    for (const entry of data.entries) {
      const hasPenalty = !!(entry.penaltyMarks && entry.penaltyMarks > 0) || entry.status === "ABSENT" || entry.status === "DISQUALIFIED" || !!entry.penaltyReason;
      if (!entry.rank && !entry.grade && (entry.marks === undefined || entry.marks === 0) && !hasPenalty) {
        continue;
      }

      const isAbsentOrDisqualified = entry.status === "ABSENT" || entry.status === "DISQUALIFIED";
      const status = entry.status || (entry.penaltyMarks && entry.penaltyMarks > 0 ? "PENALIZED" : "COMPLETED");
      const penaltyMarks = entry.penaltyMarks || 0;
      const penaltyReason = entry.penaltyReason || null;
      const penaltyTarget = entry.penaltyTarget || "INDIVIDUAL";
      const penaltyDescription = entry.penaltyDescription || null;

      let points = 0;
      const rank = isAbsentOrDisqualified ? null : (entry.rank || null);
      const grade = isAbsentOrDisqualified ? null : (entry.grade || null);

      if (!isAbsentOrDisqualified) {
        if (rank === 1) points += pointsConfig.rank1 || 0;
        else if (rank === 2) points += pointsConfig.rank2 || 0;
        else if (rank === 3) points += pointsConfig.rank3 || 0;

        if (grade === "A") points += pointsConfig.gradeA || 0;
        else if (grade === "B") points += pointsConfig.gradeB || 0;
        else if (grade === "C") points += (pointsConfig as any).gradeC || 0;
      }

      let rawMarks = entry.marks !== undefined ? entry.marks : points;
      let finalMarks = rawMarks;
      if (isAbsentOrDisqualified) {
        finalMarks = 0;
      } else if ((penaltyTarget === "INDIVIDUAL" || penaltyTarget === "BOTH") && penaltyMarks > 0) {
        finalMarks = Math.max(0, rawMarks - penaltyMarks);
      }

      let candidateId = entry.candidateId;
      if (!candidateId && entry.chestNumber) {
        const festEventIds = await getFestivalEventIds(program.eventId);
        const cand = await prisma.candidate.findFirst({
          where: {
            chestNumber: entry.chestNumber,
            ...(festEventIds.length > 0 ? { team: { eventId: { in: festEventIds } } } : {})
          }
        });
        if (cand) candidateId = cand.id;
      }

      // Resolve teamId for team penalties
      let targetTeamId = entry.teamId || null;
      if (!targetTeamId && candidateId) {
        const cand = await prisma.candidate.findUnique({
          where: { id: candidateId },
          select: { teamId: true }
        });
        targetTeamId = cand?.teamId || null;
      }

      // Handle Team Grand Total Penalty sync
      if (targetTeamId) {
        await prisma.teamPenalty.deleteMany({
          where: {
            programId: data.programId,
            teamId: targetTeamId,
            ...(candidateId ? { candidateId } : {})
          }
        });

        if ((penaltyTarget === "TEAM_TOTAL" || penaltyTarget === "BOTH") && penaltyMarks > 0) {
          await prisma.teamPenalty.create({
            data: {
              eventId: program.eventId,
              teamId: targetTeamId,
              programId: data.programId,
              candidateId: candidateId || undefined,
              reason: penaltyReason || "OTHERS",
              pointsDeducted: penaltyMarks,
              description: penaltyDescription || undefined,
              issuedBy: "Admin"
            }
          });
        }
      }

      if (candidateId) {
        await prisma.result.upsert({
          where: { candidateId_programId: { candidateId, programId: data.programId } },
          update: {
            marks: finalMarks,
            rank,
            grade,
            points,
            status,
            penaltyMarks,
            penaltyReason,
            penaltyTarget,
            penaltyDescription
          },
          create: {
            candidateId,
            programId: data.programId,
            marks: finalMarks,
            rank,
            grade,
            points,
            status,
            penaltyMarks,
            penaltyReason,
            penaltyTarget,
            penaltyDescription,
            isPublished: false
          }
        });
      } else if (entry.teamId) {
        await prisma.result.upsert({
          where: { teamId_programId: { teamId: entry.teamId, programId: data.programId } },
          update: {
            marks: finalMarks,
            rank,
            grade,
            points,
            status,
            penaltyMarks,
            penaltyReason,
            penaltyTarget,
            penaltyDescription
          },
          create: {
            teamId: entry.teamId,
            programId: data.programId,
            marks: finalMarks,
            rank,
            grade,
            points,
            status,
            penaltyMarks,
            penaltyReason,
            penaltyTarget,
            penaltyDescription,
            isPublished: false
          }
        });
      }
    }

    revalidatePath("/dashboard/scoring");
    revalidatePath("/dashboard");
    revalidatePath("/");
    revalidatePath("/fest", "layout");
    revalidatePath("/domain", "layout");
    invalidatePublicResults();
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
    revalidatePath("/dashboard");
    revalidatePath("/");
    revalidatePath("/fest", "layout");
    revalidatePath("/domain", "layout");
    invalidatePublicResults();
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
    revalidatePath("/dashboard");
    revalidatePath("/");
    revalidatePath("/fest", "layout");
    revalidatePath("/domain", "layout");
    invalidatePublicResults();
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to publish program results" };
  }
}

export async function unpublishProgramResults(programId: string) {
  try {
    await prisma.result.updateMany({
      where: { programId },
      data: { isPublished: false }
    });
    revalidatePath("/dashboard/scoring");
    revalidatePath("/dashboard");
    revalidatePath("/");
    revalidatePath("/fest", "layout");
    revalidatePath("/domain", "layout");
    invalidatePublicResults();
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to unpublish program results" };
  }
}

export async function deleteResult(id: string) {
  try {
    const result = await prisma.result.findUnique({ where: { id }, include: { program: true } });
    if (!result) return { success: false, error: "Result not found" };

    // Clean up any team penalties linked with this result
    if (result.teamId || result.candidateId) {
      await prisma.teamPenalty.deleteMany({
        where: {
          programId: result.programId,
          ...(result.candidateId ? { candidateId: result.candidateId } : { teamId: result.teamId || "" })
        }
      });
    }

    await prisma.result.delete({ where: { id } });
    await recalculateProgramResults(result.programId);
    revalidatePath("/dashboard/scoring");
    revalidatePath("/dashboard");
    revalidatePath("/");
    revalidatePath("/fest", "layout");
    revalidatePath("/domain", "layout");
    invalidatePublicResults();
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
    revalidatePath("/dashboard");
    revalidatePath("/");
    revalidatePath("/fest", "layout");
    revalidatePath("/domain", "layout");
    invalidatePublicResults();
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update result" };
  }
}

export async function updateResultDetails(data: {
  id: string;
  marks: number;
  rank?: number | null;
  grade?: string | null;
  isPublished?: boolean;
  status?: string;
  penaltyMarks?: number;
  penaltyReason?: string | null;
  penaltyTarget?: string;
  penaltyDescription?: string | null;
}) {
  try {
    const existing = await prisma.result.findUnique({
      where: { id: data.id },
      include: {
        candidate: true,
        program: {
          include: {
            category: { include: { pointMatrix: true } },
            event: { include: { generalPointMatrix: true } }
          }
        }
      }
    });

    if (!existing) return { success: false, error: "Result not found" };

    const program = existing.program;
    let pointsConfig = { rank1: 5, rank2: 3, rank3: 1, gradeA: 5, gradeB: 3, gradeC: 1 };

    if (program.type === "GENERAL") {
      if (program.event?.generalPointMatrix?.generalPoints) {
        try { pointsConfig = JSON.parse(program.event.generalPointMatrix.generalPoints); } catch (e) {}
      }
    } else if (program.category?.pointMatrix) {
      const str = program.type === "INDIVIDUAL" 
        ? program.category.pointMatrix.individualPoints 
        : program.category.pointMatrix.groupPoints;
      if (str) {
        try { pointsConfig = JSON.parse(str); } catch (e) {}
      }
    }

    const isAbsentOrDisqualified = data.status === "ABSENT" || data.status === "DISQUALIFIED";
    const status = data.status !== undefined ? data.status : existing.status;
    const penaltyMarks = data.penaltyMarks !== undefined ? data.penaltyMarks : existing.penaltyMarks;
    const penaltyReason = data.penaltyReason !== undefined 
      ? (data.penaltyReason ? data.penaltyReason : null) 
      : existing.penaltyReason;
    const penaltyTarget = data.penaltyTarget !== undefined ? data.penaltyTarget : existing.penaltyTarget;
    const penaltyDescription = data.penaltyDescription !== undefined 
      ? (data.penaltyDescription ? data.penaltyDescription : null) 
      : existing.penaltyDescription;

    const rank = isAbsentOrDisqualified ? null : (data.rank !== undefined ? data.rank : existing.rank);
    const grade = isAbsentOrDisqualified ? null : (data.grade !== undefined ? data.grade : existing.grade);

    let points = 0;
    if (!isAbsentOrDisqualified) {
      if (rank === 1) points += pointsConfig.rank1 || 0;
      else if (rank === 2) points += pointsConfig.rank2 || 0;
      else if (rank === 3) points += pointsConfig.rank3 || 0;

      if (grade === "A") points += pointsConfig.gradeA || 0;
      else if (grade === "B") points += pointsConfig.gradeB || 0;
      else if (grade === "C") points += (pointsConfig as any).gradeC || 0;
    }

    let finalMarks = data.marks;
    if (isAbsentOrDisqualified) {
      finalMarks = 0;
    } else if ((penaltyTarget === "INDIVIDUAL" || penaltyTarget === "BOTH") && penaltyMarks > 0) {
      finalMarks = Math.max(0, finalMarks - penaltyMarks);
    }

    // Sync TeamPenalty
    const targetTeamId = existing.teamId || existing.candidate?.teamId || null;
    if (targetTeamId) {
      await prisma.teamPenalty.deleteMany({
        where: {
          programId: existing.programId,
          teamId: targetTeamId,
          ...(existing.candidateId ? { candidateId: existing.candidateId } : {})
        }
      });

      if ((penaltyTarget === "TEAM_TOTAL" || penaltyTarget === "BOTH") && penaltyMarks > 0) {
        await prisma.teamPenalty.create({
          data: {
            eventId: program.eventId,
            teamId: targetTeamId,
            programId: existing.programId,
            candidateId: existing.candidateId || undefined,
            reason: penaltyReason || "OTHERS",
            pointsDeducted: penaltyMarks,
            description: penaltyDescription || undefined,
            issuedBy: "Admin"
          }
        });
      }
    }

    await prisma.result.update({
      where: { id: data.id },
      data: {
        marks: finalMarks,
        rank: rank || null,
        grade: grade || null,
        points,
        status,
        penaltyMarks,
        penaltyReason,
        penaltyTarget,
        penaltyDescription,
        ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {})
      }
    });

    revalidatePath("/dashboard/scoring");
    revalidatePath("/dashboard");
    revalidatePath("/");
    revalidatePath("/fest", "layout");
    revalidatePath("/domain", "layout");
    invalidatePublicResults();
    return { success: true };
  } catch (error) {
    console.error("Failed to update result details:", error);
    return { success: false, error: "Failed to update result details" };
  }
}
