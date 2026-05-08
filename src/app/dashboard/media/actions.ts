"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveMediaTemplate(programId: string, imageUrl: string) {
  try {
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
  posterTextColor?: string
}) {
  try {
    await prisma.globalSetting.upsert({
      where: { id: "default" },
      update: data,
      create: {
        id: "default",
        festName: "Arts Fest",
        ...data
      }
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to update poster settings:", error);
    return { success: false, error: "Failed to update poster settings" };
  }
}

export async function updateCategoryBranding(categoryId: string, posterBgUrl: string) {
    try {
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
