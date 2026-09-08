import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import BulkIdCardsClient from "./BulkIdCardsClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getFestivalEventIds } from "@/lib/eventScope";

export default async function BulkIdCardsPage({ searchParams }: { searchParams: Promise<{ teamId?: string, categoryId?: string, eventId?: string }> }) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);
  let eventId = params.eventId || session?.user?.eventId || undefined;
  
  if (!eventId && params.teamId) {
    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
      select: { eventId: true }
    });
    if (team) {
      eventId = team.eventId;
    }
  } else if (!eventId && params.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: params.categoryId },
      select: { eventId: true }
    });
    if (category) {
      eventId = category.eventId;
    }
  }

  const festEventIds = await getFestivalEventIds(eventId);
  const settings = await getSettings(festEventIds[0] || eventId);

  const candidateWhere: any = {
    teamId: params.teamId || undefined,
    categoryId: params.categoryId || undefined,
    isApproved: true
  };

  if (!params.teamId && festEventIds.length > 0) {
    candidateWhere.team = {
      eventId: { in: festEventIds }
    };
  }

  const candidates = await prisma.candidate.findMany({
    where: candidateWhere,
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
