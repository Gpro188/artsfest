"use server";

import { prisma } from "@/lib/prisma";

export async function getHubData() {
  try {
    const events = await prisma.event.findMany({
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
            results: {
              where: { isPublished: true },
              select: {
                id: true
              }
            },
            assignments: {
              select: {
                id: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const hubEvents = events.map(event => {
      // stats.totalPrograms and stats.totalTeams are loaded via _count
      // stats.publishedPrograms matches programs that have at least one published result
      const publishedProgramsCount = event.programs.filter(p => p.results.length > 0).length;
      
      // stats.pendingPrograms matches programs that have assignments but no published results
      const pendingProgramsCount = event.programs.filter(
        p => p.assignments.length > 0 && p.results.length === 0
      ).length;

      const stats = {
        totalPrograms: event._count.programs,
        publishedPrograms: publishedProgramsCount,
        pendingPrograms: pendingProgramsCount,
        totalTeams: event._count.teams,
        totalCandidates: 0
      };

      const pendingList = event.programs
        .filter(p => p.assignments.length > 0 && p.results.length === 0)
        .map(p => ({
          id: p.id,
          name: p.name,
          category: event.categories.find(c => c.id === p.categoryId)?.name || 'General',
          assignmentCount: p.assignments.length
        }));

      return {
        id: event.id,
        name: event.name,
        stats,
        pendingList
      };
    });

    return { success: true, data: hubEvents || [] };
  } catch (error) {
    console.error("Hub data fetch failed:", error);
    return { success: false, error: "Failed to load hub data" };
  }
}
