import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ScoringForm from "./ScoringForm";
import ResultList from "./ResultList";
import TeamScorePreview from "./TeamScorePreview";
import ExcelExport from "./ExcelExport";
import PendingProgramsList from "./PendingProgramsList";
import EventSwitcher from "@/app/components/EventSwitcher";

export default async function ScoringPage(props: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "JUDGE" && session.user.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  const events = await prisma.event.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const activeEventId = searchParams.eventId || events[0]?.id;

  if (!activeEventId) {
    return (
        <div className="animate-fade-in" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
            <h2>No Events Found</h2>
            <p>Create an event first to manage scoring.</p>
        </div>
    );
  }

  const activeEvent = await prisma.event.findUnique({
    where: { id: activeEventId },
    include: {
      generalPointMatrix: true,
      programs: { 
        include: { 
          category: {
            include: { pointMatrix: true }
          },
          assignments: {
            include: {
              candidate: {
                include: { team: true }
              }
            }
          }
        } 
      },
      teams: true
    }
  });

  if (!activeEvent) redirect("/dashboard/scoring");

  // Fetch results, pending programs, and teams in PARALLEL
  const [results, allPrograms, allTeams] = await Promise.all([
    prisma.result.findMany({
      where: { program: { eventId: activeEventId } },
      select: {
        id: true,
        points: true,
        rank: true,
        grade: true,
        isPublished: true,
        candidateId: true,
        teamId: true,
        programId: true,
        createdAt: true,
        candidate: { select: { name: true, chestNumber: true, team: { select: { name: true, flagColor: true } }, category: { select: { name: true } } } },
        team: { select: { name: true, flagColor: true } },
        program: { select: { id: true, name: true, category: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      take: 200 // Limit to 200 for speed
    }),
    prisma.program.findMany({
      where: { eventId: activeEventId, assignments: { some: {} } },
      select: {
        id: true,
        name: true,
        results: { select: { id: true } },
        category: { select: { name: true } },
        _count: { select: { assignments: true } }
      }
    }),
    prisma.team.findMany({
      where: { eventId: activeEventId },
      select: {
        id: true,
        name: true,
        flagColor: true,
        candidates: {
            select: {
                results: { select: { points: true, isPublished: true } }
            }
        },
        results: { select: { points: true, isPublished: true } }
      }
    })
  ]);

  const pendingPrograms = allPrograms.filter(p => p.results.length === 0);

  const teamScores = allTeams.map(team => {
    let publishedPoints = 0;
    let totalPoints = 0;

    // Add individual points
    team.candidates.forEach(candidate => {
      candidate.results.forEach(result => {
        totalPoints += result.points;
        if (result.isPublished) {
          publishedPoints += result.points;
        }
      });
    });

    // Add group/general points
    team.results.forEach(result => {
      totalPoints += result.points;
      if (result.isPublished) {
        publishedPoints += result.points;
      }
    });

    return {
      id: team.id,
      name: team.name,
      flagColor: team.flagColor,
      publishedPoints,
      totalPoints
    };
  });

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
        <h1 style={{ margin: 0 }}>Live Scoring & Results Hub</h1>
        <ExcelExport results={results} />
      </div>

      <EventSwitcher events={events} activeEventId={activeEventId} />
      
      {events.length === 0 ? (
        <div className="glass-panel" style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
          <p style={{ color: 'var(--warning)', marginBottom: 'var(--spacing-sm)' }}>
            No events available.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2.8fr 1.2fr', gap: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {/* Primary Entry Area */}
            <div className="glass-panel" style={{ padding: 'var(--spacing-xl)', border: '1px solid var(--primary)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: 'var(--primary)' }}></div>
              <h2 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                 🎯 Rapid Result Entry
              </h2>
              <ScoringForm events={[activeEvent]} />
            </div>

            {/* Results Management Section */}
            <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--secondary)' }}>📋 Results Management Hub</h3>
              <ResultList results={results as any} role={session.user.role} />
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <TeamScorePreview scores={teamScores} />
            
            <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Pending Entries
                <span style={{ fontSize: '0.8rem', backgroundColor: 'var(--error)', color: 'white', padding: '2px 8px', borderRadius: '10px' }}>{pendingPrograms.length}</span>
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                Programs with assignments but no results recorded for <strong>{activeEvent.name}</strong>.
              </p>
              <PendingProgramsList programs={pendingPrograms} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
