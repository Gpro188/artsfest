"use server";

import { prisma } from "@/lib/prisma";

import { unstable_cache } from 'next/cache';

const getCachedPublicEventData = unstable_cache(
  async (eventId: string) => {
    // 1. Get Latest Results (Published only) - Pruned to select only required fields
    const latestResults = await prisma.result.findMany({
      where: { 
        program: { eventId },
        isPublished: true 
      },
      select: {
        id: true,
        points: true,
        rank: true,
        grade: true,
        updatedAt: true,
        candidate: {
          select: {
            id: true,
            name: true,
            chestNumber: true,
            photo: true,
            team: {
              select: {
                id: true,
                name: true,
                flagColor: true
              }
            }
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            flagColor: true,
            leaderPhoto: true
          }
        },
        program: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    // 2. Get Teams with Leader Info - Pruned fields
    const teams = await prisma.team.findMany({
      where: { eventId },
      select: {
        id: true,
        name: true,
        flagColor: true,
        leaderName: true,
        leaderPhoto: true
      }
    });

    // 3. Get Published Results for Calculation - Select only fields required for scoring & leaderboard
    const allPublishedResults = await prisma.result.findMany({
      where: {
        program: { eventId },
        isPublished: true
      },
      select: {
        id: true,
        points: true,
        candidateId: true,
        teamId: true,
        candidate: {
          select: {
            id: true,
            name: true,
            photo: true,
            teamId: true,
            team: {
              select: {
                id: true,
                name: true,
                flagColor: true
              }
            },
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            flagColor: true
          }
        }
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

      if (res.candidate) {
        teamId = res.candidate.team.id;
        teamName = res.candidate.team.name;
        teamFlag = res.candidate.team.flagColor;
      } else if (res.team) {
        teamId = res.team.id;
        teamName = res.team.name;
        teamFlag = res.team.flagColor;
      }

      if (teamId && teamScores[teamId]) {
        teamScores[teamId].points += res.points;
      } else if (teamId) {
         // Fallback if team wasn't in initial list for some reason
         const matchingTeam = teams.find(t => t.id === teamId);
         teamScores[teamId] = {
           id: teamId,
           name: teamName,
           points: res.points,
           flagColor: teamFlag,
           leaderName: matchingTeam?.leaderName || null,
           leaderPhoto: matchingTeam?.leaderPhoto || null
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
    const categories = await prisma.category.findMany({ 
      where: { eventId },
      select: { id: true, name: true }
    });
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

    // --- Statistics - Optimized program count database aggregates ---
    const [totalPrograms, publishedProgramsCount, totalCandidates, candidatesWithAssignments] = await Promise.all([
        prisma.program.count({ where: { eventId } }),
        prisma.program.count({
            where: {
                eventId,
                results: {
                    some: {
                        isPublished: true
                    }
                }
            }
        }),
        prisma.candidate.count({ where: { category: { eventId } } }),
        prisma.programAssignment.groupBy({
            by: ['candidateId'],
            where: { program: { eventId } }
        })
    ]);

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

const getCachedProgramResults = unstable_cache(
  async (programId: string) => {
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

    return { program, settings };
  },
  ['program-results'],
  { revalidate: 60, tags: ['results'] }
);

export async function getProgramResults(programId: string) {
  try {
    const data = await getCachedProgramResults(programId);
    if (!data.program) return { success: false, error: "Program not found" };
    return { success: true, data };
  } catch (error) {
    console.error("Failed to fetch program results:", error);
    return { success: false, error: "Failed to fetch results" };
  }
}
