"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function saveMediaTemplate(programId: string, imageUrl: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MEDIA")) {
      return { success: false, error: "Unauthorized" };
    }

    const { eventId } = session.user;

    if (eventId) {
      // Verify program belongs to user's event
      const program = await prisma.program.findUnique({
        where: { id: programId },
        select: { eventId: true }
      });
      if (!program || program.eventId !== eventId) {
        return { success: false, error: "Unauthorized" };
      }
    }

    await prisma.mediaTemplate.upsert({
      where: { programId },
      update: { imageUrl },
      create: { programId, imageUrl }
    });

    revalidatePath("/dashboard/media");
    return { success: true };
  } catch (error) {
    console.error("Failed to save media template:", error);
    return { success: false, error: "Failed to save media template" };
  }
}

export async function updatePosterSettings(data: {
  posterHeaderUrl?: string,
  posterFooterUrl?: string,
  posterCongratulationUrl?: string,
  posterLogoUrl?: string,
  posterBgUrl?: string,
  posterPrimaryColor?: string,
  posterSecondaryColor?: string,
  posterTextColor?: string,
  posterTextAlignment?: string,
  posterShowGrade?: boolean,
  posterMarginTop?: number,
  posterMarginLeft?: number,
  posterContentWidth?: number,
  posterProgramTop?: number,
  posterProgramLeft?: number,
  posterProgramWidth?: number,
  posterProgramFontSize?: number,
  posterCategoryTop?: number,
  posterCategoryLeft?: number,
  posterCategoryFontSize?: number,
  posterCategoryColor?: string,
  posterCategoryShow?: boolean,
  posterNumberTop?: number,
  posterNumberLeft?: number,
  posterNumberFontSize?: number,
  posterNumberColor?: string,
  posterNumberShow?: boolean,
  posterWinnersTop?: number,
  posterWinnersLeft?: number,
  posterWinnersWidth?: number,
  posterWinnerNameSize?: number,
  posterWinnerTeamSize?: number,
  posterWinnerTeamColor?: string,
  posterWinnerGap?: number,
  posterShowRankBadge?: boolean,
  posterShowChestNumber?: boolean,
  posterShowTeam?: boolean,
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MEDIA")) {
      return { success: false, error: "Unauthorized" };
    }

    const { eventId } = session.user;

    if (eventId) {
      // Find event and any related parent or sub-events
      const currentEv = await prisma.event.findUnique({
        where: { id: eventId },
        include: { subEvents: true }
      });

      const relatedEventIds = [eventId];
      if (currentEv?.parentId) relatedEventIds.push(currentEv.parentId);
      if (currentEv?.subEvents) {
        currentEv.subEvents.forEach(s => relatedEventIds.push(s.id));
      }

      // Upsert for each related event so all programs have access to the same poster art
      for (const eId of relatedEventIds) {
        await prisma.globalSetting.upsert({
          where: { eventId: eId },
          update: data,
          create: {
            id: `event-${eId}`,
            festName: currentEv?.name || "Arts Fest",
            event: {
              connect: { id: eId }
            },
            ...data
          }
        });
      }
    } else {
      await prisma.globalSetting.upsert({
        where: { id: "default" },
        update: data,
        create: {
          id: "default",
          festName: "Arts Fest",
          ...data
        }
      });
    }

    revalidatePath("/", "layout");
    revalidatePath("/results/[id]", "page");
    return { success: true };
  } catch (error) {
    console.error("Failed to update poster settings:", error);
    return { success: false, error: "Failed to update poster settings" };
  }
}

export async function updateCategoryBranding(categoryId: string, posterBgUrl: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MEDIA")) {
            return { success: false, error: "Unauthorized" };
        }

        const { eventId } = session.user;

        if (eventId) {
            // Verify category belongs to user's event
            const category = await prisma.category.findUnique({
                where: { id: categoryId },
                select: { eventId: true }
            });
            if (!category || category.eventId !== eventId) {
                return { success: false, error: "Unauthorized" };
            }
        }

        await prisma.category.update({
            where: { id: categoryId },
            data: { posterBgUrl }
        });

        revalidatePath("/", "layout");
        return { success: true };
    } catch (error) {
        console.error("Failed to update category branding:", error);
        return { success: false, error: "Failed to update category branding" };
    }
}
