import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import BulkIdCardsClient from "./BulkIdCardsClient";

export default async function BulkIdCardsPage({ searchParams }: { searchParams: Promise<{ teamId?: string, categoryId?: string }> }) {
  const params = await searchParams;
  const settings = await getSettings();

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
