import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getSettings } from "@/lib/settings";
import FestHomepage from "../../components/FestHomepage";

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
      baseResultUrl={`/domain/${domain}/results`}
    />
  );
}
