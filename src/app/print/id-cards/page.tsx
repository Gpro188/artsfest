import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import BulkIdCardsClient from "./BulkIdCardsClient";

export default async function BulkIdCardsPage({ searchParams }: { searchParams: Promise<{ teamId?: string, categoryId?: string }> }) {
  const params = await searchParams;
  let eventId = undefined;
  
  if (params.teamId) {
    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
      select: { eventId: true }
    });
    if (team) {
      eventId = team.eventId;
    }
  } else if (params.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: params.categoryId },
      select: { eventId: true }
    });
    if (category) {
      eventId = category.eventId;
    }
  }

  const settings = await getSettings(eventId);

  const candidates = await prisma.candidate.findMany({
    where: {
      teamId: params.teamId || undefined,
      categoryId: params.categoryId || undefined,
      isApproved: true
    },
    include: {
      team: true,
      category: true,
      programs: {
        include: { program: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  return <BulkIdCardsClient candidates={candidates as any} settings={settings} />;
}
