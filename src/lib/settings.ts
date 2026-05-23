import { prisma } from "./prisma";

export async function getSettings(eventId?: string | null) {
  try {
    if (eventId) {
      let settings = await prisma.globalSetting.findUnique({
        where: { eventId }
      });
      if (!settings) {
        // Fetch event name to pre-populate settings
        const event = await prisma.event.findUnique({
          where: { id: eventId }
        });
        settings = await prisma.globalSetting.create({
          data: {
            eventId,
            festName: event?.name || "Arts Fest",
            festMoto: "Celebrating Creativity"
          }
        });
      }
      return settings;
    }

    return await prisma.globalSetting.upsert({
      where: { id: "default" },
      update: {},
      create: { 
        id: "default", 
        festName: "Arts Fest",
        festMoto: "Celebrating Creativity"
      }
    });
  } catch (e) {
    console.error("getSettings failed:", e);
    return { 
      id: "default", 
      festName: "Arts Fest", 
      festMoto: "Celebrating Creativity", 
      festLogo: null,
      posterBgUrl: null,
      posterLogoUrl: null,
      posterHeaderUrl: null,
      posterFooterUrl: null,
      posterCongratulationUrl: null,
      posterPrimaryColor: "#1e293b",
      posterSecondaryColor: "#f97316",
      posterTextColor: "#1e293b"
    } as any;
  }
}

export async function getFestBranding(eventId?: string | null) {
  const settings = await getSettings(eventId);
  return {
    name: settings.festName,
    moto: settings.festMoto
  };
}
