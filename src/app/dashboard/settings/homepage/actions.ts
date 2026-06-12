"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function saveHomepageSettings(data: any) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
      return { success: false, message: "Unauthorized" };
    }

    if (!user.eventId) {
      return { success: false, message: "No event associated with this user" };
    }

    if (!user.eventId) {
        return { success: false, message: "No event assigned" };
    }

    const eventId = user.eventId;

    let committeeMembers = [];
    let galleryImages = [];
    try {
      committeeMembers = data.committeeMembers ? JSON.parse(data.committeeMembers) : [];
      galleryImages = data.galleryImages ? JSON.parse(data.galleryImages) : [];
    } catch (e) {
      console.error("Failed to parse JSON arrays", e);
    }

    await prisma.homepageSetting.upsert({
      where: { eventId },
      update: {
        heroTitle: data.heroTitle,
        heroSubtitle: data.heroSubtitle,
        heroBgUrl: data.heroBgUrl,
        aboutTitle: data.aboutTitle,
        aboutText: data.aboutText,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        bgColor: data.bgColor,
        stat1Label: data.stat1Label,
        stat1Value: data.stat1Value,
        stat2Label: data.stat2Label,
        stat2Value: data.stat2Value,
        stat3Label: data.stat3Label,
        stat3Value: data.stat3Value,
        stat4Label: data.stat4Label,
        stat4Value: data.stat4Value,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        socialFacebook: data.socialFacebook,
        socialInstagram: data.socialInstagram,
        socialYoutube: data.socialYoutube,
        pinnedButtonText: data.pinnedButtonText,
        pinnedButtonLogoUrl: data.pinnedButtonLogoUrl,
        committeeMembers,
        galleryImages,
      },
      create: {
        eventId,
        heroTitle: data.heroTitle,
        heroSubtitle: data.heroSubtitle,
        heroBgUrl: data.heroBgUrl,
        aboutTitle: data.aboutTitle,
        aboutText: data.aboutText,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        bgColor: data.bgColor,
        stat1Label: data.stat1Label,
        stat1Value: data.stat1Value,
        stat2Label: data.stat2Label,
        stat2Value: data.stat2Value,
        stat3Label: data.stat3Label,
        stat3Value: data.stat3Value,
        stat4Label: data.stat4Label,
        stat4Value: data.stat4Value,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        socialFacebook: data.socialFacebook,
        socialInstagram: data.socialInstagram,
        socialYoutube: data.socialYoutube,
        pinnedButtonText: data.pinnedButtonText,
        pinnedButtonLogoUrl: data.pinnedButtonLogoUrl,
        committeeMembers,
        galleryImages,
      },
    });

    revalidatePath("/");
    revalidatePath("/dashboard/settings/homepage");
    revalidatePath(`/fest/${eventId}`);

    return { success: true, message: "Homepage settings saved successfully" };
  } catch (error) {
    console.error("Error saving homepage settings:", error);
    return { success: false, message: "Failed to save settings" };
  }
}
