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
  const title = `${festName} | Arts Fest Official Portal`;
  const description = homepage?.heroSubtitle || homepage?.aboutText || `Welcome to ${festName}. View live scores, candidate details, schedule, and results.`;
  
  const siteUrl = `https://${decodedDomain}`;
  const keywords = [
    festName,
    `${festName} arts fest`,
    `${festName} live results`,
    `${festName} scoreboard`,
    "arts fest",
    "arts festival",
    "live results",
    "dpro artsfest",
    decodedDomain
  ];

  if (decodedDomain.includes('kalaam')) {
    keywords.push("kalaam", "kalaam arts fest", "kalaam art fest", "kalaam artsfest", "kalaam fest", "kalaam 2026", "kalaam-art.online");
  } else if (decodedDomain.includes('vuswool')) {
    keywords.push("vuswool", "vuswool arts fest", "vuswool art fest", "vuswool'26", "vuswool 2026", "thahqeeq arts fest", "thahqeeq", "vuswool.online");
  } else if (decodedDomain.includes('bilhikma')) {
    keywords.push("jamia jalaliyya arts fest", "jalaliyya artsfest", "bilhikma artfest", "bil hikma artsfest", "jasia artsfest", "bil hikma jasia", "bilhikma.online");
  }

  const ogImage = homepage?.heroBgUrl || globalSetting.festLogo || "/logo.png";

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: siteUrl,
    },
    icons: globalSetting.festLogo ? { icon: globalSetting.festLogo } : undefined,
    keywords,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    openGraph: {
      title,
      description,
      url: siteUrl,
      siteName: festName,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: festName }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : [],
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
  const festName = event.homepageSetting?.heroTitle || globalSetting.festName || event.name;
  const description = event.homepageSetting?.heroSubtitle || event.homepageSetting?.aboutText || `Official portal for ${festName}. Live scores, standings, and results.`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            name: festName,
            description: description,
            url: `https://${decodedDomain}`,
            eventStatus: "https://schema.org/EventScheduled",
            organizer: {
              "@type": "Organization",
              name: festName,
              url: `https://${decodedDomain}`,
            },
          }),
        }}
      />
      <FestHomepage 
        event={event} 
        homepageSetting={event.homepageSetting} 
        globalSetting={globalSetting} 
        baseResultUrl={`/results`}
      />
    </>
  );
}
