import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getSettings, getHomepageSettings } from "@/lib/settings";
import FestHomepage from "../../components/FestHomepage";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain } = await params;
  const decodedDomain = decodeURIComponent(domain);
  const event = await prisma.event.findUnique({ where: { customDomain: decodedDomain } });
  
  if (!event) return { title: "Arts Fest Not Found" };
  
  const globalSetting = await getSettings(event.id);
  const homepage = await getHomepageSettings(event.id);
  
  const festName = homepage?.heroTitle || globalSetting.festName || event.name;
  const title = `${festName} | Dpro Artsfest System`;
  const description = homepage?.heroSubtitle || homepage?.aboutText || `Join us in the wonderful celebration of arts and creativity at ${festName}.`;
  
  let keywords = [festName, "dpro", "artsfest", "festival management"];
  if (decodedDomain === 'bilhikma.online') {
    keywords.push("jamia jalaliyya arts fest", "jalaliyya artsfest", "bilhikma artfest", "bil hikma artsfest", "jasia artsfest", "bil hikma jasia", "bil hikma artsfets");
  }

  return {
    title,
    description,
    icons: globalSetting.festLogo ? { icon: globalSetting.festLogo } : undefined,
    keywords,
    openGraph: {
      title,
      description,
      images: homepage?.heroBgUrl ? [homepage.heroBgUrl] : [],
      type: "website",
    },
  };
}

export default async function CustomDomainHomepage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const decodedDomain = decodeURIComponent(domain);

  const event = await prisma.event.findUnique({
    where: { customDomain: decodedDomain },
    include: {
      homepageSetting: true
    }
  });

  if (!event) {
    notFound();
  }

  const globalSetting = await getSettings(event.id);

  return (
    <FestHomepage 
      event={event} 
      homepageSetting={event.homepageSetting} 
      globalSetting={globalSetting} 
      baseResultUrl={`/results`}
    />
  );
}
