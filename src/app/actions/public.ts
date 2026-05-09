"use server";

import { prisma } from "@/lib/prisma";

import { unstable_cache } from 'next/cache';

const getCachedPublicEventData = unstable_cache(
  async (eventId: string) => {
    // 1. Get Latest Results (Published only)
    const latestResults = await prisma.result.findMany({
      where: { 
        program: { eventId },
        isPublished: true 
      },
      include: {
        candidate: { include: { team: true } },
        team: true, // Crucial for group results
        program: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    // 2. Get Teams with Leader Info
    const teams = await prisma.team.findMany({
      where: { eventId }
    });

    // 3. Get Published Results for Calculation
    const allPublishedResults = await prisma.result.findMany({
      where: {
        program: { eventId },
        isPublished: true
      },
      include: {
        candidate: { include: { team: true, category: true } },
        team: true, // Crucial for group results
        program: { include: { category: true } }
      }
    });

    // --- Team Leaderboard ---
    const teamScores: Record<string, { id: string, name: string, points: number, flagColor: string | null, leaderName: string | null, leaderPhoto: string | null }> = {};
    
    // Initialize all teams in scores to handle teams with 0 points
    teams.forEach(t => {
      teamScores[t.id] = {
        id: t.id,
        name: t.name,
        points: 0,
        flagColor: t.flagColor,
        leaderName: t.leaderName,
        leaderPhoto: t.leaderPhoto
      };
    });

    allPublishedResults.forEach(res => {
      let teamId = null;
      let teamName = "";
      let teamFlag = null;
      let teamLeader = null;
      let teamPhoto = null;

      if (res.candidate) {
        teamId = res.candidate.team.id;
        teamName = res.candidate.team.name;
        teamFlag = res.candidate.team.flagColor;
        teamLeader = res.candidate.team.leaderName;
        teamPhoto = res.candidate.team.leaderPhoto;
      } else if (res.team) {
        teamId = res.team.id;
        teamName = res.team.name;
        teamFlag = res.team.flagColor;
        teamLeader = res.team.leaderName;
        teamPhoto = res.team.leaderPhoto;
      }

      if (teamId && teamScores[teamId]) {
        teamScores[teamId].points += res.points;
      } else if (teamId) {
         // Fallback if team wasn't in initial list for some reason
         teamScores[teamId] = {
           id: teamId,
           name: teamName,
           points: res.points,
           flagColor: teamFlag,
           leaderName: teamLeader,
           leaderPhoto: teamPhoto
         };
      }
    });
    const leaderboard = Object.values(teamScores).sort((a, b) => b.points - a.points);

    // --- Individual Top 5 Stars (Overall) ---
    const candidateScores: Record<string, { id: string, name: string, teamName: string, teamColor: string | null, points: number, categoryName: string, photo: string | null }> = {};
    allPublishedResults.forEach(res => {
      if (!res.candidate) return; // Only count individual stars
      
      const candId = res.candidate.id;
      if (!candidateScores[candId]) {
        candidateScores[candId] = {
          id: candId,
          name: res.candidate.name,
          teamName: res.candidate.team.name,
          teamColor: res.candidate.team.flagColor,
          categoryName: res.candidate.category.name,
          photo: res.candidate.photo,
          points: 0
        };
      }
      candidateScores[candId].points += res.points;
    });
    const topStars = Object.values(candidateScores).sort((a, b) => b.points - a.points).slice(0, 5);

    // --- Category Top 5 Stars ---
    const categories = await prisma.category.findMany({ where: { eventId } });
    const categoryStars: Record<string, any[]> = {};

    categories.forEach(cat => {
      const catScores = Object.values(candidateScores)
        .filter(c => c.categoryName === cat.name)
        .sort((a, b) => b.points - a.points)
        .slice(0, 5);
      
      if (catScores.length > 0) {
        categoryStars[cat.name] = catScores;
      }
    });

    // --- Statistics ---
    const [totalPrograms, allPrograms, totalCandidates, candidatesWithAssignments] = await Promise.all([
        prisma.program.count({ where: { eventId } }),
        prisma.program.findMany({ 
            where: { eventId },
            include: { results: { where: { isPublished: true } } } 
        }),
        prisma.candidate.count({ where: { category: { eventId } } }),
        prisma.programAssignment.groupBy({
            by: ['candidateId'],
            where: { program: { eventId } }
        })
    ]);

    const publishedProgramsCount = allPrograms.filter(p => p.results.length > 0).length;
    const stats = {
        totalPrograms,
        publishedPrograms: publishedProgramsCount,
        pendingPrograms: totalPrograms - publishedProgramsCount,
        totalCandidates,
        totalParticipants: candidatesWithAssignments.length
    };

    return { 
        latestResults, 
        leaderboard, 
        teams, 
        topStars, 
        categoryStars,
        stats
    };
  },
  ['public-event-data'],
  { revalidate: 30, tags: ['public-event-data'] }
);

export async function getPublicEventData(eventId: string) {
  try {
    const data = await getCachedPublicEventData(eventId);
    return { success: true, data };
  } catch (error) {
    console.error("Failed to fetch public data:", error);
    return { success: false, error: "Failed to fetch data" };
  }
}

export async function getProgramResults(programId: string) {
  try {
    const [program, settings] = await Promise.all([
      prisma.program.findUnique({
        where: { id: programId },
        include: {
          category: true,
          event: true,
          mediaTemplate: true,
          results: {
            where: { isPublished: true },
            include: {
              candidate: { include: { team: true } },
              team: true
            },
            orderBy: { rank: 'asc' }
          }
        }
      }),
      prisma.globalSetting.findUnique({ where: { id: "default" } })
    ]);

    if (!program) return { success: false, error: "Program not found" };

    return { success: true, data: { program, settings } };
  } catch (error) {
    console.error("Failed to fetch program results:", error);
    return { success: false, error: "Failed to fetch results" };
  }
}
