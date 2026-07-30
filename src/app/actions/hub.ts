"use server";

import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export async function getHubData(eventId?: string) {
  try {
    const fetcher = unstable_cache(
      async () => {
        const events = await prisma.event.findMany({
          where: eventId ? { id: eventId } : undefined,
          select: {
            id: true,
            name: true,
            categories: {
              select: {
                id: true,
                name: true
              }
            },
            _count: {
              select: {
                teams: true,
                programs: true
              }
            },
            programs: {
              select: {
                id: true,
                name: true,
                categoryId: true,
                _count: {
                  select: {
                    results: { where: { isPublished: true } },
                    assignments: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        const hubEvents = events.map(event => {
          const publishedProgramsCount = event.programs.filter(p => p._count.results > 0).length;
          
          const pendingProgramsCount = event.programs.filter(
            p => p._count.assignments > 0 && p._count.results === 0
          ).length;

          const stats = {
            totalPrograms: event._count.programs,
            publishedPrograms: publishedProgramsCount,
            pendingPrograms: pendingProgramsCount,
            totalTeams: event._count.teams,
            totalCandidates: 0
          };

          const pendingList = event.programs
            .filter(p => p._count.assignments > 0 && p._count.results === 0)
            .map(p => ({
              id: p.id,
              name: p.name,
              category: event.categories.find(c => c.id === p.categoryId)?.name || 'General',
              assignmentCount: p._count.assignments
            }));

          return {
            id: event.id,
            name: event.name,
            stats,
            pendingList
          };
        });

        return hubEvents || [];
      },
      [`hub-data-${eventId || 'all'}`],
      { revalidate: 15, tags: ['hub-data'] }
    );

    const data = await fetcher();
    return { success: true, data };
  } catch (error) {
    console.error("Hub data fetch failed:", error);
    return { success: false, error: "Failed to load hub data" };
  }
}
