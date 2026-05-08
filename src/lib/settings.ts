import { prisma } from "./prisma";

export async function getSettings() {
  try {
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
    return { festName: "Arts Fest", festMoto: "Celebrating Creativity", festLogo: null };
  }
}

export async function getFestBranding() {
  const settings = await getSettings();
  return {
    name: settings.festName,
    moto: settings.festMoto
  };
}
