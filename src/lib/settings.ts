import { prisma } from "./prisma";
import { unstable_cache } from "next/cache";

export const getSettings = unstable_cache(
  async () => {
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
  },
  ['global-settings'],
  { revalidate: 300, tags: ['settings'] }
);

export async function getFestBranding() {
  const settings = await getSettings();
  return {
    name: settings.festName,
    moto: settings.festMoto
  };
}
