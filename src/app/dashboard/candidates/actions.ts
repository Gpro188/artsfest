"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function addCandidate(data: { name: string, categoryId: string, teamId: string, photo?: string }) {
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
      if (team.event.registrationStart && now < team.event.registrationStart) {
        return { success: false, error: `Registration opens on ${team.event.registrationStart.toLocaleString()}` };
      }
      if (team.event.registrationEnd && now > team.event.registrationEnd) {
        return { success: false, error: "Registration deadline has passed. Please contact Admin." };
      }
    }

    let chestNumber: string | null = null;
    let isApproved = false;

    let finalCategoryId = data.categoryId;

    if (session.user.role === "ADMIN") {
      isApproved = true;
      const team = await prisma.team.findUnique({ where: { id: data.teamId } });
      const cat = await prisma.category.findUnique({ where: { id: data.categoryId } });

      // If category eventId does not match team eventId, match the category with the same name under the team's event
      if (team && cat && cat.eventId !== team.eventId) {
        const matchingCatInTeamEvent = await prisma.category.findFirst({
          where: {
            eventId: team.eventId,
            name: { equals: cat.name, mode: "insensitive" }
          }
        });
        if (matchingCatInTeamEvent) {
          finalCategoryId = matchingCatInTeamEvent.id;
        }
      }

      const prefixCode = team?.prefixCode || "C";
      const offset = cat?.chestNumberOffset || 0;

      const existingCandidates = await prisma.candidate.findMany({
        where: { teamId: data.teamId, categoryId: finalCategoryId, isApproved: true, chestNumber: { not: null } },
        select: { chestNumber: true }
      });

      let nextSeq = 1;
      if (existingCandidates.length > 0) {
        const seqs = existingCandidates
          .map(c => c.chestNumber!)
          .map(cn => {
             const isNum = !isNaN(parseInt(prefixCode)) && /^\d+$/.test(prefixCode);
             if (isNum) return parseInt(cn, 10) - parseInt(prefixCode, 10) - offset;
             const numPart = parseInt(cn.replace(prefixCode, ''), 10);
             return numPart - offset + 1;
          })
          .filter(n => !isNaN(n));
        if (seqs.length > 0) nextSeq = Math.max(...seqs) + 1;
      }

      const isNumericPrefix = !isNaN(parseInt(prefixCode)) && /^\d+$/.test(prefixCode);
      if (isNumericPrefix) {
        chestNumber = (parseInt(prefixCode, 10) + offset + nextSeq).toString();
      } else {
        const finalNum = offset + nextSeq;
        const formattedNum = finalNum.toString().padStart(2, '0');
        chestNumber = `${prefixCode}${formattedNum}`;
      }
    }

    await prisma.candidate.create({
      data: {
        name: data.name,
        categoryId: finalCategoryId,
        teamId: data.teamId,
        photo: data.photo,
        chestNumber,
        isApproved,
      }
    });

    revalidatePath("/dashboard/candidates");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to add candidate:", error);
    
    if (error.code === 'P2002') {
      return { success: false, error: "A unique constraint failed. This candidate or chest number might already exist." };
    }
    if (error.code === 'P2003') {
      return { success: false, error: "Foreign key constraint failed. Please check if the category or team exists." };
    }
    
    return { success: false, error: error.message || "Failed to add candidate. Please check all fields." };
  }
}

export async function updateCandidate(id: string, data: { name: string, categoryId: string, photo?: string, chestNumber?: string | null, isApproved?: boolean }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Unauthorized" };

    const candidate = await prisma.candidate.findUnique({ where: { id } });
    if (!candidate) return { success: false, error: "Candidate not found" };

    if (session.user.role === "MANAGER") {
      const team = await prisma.team.findUnique({
        where: { managerId: session.user.id },
        include: { event: true }
      });
      if (team && team.event.registrationEnd && new Date() > team.event.registrationEnd) {
        return { success: false, error: "Registration deadline has passed. Cannot edit candidate." };
      }
      
      if (candidate.isApproved && data.isApproved !== false) {
        return { success: false, error: "Cannot edit an approved candidate" };
      }
    }

    await prisma.candidate.update({
      where: { id },
      data: {
        name: data.name,
        categoryId: data.categoryId,
        photo: data.photo,
        chestNumber: data.chestNumber,
        isApproved: data.isApproved ?? candidate.isApproved,
      }
    });

    revalidatePath("/dashboard/candidates");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update candidate:", error);
    if (error.code === 'P2002') {
      return { success: false, error: "A unique constraint failed. Chest number might be already taken." };
    }
    return { success: false, error: error.message || "Failed to update candidate" };
  }
}

export async function deleteCandidate(id: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Unauthorized" };

    const candidate = await prisma.candidate.findUnique({ where: { id } });
    if (!candidate) return { success: false, error: "Candidate not found" };

    if (session.user.role === "MANAGER") {
      const team = await prisma.team.findUnique({
        where: { managerId: session.user.id },
        include: { event: true }
      });
      if (team && team.event.registrationEnd && new Date() > team.event.registrationEnd) {
        return { success: false, error: "Registration deadline has passed. Cannot delete candidate." };
      }

      if (candidate.isApproved) {
        return { success: false, error: "Cannot delete an approved candidate" };
      }
    }

    await prisma.candidate.delete({ where: { id } });

    revalidatePath("/dashboard/candidates");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete candidate:", error);
    return { success: false, error: "Failed to delete candidate" };
  }
}

export async function approveCandidate(id: string, prefixCode?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") return { success: false, error: "Unauthorized" };

    const candidate = await prisma.candidate.findUnique({ 
      where: { id },
      include: { team: true } 
    });
    if (!candidate) return { success: false, error: "Candidate not found" };
    if (candidate.isApproved && candidate.chestNumber) {
      return { success: false, error: "Candidate is already approved with Chest No: " + candidate.chestNumber };
    }

    const effectivePrefix = (prefixCode || candidate.team?.prefixCode || candidate.team?.name?.slice(0, 3)?.toUpperCase() || "C").trim();

    await prisma.$transaction(async (tx) => {
      const cat = await tx.category.findUnique({ where: { id: candidate.categoryId } });
      const offset = cat?.chestNumberOffset || 0;

      const existingCandidates = await tx.candidate.findMany({
        where: { teamId: candidate.teamId, categoryId: candidate.categoryId, isApproved: true, chestNumber: { not: null } },
        select: { chestNumber: true }
      });

      let nextSequence = 1;
      
      if (existingCandidates.length > 0) {
        const sequences = existingCandidates
          .map(c => c.chestNumber!)
          .map(cn => {
             const isNum = !isNaN(parseInt(effectivePrefix)) && /^\d+$/.test(effectivePrefix);
             if (isNum) {
               return parseInt(cn, 10) - parseInt(effectivePrefix, 10) - offset;
             }
             const numPart = parseInt(cn.replace(effectivePrefix, ''), 10);
             return numPart - offset + 1;
          })
          .filter(n => !isNaN(n));
          
        if (sequences.length > 0) {
          nextSequence = Math.max(...sequences) + 1;
        }
      }

      const isNumericPrefix = !isNaN(parseInt(effectivePrefix)) && /^\d+$/.test(effectivePrefix);
      let newChestNumber = "";

      if (isNumericPrefix) {
        newChestNumber = (parseInt(effectivePrefix, 10) + offset + nextSequence).toString();
      } else {
        const finalNum = offset + nextSequence;
        const formattedNum = finalNum.toString().padStart(2, '0');
        newChestNumber = `${effectivePrefix}${formattedNum}`;
      }

      await tx.candidate.update({
        where: { id },
        data: {
          isApproved: true,
          chestNumber: newChestNumber
        }
      });
    });

    revalidatePath("/dashboard/candidates");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to approve candidate:", error);
    if (error.code === 'P2002') {
      return { success: false, error: "Approval failed: Chest number collision. Please check prefix codes and category offsets." };
    }
    return { success: false, error: error.message || "Failed to approve candidate" };
  }
}

export async function bulkApproveUnapprovedCandidates() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") return { success: false, error: "Unauthorized" };

    const unapprovedCandidates = await prisma.candidate.findMany({
      where: { isApproved: false },
      include: { team: true, category: true }
    });

    if (unapprovedCandidates.length === 0) {
      return { success: true, count: 0, message: "No pending candidates found." };
    }

    let approvedCount = 0;

    for (const candidate of unapprovedCandidates) {
      const prefixCode = (candidate.team?.prefixCode || candidate.team?.name?.slice(0, 3)?.toUpperCase() || "C").trim();
      const offset = candidate.category?.chestNumberOffset || 0;

      const existingCandidates = await prisma.candidate.findMany({
        where: { teamId: candidate.teamId, categoryId: candidate.categoryId, isApproved: true, chestNumber: { not: null } },
        select: { chestNumber: true }
      });

      let nextSequence = 1;
      if (existingCandidates.length > 0) {
        const sequences = existingCandidates
          .map(c => c.chestNumber!)
          .map(cn => {
             const isNum = !isNaN(parseInt(prefixCode)) && /^\d+$/.test(prefixCode);
             if (isNum) return parseInt(cn, 10) - parseInt(prefixCode, 10) - offset;
             const numPart = parseInt(cn.replace(prefixCode, ''), 10);
             return numPart - offset + 1;
          })
          .filter(n => !isNaN(n));
        if (sequences.length > 0) nextSequence = Math.max(...sequences) + 1;
      }

      const isNumericPrefix = !isNaN(parseInt(prefixCode)) && /^\d+$/.test(prefixCode);
      let newChestNumber = "";

      if (isNumericPrefix) {
        newChestNumber = (parseInt(prefixCode, 10) + offset + nextSequence).toString();
      } else {
        const finalNum = offset + nextSequence;
        const formattedNum = finalNum.toString().padStart(2, '0');
        newChestNumber = `${prefixCode}${formattedNum}`;
      }

      await prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          isApproved: true,
          chestNumber: newChestNumber
        }
      });
      approvedCount++;
    }

    revalidatePath("/dashboard/candidates");
    return { success: true, count: approvedCount };
  } catch (error: any) {
    console.error("Failed to bulk approve candidates:", error);
    return { success: false, error: error.message || "Failed to bulk approve candidates" };
  }
}

export async function bulkImportCandidates(candidatesList: Array<{ name: string, teamId: string, categoryId: string, chestNumber?: string }>) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Unauthorized" };

    let count = 0;
    for (const c of candidatesList) {
      if (!c.name || !c.teamId || !c.categoryId) continue;

      let chestNumber = c.chestNumber || null;

      // If chest number not provided in Excel, auto-generate next sequence
      if (!chestNumber) {
        const team = await prisma.team.findUnique({ where: { id: c.teamId } });
        const cat = await prisma.category.findUnique({ where: { id: c.categoryId } });
        const prefixCode = team?.prefixCode || "C";
        const offset = cat?.chestNumberOffset || 0;

        const existingCandidates = await prisma.candidate.findMany({
          where: { teamId: c.teamId, categoryId: c.categoryId, isApproved: true, chestNumber: { not: null } },
          select: { chestNumber: true }
        });

        let nextSeq = 1;
        if (existingCandidates.length > 0) {
          const seqs = existingCandidates
            .map(item => item.chestNumber!)
            .map(cn => {
               const isNum = !isNaN(parseInt(prefixCode)) && /^\d+$/.test(prefixCode);
               if (isNum) return parseInt(cn, 10) - parseInt(prefixCode, 10) - offset;
               const numPart = parseInt(cn.replace(prefixCode, ''), 10);
               return numPart - offset + 1;
            })
            .filter(n => !isNaN(n));
          if (seqs.length > 0) nextSeq = Math.max(...seqs) + 1;
        }

        const isNumericPrefix = !isNaN(parseInt(prefixCode)) && /^\d+$/.test(prefixCode);
        if (isNumericPrefix) {
          chestNumber = (parseInt(prefixCode, 10) + offset + nextSeq).toString();
        } else {
          const finalNum = offset + nextSeq;
          const formattedNum = finalNum.toString().padStart(2, '0');
          chestNumber = `${prefixCode}${formattedNum}`;
        }
      }

      await prisma.candidate.create({
        data: {
          name: c.name,
          teamId: c.teamId,
          categoryId: c.categoryId,
          chestNumber: chestNumber,
          isApproved: true,
        }
      });
      count++;
    }

    revalidatePath("/dashboard/candidates");
    return { success: true, count };
  } catch (error: any) {
    console.error("Failed to bulk import candidates:", error);
    if (error.code === 'P2002') {
      return { success: false, error: "Duplicate chest number or candidate constraint failed during import." };
    }
    return { success: false, error: error.message || "Failed to import candidates" };
  }
}
