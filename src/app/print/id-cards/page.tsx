import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import BulkIdCardsClient from "./BulkIdCardsClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { resolveFestivalScope } from "@/lib/eventScope";
import { headers } from "next/headers";

export default async function BulkIdCardsPage({ searchParams }: { searchParams: Promise<{ teamId?: string, categoryId?: string, eventId?: string }> }) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);
  const headerList = await headers();
  const host = headerList.get("host") || "";

  const { eventId, festEventIds } = await resolveFestivalScope({
    eventId: params.eventId,
    teamId: params.teamId,
    categoryId: params.categoryId,
    sessionEventId: session?.user?.eventId,
    host
  });

  const settings = await getSettings(eventId);

  // Fetch teams for this festival so user can filter or group by team
  const teams = await prisma.team.findMany({
    where: {
      eventId: { in: festEventIds }
    },
    select: {
      id: true,
      name: true,
      flagColor: true,
      prefixCode: true
    },
    orderBy: { name: 'asc' }
  });

  const candidateWhere: any = {
    isApproved: true,
    team: {
      eventId: { in: festEventIds }
    }
  };

  if (params.teamId) {
    candidateWhere.teamId = params.teamId;
  }
  if (params.categoryId) {
    candidateWhere.categoryId = params.categoryId;
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
    orderBy: [
      { team: { name: 'asc' } },
      { chestNumber: 'asc' },
      { name: 'asc' }
    ]
  });

  return (
    <BulkIdCardsClient 
      candidates={candidates as any} 
      settings={settings} 
      teams={teams} 
      initialTeamId={params.teamId}
    />
  );
}

