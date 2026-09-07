"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function addCandidate(data: { name: string, categoryId: string, teamId: string, photo?: string, chestNumber?: string }) {
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

    let chestNumber: string | null = data.chestNumber || null;
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

      if (data.chestNumber) {
        chestNumber = data.chestNumber;
      } else {
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
      let newChestNumber = candidate.chestNumber;
      
      if (!newChestNumber) {
        if (isNumericPrefix) {
          newChestNumber = (parseInt(effectivePrefix, 10) + offset + nextSequence).toString();
        } else {
          const finalNum = offset + nextSequence;
          const formattedNum = finalNum.toString().padStart(2, '0');
          newChestNumber = `${effectivePrefix}${formattedNum}`;
        }
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
      let newChestNumber = candidate.chestNumber;
      
      if (!newChestNumber) {
        if (isNumericPrefix) {
          newChestNumber = (parseInt(prefixCode, 10) + offset + nextSequence).toString();
        } else {
          const finalNum = offset + nextSequence;
          const formattedNum = finalNum.toString().padStart(2, '0');
          newChestNumber = `${prefixCode}${formattedNum}`;
        }
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

export type CandidateImportRow = {
  rowNumber: number;
  name: string;
  rawTeam?: string;
  rawCategory?: string;
  chestNumber?: string;
  defaultTeamId?: string;
  defaultCategoryId?: string;
};

export type ImportValidationError = {
  type: 'DUPLICATE_CHEST_NUMBER_EXCEL' | 'DUPLICATE_CHEST_NUMBER_DB' | 'TEAM_MISMATCH' | 'CATEGORY_MISMATCH' | 'MISSING_FIELD';
  row: number;
  name: string;
  chestNumber?: string;
  field?: string;
  message: string;
  details?: string;
  suggestedValues?: string[];
};

export async function validateCandidatesImport(
  rows: CandidateImportRow[],
  options: { updateExisting?: boolean } = {}
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Unauthorized" };

    const userEventId = session.user.eventId;
    const eventFilter: any = userEventId ? {
      OR: [
        { id: userEventId },
        { eventId: userEventId },
        { event: { parentId: userEventId } }
      ]
    } : {};

    // Fetch all teams and categories
    const [teams, categories, existingCandidates] = await Promise.all([
      prisma.team.findMany({
        where: userEventId ? {
          OR: [
            { eventId: userEventId },
            { event: { parentId: userEventId } }
          ]
        } : {},
        select: { id: true, name: true, prefixCode: true, eventId: true }
      }),
      prisma.category.findMany({
        where: userEventId ? {
          OR: [
            { eventId: userEventId },
            { event: { parentId: userEventId } }
          ]
        } : {},
        select: { id: true, name: true, eventId: true }
      }),
      prisma.candidate.findMany({
        select: {
          id: true,
          name: true,
          chestNumber: true,
          teamId: true,
          categoryId: true,
          team: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } }
        }
      })
    ]);

    const normalize = (str: string) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();

    const duplicateChestNumbers: ImportValidationError[] = [];
    const teamMismatches: ImportValidationError[] = [];
    const categoryMismatches: ImportValidationError[] = [];
    const missingFields: ImportValidationError[] = [];
    const warnings: Array<{ row: number; name: string; message: string }> = [];

    // Track chest numbers seen in this file
    const fileChestMap = new Map<string, { row: number; name: string }>();

    // Map existing DB chest numbers
    const dbChestMap = new Map<string, typeof existingCandidates[0]>();
    existingCandidates.forEach(cand => {
      if (cand.chestNumber) {
        dbChestMap.set(cand.chestNumber.trim().toUpperCase(), cand);
      }
    });

    const validCandidates: Array<{
      rowNumber: number;
      name: string;
      teamId: string;
      categoryId: string;
      chestNumber?: string;
      isUpdate?: boolean;
      existingId?: string;
    }> = [];

    for (const r of rows) {
      const rowNum = r.rowNumber;
      const candidateName = (r.name || "").toString().trim();
      const rawTeam = (r.rawTeam || "").toString().trim();
      const rawCat = (r.rawCategory || "").toString().trim();
      const rawChest = (r.chestNumber !== undefined && r.chestNumber !== null) ? String(r.chestNumber).trim() : "";

      let hasError = false;

      // 1. Missing Candidate Name
      if (!candidateName) {
        missingFields.push({
          type: 'MISSING_FIELD',
          row: rowNum,
          name: "(Empty)",
          field: "Candidate Name",
          message: `Row ${rowNum}: Candidate Name is missing.`,
          details: "Please provide a valid name."
        });
        hasError = true;
      }

      // 2. Resolve Team
      let resolvedTeam: typeof teams[0] | undefined;
      if (rawTeam) {
        resolvedTeam = teams.find(t => t.name.trim().toLowerCase() === rawTeam.toLowerCase())
          || teams.find(t => normalize(t.name) === normalize(rawTeam))
          || teams.find(t => t.prefixCode && t.prefixCode.trim().toLowerCase() === rawTeam.toLowerCase());

        if (!resolvedTeam) {
          teamMismatches.push({
            type: 'TEAM_MISMATCH',
            row: rowNum,
            name: candidateName || `Row ${rowNum}`,
            field: "Team",
            message: `Row ${rowNum}: Team "${rawTeam}" does not match any existing team.`,
            details: `Excel has "${rawTeam}". Please verify spelling against registered teams.`,
            suggestedValues: teams.map(t => t.name)
          });
          hasError = true;
        }
      } else if (r.defaultTeamId) {
        resolvedTeam = teams.find(t => t.id === r.defaultTeamId);
      }

      if (!resolvedTeam && !hasError) {
        missingFields.push({
          type: 'MISSING_FIELD',
          row: rowNum,
          name: candidateName,
          field: "Team",
          message: `Row ${rowNum}: Team is missing and no default team selected.`,
          details: "Select a default team or fill the Team column in Excel."
        });
        hasError = true;
      }

      // 3. Resolve Category
      let resolvedCategory: typeof categories[0] | undefined;
      if (rawCat) {
        // Try to match category by name (case-insensitive and normalized)
        let matchedCats = categories.filter(c => c.name.trim().toLowerCase() === rawCat.toLowerCase());
        if (matchedCats.length === 0) {
          matchedCats = categories.filter(c => normalize(c.name) === normalize(rawCat));
        }

        if (matchedCats.length > 0) {
          // If team is known, prefer category matching the team's eventId
          if (resolvedTeam) {
            resolvedCategory = matchedCats.find(c => c.eventId === resolvedTeam!.eventId) || matchedCats[0];
          } else {
            resolvedCategory = matchedCats[0];
          }
        } else {
          categoryMismatches.push({
            type: 'CATEGORY_MISMATCH',
            row: rowNum,
            name: candidateName || `Row ${rowNum}`,
            field: "Category",
            message: `Row ${rowNum}: Category "${rawCat}" does not match any existing category.`,
            details: `Excel has "${rawCat}". Please verify spelling against registered categories.`,
            suggestedValues: Array.from(new Set(categories.map(c => c.name)))
          });
          hasError = true;
        }
      } else if (r.defaultCategoryId) {
        resolvedCategory = categories.find(c => c.id === r.defaultCategoryId);
      }

      if (!resolvedCategory && !hasError) {
        missingFields.push({
          type: 'MISSING_FIELD',
          row: rowNum,
          name: candidateName,
          field: "Category",
          message: `Row ${rowNum}: Category is missing and no default category selected.`,
          details: "Select a default category or fill the Category column in Excel."
        });
        hasError = true;
      }

      // Ensure category matches team's event if possible
      if (resolvedTeam && resolvedCategory && resolvedCategory.eventId !== resolvedTeam.eventId) {
        const matchingCatInTeamEvent = categories.find(
          c => c.eventId === resolvedTeam!.eventId && normalize(c.name) === normalize(resolvedCategory!.name)
        );
        if (matchingCatInTeamEvent) {
          resolvedCategory = matchingCatInTeamEvent;
        }
      }

      // 4. Validate Chest Number (Customized)
      let isUpdateCandidate = false;
      let existingCandidateRecord: typeof existingCandidates[0] | undefined;

      if (candidateName && resolvedTeam && resolvedCategory) {
        // Check if candidate already registered in same team and category
        existingCandidateRecord = existingCandidates.find(
          c => c.teamId === resolvedTeam!.id &&
               c.categoryId === resolvedCategory!.id &&
               normalize(c.name) === normalize(candidateName)
        );
        if (existingCandidateRecord) {
          isUpdateCandidate = true;
          if (options.updateExisting) {
            warnings.push({
              row: rowNum,
              name: candidateName,
              message: `Candidate already registered in ${resolvedTeam.name} (${resolvedCategory.name}). Chest number will be updated.`
            });
          } else {
            warnings.push({
              row: rowNum,
              name: candidateName,
              message: `Candidate already exists in database with Chest No: ${existingCandidateRecord.chestNumber || "None"}.`
            });
          }
        }
      }

      if (rawChest) {
        const chestKey = rawChest.toUpperCase();

        // Check duplicate within the Excel file itself
        if (fileChestMap.has(chestKey)) {
          const prev = fileChestMap.get(chestKey)!;
          duplicateChestNumbers.push({
            type: 'DUPLICATE_CHEST_NUMBER_EXCEL',
            row: rowNum,
            name: candidateName,
            chestNumber: rawChest,
            message: `Row ${rowNum}: Duplicate Chest Number "${rawChest}" found in Excel file.`,
            details: `Chest Number "${rawChest}" is already assigned to "${prev.name}" in Row ${prev.row}.`
          });
          hasError = true;
        } else {
          fileChestMap.set(chestKey, { row: rowNum, name: candidateName });
        }

        // Check duplicate against existing database candidates
        if (dbChestMap.has(chestKey)) {
          const dbCand = dbChestMap.get(chestKey)!;
          // If updateExisting is enabled and it belongs to the EXACT same candidate, it's not a collision
          const isSameCandidate = existingCandidateRecord && existingCandidateRecord.id === dbCand.id;
          if (!isSameCandidate) {
            duplicateChestNumbers.push({
              type: 'DUPLICATE_CHEST_NUMBER_DB',
              row: rowNum,
              name: candidateName,
              chestNumber: rawChest,
              message: `Row ${rowNum}: Chest Number "${rawChest}" already taken in database.`,
              details: `Already assigned to candidate "${dbCand.name}" (Team: ${dbCand.team.name}, Category: ${dbCand.category.name}).`
            });
            hasError = true;
          }
        }
      }

      if (!hasError && candidateName && resolvedTeam && resolvedCategory) {
        validCandidates.push({
          rowNumber: rowNum,
          name: candidateName,
          teamId: resolvedTeam.id,
          categoryId: resolvedCategory.id,
          chestNumber: rawChest || undefined,
          isUpdate: isUpdateCandidate,
          existingId: existingCandidateRecord?.id
        });
      }
    }

    const totalErrors = duplicateChestNumbers.length + teamMismatches.length + categoryMismatches.length + missingFields.length;

    return {
      success: true,
      isValid: totalErrors === 0,
      summary: {
        totalRows: rows.length,
        validCount: validCandidates.length,
        errorCount: totalErrors,
        warningCount: warnings.length,
        duplicateCount: duplicateChestNumbers.length,
        mismatchCount: teamMismatches.length + categoryMismatches.length,
        missingCount: missingFields.length
      },
      categorizedErrors: {
        duplicateChestNumbers,
        teamMismatches,
        categoryMismatches,
        missingFields
      },
      warnings,
      validCandidates
    };
  } catch (error: any) {
    console.error("Failed to validate candidates import:", error);
    return { success: false, error: error.message || "Failed to validate candidate import data." };
  }
}

export async function bulkImportCandidates(
  candidatesList: Array<{
    name: string;
    teamId: string;
    categoryId: string;
    chestNumber?: string;
    existingId?: string;
    isUpdate?: boolean;
  }>,
  options: {
    updateExisting?: boolean;
    autoGenerateIfBlank?: boolean;
  } = {}
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return { success: false, error: "Unauthorized" };

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const failedRows: Array<{ name: string; chestNumber?: string; error: string }> = [];

    // Pre-load teams and categories for quick access and cross-event category resolution
    const teams = await prisma.team.findMany({ select: { id: true, name: true, prefixCode: true, eventId: true } });
    const categories = await prisma.category.findMany({ select: { id: true, name: true, chestNumberOffset: true, eventId: true } });

    for (const c of candidatesList) {
      if (!c.name || !c.teamId || !c.categoryId) {
        skippedCount++;
        continue;
      }

      try {
        const team = teams.find(t => t.id === c.teamId);
        const cat = categories.find(cat => cat.id === c.categoryId);

        // Ensure category matches team's event
        let finalCategoryId = c.categoryId;
        if (team && cat && cat.eventId !== team.eventId) {
          const matchingCat = categories.find(
            item => item.eventId === team.eventId && item.name.trim().toLowerCase() === cat.name.trim().toLowerCase()
          );
          if (matchingCat) {
            finalCategoryId = matchingCat.id;
          }
        }

        let chestNumber: string | null = (c.chestNumber !== undefined && c.chestNumber !== null)
          ? String(c.chestNumber).trim()
          : null;

        // Auto-generate next sequence only if blank and autoGenerateIfBlank is enabled (default true)
        if (!chestNumber && options.autoGenerateIfBlank !== false) {
          const prefixCode = team?.prefixCode || "C";
          const offset = cat?.chestNumberOffset || 0;

          const existingCandidates = await prisma.candidate.findMany({
            where: { teamId: c.teamId, categoryId: finalCategoryId, isApproved: true, chestNumber: { not: null } },
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

        // Check if candidate already exists by existingId or (name + team + category)
        let existingCand = null;
        if (c.existingId) {
          existingCand = await prisma.candidate.findUnique({ where: { id: c.existingId } });
        }
        if (!existingCand) {
          existingCand = await prisma.candidate.findFirst({
            where: {
              name: { equals: c.name.trim(), mode: "insensitive" },
              teamId: c.teamId,
              categoryId: finalCategoryId,
            }
          });
        }

        if (existingCand) {
          if (options.updateExisting) {
            await prisma.candidate.update({
              where: { id: existingCand.id },
              data: {
                chestNumber: chestNumber || existingCand.chestNumber,
                isApproved: true,
              }
            });
            updatedCount++;
          } else {
            skippedCount++;
          }
        } else {
          await prisma.candidate.create({
            data: {
              name: c.name.trim(),
              teamId: c.teamId,
              categoryId: finalCategoryId,
              chestNumber: chestNumber || null,
              isApproved: true,
            }
          });
          importedCount++;
        }
      } catch (rowErr: any) {
        console.error(`Error importing candidate ${c.name}:`, rowErr);
        if (rowErr.code === 'P2002') {
          failedRows.push({
            name: c.name,
            chestNumber: c.chestNumber,
            error: `Duplicate chest number "${c.chestNumber}" already exists in database.`
          });
        } else {
          failedRows.push({
            name: c.name,
            chestNumber: c.chestNumber,
            error: rowErr.message || "Constraint failure"
          });
        }
      }
    }

    revalidatePath("/dashboard/candidates");
    return {
      success: true,
      total: candidatesList.length,
      importedCount,
      updatedCount,
      skippedCount,
      failedCount: failedRows.length,
      failedRows
    };
  } catch (error: any) {
    console.error("Failed to bulk import candidates:", error);
    return { success: false, error: error.message || "Failed to import candidates" };
  }
}

