import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getFestivalEventIds } from "@/lib/eventScope";
import ScoringHubSessions from "./ScoringHubSessions";
import ResultsExportPrintBar from "./ResultsExportPrintBar";
import EventSwitcher from "@/app/components/EventSwitcher";

export default async function ScoringPage(props: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "JUDGE" && session.user.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  // Scope events strictly to logged in Admin's main event and its sub-events
  const userEventId = session.user.eventId;
  const eventWhere: any = userEventId ? {
    OR: [
      { id: userEventId },
      { parentId: userEventId }
    ]
  } : {};

  const rawEvents = await prisma.event.findMany({
    where: eventWhere,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, createdAt: true, parentId: true }
  });

  // Sort rawEvents so the user's root eventId comes first
  const sortedRawEvents = [...rawEvents].sort((a, b) => {
    if (a.id === userEventId) return -1;
    if (b.id === userEventId) return 1;
    if (!a.parentId && b.parentId) return -1;
    if (a.parentId && !b.parentId) return 1;
    return 0;
  });

  // Deduplicate events by normalized name to prevent duplicate event switcher tabs
  const seenEventNames = new Set<string>();
  const events = sortedRawEvents.filter(ev => {
    const key = ev.name.trim().toLowerCase();
    if (seenEventNames.has(key)) return false;
    seenEventNames.add(key);
    return true;
  });

  const activeEventId = (searchParams.eventId && events.some(e => e.id === searchParams.eventId)) 
    ? searchParams.eventId 
    : events[0]?.id;

  if (!activeEventId) {
    return (
        <div className="animate-fade-in" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
            <h2>No Events Found</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
              Create an event and add programs with candidate assignments to begin scoring.
            </p>
            <a href="/dashboard/events" className="btn btn-primary">Go to Events</a>
        </div>
    );
  }

  // Fetch all related festival event IDs (root event + any sub-events)
  const festEventIds = await getFestivalEventIds(activeEventId);

  const [
    dbEvent,
    festGeneralPointMatrix,
    allFestCategories,
    allFestTeams,
    programsInScope,
    results,
    allPrograms,
    allResultsForScore,
    teamPenalties,
    allFestCandidates
  ] = await Promise.all([
    prisma.event.findUnique({
      where: { id: activeEventId },
      select: {
        id: true,
        name: true,
        globalSetting: {
          select: {
            penaltyRules: true
          }
        },
        generalPointMatrix: {
          select: {
            id: true,
            generalPoints: true
          }
        }
      }
    }),
    prisma.pointMatrix.findFirst({
      where: {
        eventId: { in: festEventIds },
        generalPoints: { not: null }
      },
      select: {
        id: true,
        generalPoints: true
      }
    }),
    prisma.category.findMany({
      where: { eventId: { in: festEventIds } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    }),
    prisma.team.findMany({
      where: { eventId: { in: festEventIds } },
      select: {
        id: true,
        name: true,
        flagColor: true
      },
      orderBy: { name: 'asc' }
    }),
    prisma.program.findMany({
      where: { eventId: { in: festEventIds } },
      select: {
        id: true,
        name: true,
        type: true,
        categoryId: true,
        teamsAllowed: true,
        membersPerSquad: true,
        event: {
          select: {
            id: true,
            name: true,
            generalPointMatrix: {
              select: {
                id: true,
                generalPoints: true
              }
            }
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            pointMatrix: {
              select: {
                id: true,
                individualPoints: true,
                groupPoints: true,
                generalPoints: true
              }
            }
          }
        },
        results: {
          select: {
            id: true,
            candidateId: true,
            teamId: true,
            slotNumber: true,
            marks: true,
            rank: true,
            grade: true,
            points: true,
            status: true
          }
        },
        assignments: {
          select: {
            id: true,
            slotNumber: true,
            candidate: {
              select: {
                id: true,
                name: true,
                chestNumber: true,
                teamId: true,
                team: {
                  select: {
                    id: true,
                    name: true,
                    flagColor: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    }),
    prisma.result.findMany({
      where: { program: { eventId: { in: festEventIds } } },
      select: {
        id: true,
        marks: true,
        points: true,
        rank: true,
        grade: true,
        status: true,
        penaltyMarks: true,
        penaltyReason: true,
        penaltyTarget: true,
        penaltyDescription: true,
        isPublished: true,
        candidateId: true,
        teamId: true,
        slotNumber: true,
        programId: true,
        createdAt: true,
        candidate: { select: { name: true, chestNumber: true, categoryId: true, team: { select: { name: true, flagColor: true } }, category: { select: { name: true } } } },
        team: { select: { name: true, flagColor: true } },
        program: {
          select: {
            id: true,
            name: true,
            type: true,
            categoryId: true,
            category: { select: { name: true } },
            assignments: {
              select: {
                slotNumber: true,
                candidate: {
                  select: {
                    id: true,
                    name: true,
                    chestNumber: true,
                    teamId: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.program.findMany({
      where: { eventId: { in: festEventIds }, assignments: { some: {} } },
      select: {
        id: true,
        name: true,
        results: { select: { id: true } },
        category: { select: { name: true } },
        _count: { select: { assignments: true } }
      }
    }),
    prisma.result.findMany({
      where: { program: { eventId: { in: festEventIds } } },
      select: {
        points: true,
        isPublished: true,
        teamId: true,
        candidate: { select: { teamId: true } }
      }
    }),
    prisma.teamPenalty.findMany({
      where: { eventId: { in: festEventIds } },
      select: {
        id: true,
        eventId: true,
        teamId: true,
        targetType: true,
        candidateId: true,
        pointsDeducted: true,
        reason: true,
        description: true,
        createdAt: true,
        team: {
          select: {
            name: true,
            flagColor: true
          }
        },
        candidate: {
          select: {
            name: true,
            chestNumber: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.candidate.findMany({
      where: { team: { eventId: { in: festEventIds } } },
      select: {
        id: true,
        name: true,
        chestNumber: true,
        teamId: true,
        team: {
          select: {
            name: true,
            flagColor: true
          }
        }
      },
      orderBy: { chestNumber: 'asc' }
    })
  ]);

  if (!dbEvent) redirect("/dashboard/scoring");

  // Deduplicate categories by normalized name for display
  const seenCatNames = new Set<string>();
  const eventCategories = allFestCategories.filter(cat => {
    const key = cat.name.trim().toUpperCase();
    if (seenCatNames.has(key)) return false;
    seenCatNames.add(key);
    return true;
  });

  // Construct unified activeEvent with all programs and teams across the festival
  const activeEvent = {
    ...dbEvent,
    penaltyRules: dbEvent.globalSetting?.penaltyRules || null,
    generalPointMatrix: dbEvent.generalPointMatrix || festGeneralPointMatrix,
    teams: allFestTeams,
    programs: programsInScope
  };

  const pendingPrograms = allPrograms.filter(p => p.results.length === 0);

  const teamScoresMap: Record<string, { publishedPoints: number, totalPoints: number }> = {};
  const eventTeams = activeEvent.teams || [];
  eventTeams.forEach(team => {
    teamScoresMap[team.id] = { publishedPoints: 0, totalPoints: 0 };
  });

  allResultsForScore.forEach(result => {
    const teamId = result.teamId || result.candidate?.teamId;
    if (teamId && teamScoresMap[teamId]) {
      teamScoresMap[teamId].totalPoints += result.points;
      if (result.isPublished) {
        teamScoresMap[teamId].publishedPoints += result.points;
      }
    }
  });

  // Deduct team penalties from live and draft standings (only if targetType is TEAM or legacy)
  teamPenalties.forEach(pen => {
    const isTeamTarget = pen.targetType === "TEAM" || !pen.candidateId;
    if (isTeamTarget && pen.teamId && teamScoresMap[pen.teamId]) {
      teamScoresMap[pen.teamId].totalPoints = Math.max(0, teamScoresMap[pen.teamId].totalPoints - pen.pointsDeducted);
      teamScoresMap[pen.teamId].publishedPoints = Math.max(0, teamScoresMap[pen.teamId].publishedPoints - pen.pointsDeducted);
    }
  });

  const teamScores = eventTeams.map(team => ({
    id: team.id,
    name: team.name,
    flagColor: team.flagColor,
    publishedPoints: teamScoresMap[team.id]?.publishedPoints || 0,
    totalPoints: teamScoresMap[team.id]?.totalPoints || 0
  }));

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
        <div>
          <h1 style={{ margin: '0 0 var(--spacing-xs) 0' }}>Live Scoring & Results Hub</h1>
          <p className="page-description" style={{ marginBottom: 0 }}>
            Enter marks, assign ranks and grades, calculate points, and manage total penalty marks for live standings.
          </p>
        </div>
      </div>

      <div data-tour="scoring-switcher">
        <EventSwitcher events={events} activeEventId={activeEventId} />
      </div>

      {/* Filterable Print & Excel Export Bar */}
      <ResultsExportPrintBar
        eventId={activeEventId}
        eventName={activeEvent.name}
        categories={eventCategories}
        results={results}
      />
      
      {events.length === 0 ? (
        <div className="glass-panel" style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
          <p style={{ color: 'var(--warning)', marginBottom: 'var(--spacing-sm)' }}>
            No events available.
          </p>
        </div>
      ) : (
        <ScoringHubSessions
          activeEvent={activeEvent}
          eventId={activeEventId}
          results={results}
          teamScores={teamScores}
          pendingPrograms={pendingPrograms}
          role={session.user.role}
          candidates={allFestCandidates}
          teamPenalties={teamPenalties}
          committeeRulesJson={activeEvent.penaltyRules}
        />
      )}
    </div>
  );
}
