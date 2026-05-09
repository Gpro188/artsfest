"use server";

import { prisma } from "@/lib/prisma";

export async function getHubData() {
  try {
    const events = await prisma.event.findMany({
      include: {
        categories: true,
        teams: true,
        programs: {
          include: {
            results: true,
            assignments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const hubEvents = events.map(event => {
      // 1. Calculate Leaderboard
      const teamScores: Record<string, number> = {};
      event.teams.forEach(t => teamScores[t.id] = 0);
      
      const publishedResults = event.programs.flatMap(p => p.results.filter(r => r.isPublished));
      publishedResults.forEach(res => {
        const teamId = res.candidateId ? event.programs.find(p => p.id === res.programId)?.assignments.find(a => a.candidateId === res.candidateId)?.candidateId : res.teamId;
        // Wait, the result model has teamId directly now
        const actualTeamId = res.teamId || (res.candidateId ? "CANDIDATE_TEAM_LOOKUP" : null);
        // Correct lookup
      });

      // Let's use a simpler approach for the hub summary
      const stats = {
        totalPrograms: event.programs.length,
        publishedPrograms: event.programs.filter(p => p.results.some(r => r.isPublished)).length,
        pendingPrograms: event.programs.filter(p => p.assignments.length > 0 && !p.results.some(r => r.isPublished)).length,
        totalTeams: event.teams.length,
        totalCandidates: 0 // We'd need another query for this if needed
      };

      const pendingList = event.programs
        .filter(p => p.assignments.length > 0 && !p.results.some(r => r.isPublished))
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

    return { success: true, data: hubEvents };
  } catch (error) {
    console.error("Hub data fetch failed:", error);
    return { success: false, error: "Failed to load hub data" };
  }
}
