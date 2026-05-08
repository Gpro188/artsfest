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
      const settings = await prisma.globalSetting.findUnique({ where: { id: "default" } });
      if (settings?.candidateRegistrationDeadline && new Date() > new Date(settings.candidateRegistrationDeadline)) {
        return { success: false, error: "Registration deadline has passed. Please contact Admin." };
      }
    }

    await prisma.candidate.create({
      data: {
        name: data.name,
        categoryId: data.categoryId,
        teamId: data.teamId,
        photo: data.photo,
      }
    });

    revalidatePath("/dashboard/candidates");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to add candidate:", error);
    
    // Better error messages for Prisma errors
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
      const settings = await prisma.globalSetting.findUnique({ where: { id: "default" } });
      if (settings?.candidateRegistrationDeadline && new Date() > new Date(settings.candidateRegistrationDeadline)) {
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

    // Prevent manager from deleting approved candidate
    if (session.user.role === "MANAGER") {
      const settings = await prisma.globalSetting.findUnique({ where: { id: "default" } });
      if (settings?.candidateRegistrationDeadline && new Date() > new Date(settings.candidateRegistrationDeadline)) {
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

export async function approveCandidate(id: string, prefixCode: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") return { success: false, error: "Unauthorized" };

    // Find the candidate
    const candidate = await prisma.candidate.findUnique({ where: { id } });
    if (!candidate || candidate.isApproved) return { success: false, error: "Candidate already approved or not found" };

    // Transaction for assigning Chest Number
    await prisma.$transaction(async (tx) => {
      // Fetch category to get offset
      const cat = await tx.category.findUnique({ where: { id: candidate.categoryId } });
      const offset = cat?.chestNumberOffset || 0;

      // Find the highest existing chest number for this prefix and category
      const existingCandidates = await tx.candidate.findMany({
        where: { teamId: candidate.teamId, categoryId: candidate.categoryId, isApproved: true, chestNumber: { not: null } },
        select: { chestNumber: true }
      });

      let nextSequence = 1;
      
      if (existingCandidates.length > 0) {
        const sequences = existingCandidates
          .map(c => c.chestNumber!)
          .map(cn => {
             // For numeric, we need to subtract both prefix and offset
             const isNum = !isNaN(parseInt(prefixCode)) && /^\d+$/.test(prefixCode);
             if (isNum) {
               return parseInt(cn, 10) - parseInt(prefixCode, 10) - offset;
             }
             const numPart = parseInt(cn.replace(prefixCode, ''), 10);
             return numPart - offset + 1; // Get the relative sequence
          })
          .filter(n => !isNaN(n));
          
        if (sequences.length > 0) {
          nextSequence = Math.max(...sequences) + 1;
        }
      }

      // Logic: Incorporate offset to avoid collisions between categories
      const isNumericPrefix = !isNaN(parseInt(prefixCode)) && /^\d+$/.test(prefixCode);
      let newChestNumber = "";

      if (isNumericPrefix) {
        newChestNumber = (parseInt(prefixCode, 10) + offset + nextSequence).toString();
      } else {
        // For alphanumeric, we use prefix + (offset + sequence)
        // We subtract 1 if offset starts from 1, or just add if it's a base.
        // Usually if offset is 1, they want it to start at 1.
        const sequenceWithOffset = offset + nextSequence - (offset > 0 ? 0 : 0); 
        // Wait, if offset is 1, nextSequence is 1, we want 1. So 1 + 1 - 1 = 1.
        // Actually, offset is usually the START of the range.
        // If offset is 1, first is 1. If offset is 31, first is 31.
        const finalNum = offset + nextSequence - 1;
        const formattedNum = finalNum.toString().padStart(2, '0');
        newChestNumber = `${prefixCode}${formattedNum}`;
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
