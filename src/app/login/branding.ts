"use server";

import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

export async function getBranding() {
  try {
    const firstEvent = await prisma.event.findFirst({
      where: { parentId: null },
      orderBy: { createdAt: 'desc' }
    });

    if (firstEvent) {
      const settings = await getSettings(firstEvent.id);
      return {
        name: settings.festName || firstEvent.name,
        moto: settings.festMoto || "Celebrating Creativity"
      };
    }

    return {
      name: "Dpro Artsfest",
      moto: "Premium Festival Management"
    };
  } catch (error) {
    return {
      name: "Dpro Artsfest",
      moto: "Premium Festival Management"
    };
  }
}
