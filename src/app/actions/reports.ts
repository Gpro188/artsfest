"use server";

import { prisma } from "@/lib/prisma";
import { getFestivalEventIds } from "@/lib/eventScope";
import { getSettings } from "@/lib/settings";

export type CandidateStarReport = {
  id: string;
  name: string;
  chestNumber: string | null;
  teamId: string;
  teamName: string;
  teamColor: string | null;
  categoryId: string;
  categoryName: string;
  photo: string | null;
  isApproved: boolean;
  programsAssignedCount: number;
  programsEvaluatedCount: number;
  rank1Count: number;
  rank2Count: number;
  rank3Count: number;
  gradeACount: number;
  gradeBCount: number;
  gradeCCount: number;
  grossPointsPublished: number;
  grossPointsTotal: number;
  individualPenalties: number;
  netPointsPublished: number;
  netPointsTotal: number;
  overallRank: number;
  categoryRank: number;
  programs: Array<{
    resultId: string;
    programId: string;
    programName: string;
    programType: string;
    categoryName: string;
    rank: number | null;
    grade: string | null;
    marks: number;
    points: number;
    isPublished: boolean;
  }>;
};

export type TeamStandingReport = {
  id: string;
  name: string;
  prefixCode: string | null;
  flagColor: string | null;
  leaderName: string | null;
  candidatesCount: number;
  individualPoints: number;
  groupPoints: number;
  generalPoints: number;
  grossPoints: number;
  penaltyPoints: number;
  netPoints: number;
  rank: number;
  categoryBreakdown: Record<string, number>;
};

export type ProgramResultReport = {
  id: string;
  programCode: string | null;
  name: string;
  type: string;
  categoryId: string | null;
  categoryName: string;
  venue: string | null;
  startTime: string | null;
  duration: number;
  stageType: string;
  candidateLimitPerTeam: number;
  assignmentsCount: number;
  resultsCount: number;
  isPublished: boolean;
  isEvaluated: boolean;
  winners: Array<{
    rank: number | null;
    grade: string | null;
    points: number;
    marks: number;
    candidateName: string | null;
    chestNumber: string | null;
    teamName: string;
    teamColor: string | null;
  }>;
};

export type CandidateDirectoryItem = {
  id: string;
  name: string;
  chestNumber: string | null;
  teamId: string;
  teamName: string;
  teamColor: string | null;
  categoryId: string;
  categoryName: string;
  isApproved: boolean;
  programsCount: number;
};

export type ScheduleReportItem = {
  id: string;
  programCode: string | null;
  name: string;
  type: string;
  categoryName: string;
  venue: string | null;
  startTime: string | null;
  duration: number;
  stageType: string;
  enrolledCount: number;
};

export type ReportsDataResponse = {
  event: {
    id: string;
    name: string;
    startDate: string | null;
    endDate: string | null;
  };
  festName: string;
  festMoto: string;
  festLogo: string | null;
  categories: Array<{ id: string; name: string }>;
  teams: Array<{ id: string; name: string; flagColor: string | null }>;
  candidates: CandidateStarReport[];
  teamsStandings: TeamStandingReport[];
  programResults: ProgramResultReport[];
  candidateDirectory: CandidateDirectoryItem[];
  schedule: ScheduleReportItem[];
  stats: {
    totalStudents: number;
    totalTeams: number;
    totalPrograms: number;
    evaluatedPrograms: number;
    publishedPrograms: number;
    totalPointsAwarded: number;
    topStar: CandidateStarReport | null;
    topTeam: TeamStandingReport | null;
  };
};

export async function getReportsData(eventId?: string): Promise<{ success: boolean; data?: ReportsDataResponse; error?: string }> {
  try {
    let resolvedEventId = eventId;
    if (!resolvedEventId) {
      const firstEvent = await prisma.event.findFirst({
        where: { parentId: null },
        orderBy: { createdAt: "desc" },
        select: { id: true }
      });
      resolvedEventId = firstEvent?.id;
    }

    if (!resolvedEventId) {
      return { success: false, error: "No festival event found" };
    }

    const festEventIds = await getFestivalEventIds(resolvedEventId);
    const eventIds = festEventIds.length > 0 ? festEventIds : [resolvedEventId];

    const [
      event,
      settings,
      rawCategories,
      teams,
      allCandidates,
      allResults,
      allPrograms,
      allPenalties
    ] = await Promise.all([
      prisma.event.findUnique({
        where: { id: resolvedEventId },
        select: { id: true, name: true, startDate: true, endDate: true }
      }),
      getSettings(resolvedEventId),
      prisma.category.findMany({
        where: { eventId: { in: eventIds } },
        select: { id: true, name: true },
        orderBy: { name: "asc" }
      }),
      prisma.team.findMany({
        where: { eventId: { in: eventIds } },
        select: {
          id: true,
          name: true,
          prefixCode: true,
          flagColor: true,
          leaderName: true,
          eventId: true
        },
        orderBy: { name: "asc" }
      }),
      prisma.candidate.findMany({
        where: { team: { eventId: { in: eventIds } } },
        include: {
          team: { select: { id: true, name: true, flagColor: true } },
          category: { select: { id: true, name: true } },
          programs: { select: { id: true, programId: true } }
        },
        orderBy: [{ category: { name: "asc" } }, { chestNumber: "asc" }, { name: "asc" }]
      }),
      prisma.result.findMany({
        where: { program: { eventId: { in: eventIds } } },
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
              chestNumber: true,
              teamId: true,
              categoryId: true,
              photo: true,
              isApproved: true,
              team: { select: { id: true, name: true, flagColor: true } },
              category: { select: { id: true, name: true } }
            }
          },
          team: { select: { id: true, name: true, flagColor: true } },
          program: {
            select: {
              id: true,
              programCode: true,
              name: true,
              type: true,
              categoryId: true,
              category: { select: { id: true, name: true } }
            }
          }
        },
        orderBy: [
          { program: { name: "asc" } },
          { rank: "asc" },
          { marks: "desc" }
        ]
      }),
      prisma.program.findMany({
        where: { eventId: { in: eventIds } },
        include: {
          category: { select: { id: true, name: true } },
          assignments: { select: { id: true } },
          results: {
            include: {
              candidate: { select: { id: true, name: true, chestNumber: true, team: { select: { name: true, flagColor: true } } } },
              team: { select: { id: true, name: true, flagColor: true } }
            },
            orderBy: [{ rank: "asc" }, { marks: "desc" }]
          }
        },
        orderBy: [{ startTime: "asc" }, { name: "asc" }]
      }),
      prisma.teamPenalty.findMany({
        where: { eventId: { in: eventIds } },
        include: {
          team: { select: { id: true, name: true } },
          candidate: { select: { id: true, name: true, chestNumber: true } }
        }
      })
    ]);

    if (!event) {
      return { success: false, error: "Event details not found" };
    }

    // Deduplicate categories by normalized name
    const seenCat = new Set<string>();
    const categories = rawCategories.filter(c => {
      const key = c.name.trim().toUpperCase();
      if (seenCat.has(key)) return false;
      seenCat.add(key);
      return true;
    });

    // ─────────────────────────────────────────────────────────────
    // 1. CANDIDATES / HALL OF FAME AGGREGATION (INDIVIDUAL STANDINGS)
    // ─────────────────────────────────────────────────────────────
    const candidateMap = new Map<string, CandidateStarReport>();

    allCandidates.forEach(cand => {
      candidateMap.set(cand.id, {
        id: cand.id,
        name: cand.name,
        chestNumber: cand.chestNumber || null,
        teamId: cand.teamId,
        teamName: cand.team?.name || "Independent",
        teamColor: cand.team?.flagColor || null,
        categoryId: cand.categoryId,
        categoryName: cand.category?.name || "General",
        photo: cand.photo || null,
        isApproved: cand.isApproved,
        programsAssignedCount: cand.programs.length,
        programsEvaluatedCount: 0,
        rank1Count: 0,
        rank2Count: 0,
        rank3Count: 0,
        gradeACount: 0,
        gradeBCount: 0,
        gradeCCount: 0,
        grossPointsPublished: 0,
        grossPointsTotal: 0,
        individualPenalties: 0,
        netPointsPublished: 0,
        netPointsTotal: 0,
        overallRank: 0,
        categoryRank: 0,
        programs: []
      });
    });

    // Aggregate individual program results into candidate points
    allResults.forEach(res => {
      // Strictly individual programs count towards Hall of Fame candidate points
      if (!res.candidate || res.program?.type !== "INDIVIDUAL") return;

      const candId = res.candidate.id;
      let candRecord = candidateMap.get(candId);
      if (!candRecord) {
        candRecord = {
          id: candId,
          name: res.candidate.name,
          chestNumber: res.candidate.chestNumber || null,
          teamId: res.candidate.teamId,
          teamName: res.candidate.team?.name || "Independent",
          teamColor: res.candidate.team?.flagColor || null,
          categoryId: res.candidate.categoryId,
          categoryName: res.candidate.category?.name || "General",
          photo: res.candidate.photo || null,
          isApproved: res.candidate.isApproved,
          programsAssignedCount: 0,
          programsEvaluatedCount: 0,
          rank1Count: 0,
          rank2Count: 0,
          rank3Count: 0,
          gradeACount: 0,
          gradeBCount: 0,
          gradeCCount: 0,
          grossPointsPublished: 0,
          grossPointsTotal: 0,
          individualPenalties: 0,
          netPointsPublished: 0,
          netPointsTotal: 0,
          overallRank: 0,
          categoryRank: 0,
          programs: []
        };
        candidateMap.set(candId, candRecord);
      }

      candRecord.programsEvaluatedCount += 1;
      candRecord.grossPointsTotal += res.points;
      if (res.isPublished) {
        candRecord.grossPointsPublished += res.points;
      }

      if (res.rank === 1) candRecord.rank1Count += 1;
      else if (res.rank === 2) candRecord.rank2Count += 1;
      else if (res.rank === 3) candRecord.rank3Count += 1;

      const g = (res.grade || "").toUpperCase();
      if (g === "A") candRecord.gradeACount += 1;
      else if (g === "B") candRecord.gradeBCount += 1;
      else if (g === "C") candRecord.gradeCCount += 1;

      candRecord.programs.push({
        resultId: res.id,
        programId: res.program.id,
        programName: res.program.name,
        programType: res.program.type,
        categoryName: res.program.category?.name || "General",
        rank: res.rank,
        grade: res.grade,
        marks: res.marks,
        points: res.points,
        isPublished: res.isPublished
      });
    });

    // Deduct Individual Total Penalties
    allPenalties.forEach(pen => {
      const isIndividual = pen.targetType === "INDIVIDUAL" || !!pen.candidateId;
      if (isIndividual && pen.candidateId && candidateMap.has(pen.candidateId)) {
        const cand = candidateMap.get(pen.candidateId)!;
        cand.individualPenalties += pen.pointsDeducted;
      }
    });

    // Calculate Net Points
    candidateMap.forEach(cand => {
      cand.netPointsPublished = Math.max(0, cand.grossPointsPublished - cand.individualPenalties);
      cand.netPointsTotal = Math.max(0, cand.grossPointsTotal - cand.individualPenalties);
    });

    // Sort all candidates by Net Published Points descending (then Total, then Chest Number)
    const sortedCandidates = Array.from(candidateMap.values()).sort((a, b) => {
      if (b.netPointsPublished !== a.netPointsPublished) {
        return b.netPointsPublished - a.netPointsPublished;
      }
      if (b.netPointsTotal !== a.netPointsTotal) {
        return b.netPointsTotal - a.netPointsTotal;
      }
      const chestA = parseInt(a.chestNumber || "99999", 10);
      const chestB = parseInt(b.chestNumber || "99999", 10);
      if (!isNaN(chestA) && !isNaN(chestB)) return chestA - chestB;
      return a.name.localeCompare(b.name);
    });

    // Assign Overall Ranks with ties
    let currentOverallRank = 1;
    for (let i = 0; i < sortedCandidates.length; i++) {
      if (i > 0 && sortedCandidates[i].netPointsPublished < sortedCandidates[i - 1].netPointsPublished) {
        currentOverallRank = i + 1;
      }
      sortedCandidates[i].overallRank = currentOverallRank;
    }

    // Assign Category Ranks with ties
    const categoryGroups = new Map<string, CandidateStarReport[]>();
    sortedCandidates.forEach(cand => {
      const catKey = (cand.categoryName || "General").toUpperCase();
      if (!categoryGroups.has(catKey)) {
        categoryGroups.set(catKey, []);
      }
      categoryGroups.get(catKey)!.push(cand);
    });

    categoryGroups.forEach(group => {
      let currentCatRank = 1;
      for (let i = 0; i < group.length; i++) {
        if (i > 0 && group[i].netPointsPublished < group[i - 1].netPointsPublished) {
          currentCatRank = i + 1;
        }
        group[i].categoryRank = currentCatRank;
      }
    });

    // ─────────────────────────────────────────────────────────────
    // 2. TEAM CHAMPIONSHIP STANDINGS AGGREGATION
    // ─────────────────────────────────────────────────────────────
    const teamMap = new Map<string, TeamStandingReport>();
    teams.forEach(t => {
      teamMap.set(t.id, {
        id: t.id,
        name: t.name,
        prefixCode: t.prefixCode,
        flagColor: t.flagColor,
        leaderName: t.leaderName,
        candidatesCount: 0,
        individualPoints: 0,
        groupPoints: 0,
        generalPoints: 0,
        grossPoints: 0,
        penaltyPoints: 0,
        netPoints: 0,
        rank: 0,
        categoryBreakdown: {}
      });
    });

    // Candidate count per team
    allCandidates.forEach(c => {
      if (teamMap.has(c.teamId)) {
        teamMap.get(c.teamId)!.candidatesCount += 1;
      }
    });

    // Aggregate team points from all published results
    allResults.forEach(res => {
      if (!res.isPublished) return;
      const teamId = res.teamId || res.candidate?.teamId;
      if (!teamId || !teamMap.has(teamId)) return;

      const team = teamMap.get(teamId)!;
      const pts = res.points || 0;
      team.grossPoints += pts;

      const progType = res.program?.type || "INDIVIDUAL";
      if (progType === "INDIVIDUAL") team.individualPoints += pts;
      else if (progType === "GROUP") team.groupPoints += pts;
      else if (progType === "GENERAL") team.generalPoints += pts;

      const catName = res.program?.category?.name || (progType === "GENERAL" ? "General" : "Other");
      team.categoryBreakdown[catName] = (team.categoryBreakdown[catName] || 0) + pts;
    });

    // Deduct team penalties
    allPenalties.forEach(pen => {
      const isTeamTarget = pen.targetType === "TEAM" || !pen.candidateId;
      if (isTeamTarget && pen.teamId && teamMap.has(pen.teamId)) {
        const team = teamMap.get(pen.teamId)!;
        team.penaltyPoints += pen.pointsDeducted;
      }
    });

    // Calculate net points and sort
    const sortedTeams = Array.from(teamMap.values()).map(t => {
      t.netPoints = Math.max(0, t.grossPoints - t.penaltyPoints);
      return t;
    }).sort((a, b) => b.netPoints - a.netPoints);

    // Assign team ranks
    let currentTeamRank = 1;
    for (let i = 0; i < sortedTeams.length; i++) {
      if (i > 0 && sortedTeams[i].netPoints < sortedTeams[i - 1].netPoints) {
        currentTeamRank = i + 1;
      }
      sortedTeams[i].rank = currentTeamRank;
    }

    // ─────────────────────────────────────────────────────────────
    // 3. MASTER PROGRAM RESULTS REPORT
    // ─────────────────────────────────────────────────────────────
    const programResults: ProgramResultReport[] = allPrograms.map(prog => {
      const hasEvaluated = prog.results.length > 0;
      const isPublished = prog.results.some(r => r.isPublished);

      const winners = prog.results
        .filter(r => (r.rank !== null && r.rank <= 3) || r.points > 0)
        .map(r => ({
          rank: r.rank,
          grade: r.grade,
          points: r.points,
          marks: r.marks,
          candidateName: r.candidate?.name || null,
          chestNumber: r.candidate?.chestNumber || null,
          teamName: r.candidate?.team?.name || r.team?.name || "Participant",
          teamColor: r.candidate?.team?.flagColor || r.team?.flagColor || null
        }));

      return {
        id: prog.id,
        programCode: prog.programCode,
        name: prog.name,
        type: prog.type,
        categoryId: prog.categoryId,
        categoryName: prog.category?.name || (prog.type === "GENERAL" ? "General" : "All"),
        venue: prog.venue,
        startTime: prog.startTime ? new Date(prog.startTime).toISOString() : null,
        duration: prog.duration,
        stageType: prog.stageType,
        candidateLimitPerTeam: prog.candidateLimitPerTeam,
        assignmentsCount: prog.assignments.length,
        resultsCount: prog.results.length,
        isPublished,
        isEvaluated: hasEvaluated,
        winners
      };
    });

    // ─────────────────────────────────────────────────────────────
    // 4. CANDIDATE DIRECTORY & SCHEDULE
    // ─────────────────────────────────────────────────────────────
    const candidateDirectory: CandidateDirectoryItem[] = allCandidates.map(c => ({
      id: c.id,
      name: c.name,
      chestNumber: c.chestNumber || null,
      teamId: c.teamId,
      teamName: c.team?.name || "Independent",
      teamColor: c.team?.flagColor || null,
      categoryId: c.categoryId,
      categoryName: c.category?.name || "General",
      isApproved: c.isApproved,
      programsCount: c.programs.length
    }));

    const schedule: ScheduleReportItem[] = allPrograms.map(p => ({
      id: p.id,
      programCode: p.programCode,
      name: p.name,
      type: p.type,
      categoryName: p.category?.name || (p.type === "GENERAL" ? "General" : "All"),
      venue: p.venue,
      startTime: p.startTime ? new Date(p.startTime).toISOString() : null,
      duration: p.duration,
      stageType: p.stageType,
      enrolledCount: p.assignments.length
    }));

    // Summary Statistics
    const publishedPrograms = allPrograms.filter(p => p.results.some(r => r.isPublished)).length;
    const evaluatedPrograms = allPrograms.filter(p => p.results.length > 0).length;
    const totalPointsAwarded = sortedTeams.reduce((sum, t) => sum + t.grossPoints, 0);

    return {
      success: true,
      data: {
        event: {
          id: event.id,
          name: event.name,
          startDate: event.startDate ? new Date(event.startDate).toISOString() : null,
          endDate: event.endDate ? new Date(event.endDate).toISOString() : null
        },
        festName: settings.festName || event.name,
        festMoto: settings.festMoto || "Festival of Talents",
        festLogo: settings.festLogo || null,
        categories,
        teams: teams.map(t => ({ id: t.id, name: t.name, flagColor: t.flagColor })),
        candidates: sortedCandidates,
        teamsStandings: sortedTeams,
        programResults,
        candidateDirectory,
        schedule,
        stats: {
          totalStudents: allCandidates.length,
          totalTeams: teams.length,
          totalPrograms: allPrograms.length,
          evaluatedPrograms,
          publishedPrograms,
          totalPointsAwarded,
          topStar: sortedCandidates.find(c => c.netPointsPublished > 0) || sortedCandidates[0] || null,
          topTeam: sortedTeams[0] || null
        }
      }
    };
  } catch (error: any) {
    console.error("Failed to fetch reports data:", error);
    return { success: false, error: error.message || "Failed to load reports" };
  }
}
