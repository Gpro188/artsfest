import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ScoringForm from "./ScoringForm";
import ResultList from "./ResultList";
import TeamScorePreview from "./TeamScorePreview";
import ExcelExport from "./ExcelExport";
import PendingProgramsList from "./PendingProgramsList";

export default async function ScoringPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "JUDGE" && session.user.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  const events = await prisma.event.findMany({
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
    },
    orderBy: { createdAt: 'desc' }
  });

  const results = await prisma.result.findMany({
    include: {
      candidate: { include: { team: true, category: true } },
      team: true,
      program: { include: { category: true, event: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 500 
  });

  // Find programs with no results but have assignments
  const allPrograms = await prisma.program.findMany({
    where: {
      assignments: { some: {} } // Has at least one candidate assigned
    },
    include: {
      results: true,
      category: true,
      _count: { select: { assignments: true } }
    }
  });

  const pendingPrograms = allPrograms.filter(p => p.results.length === 0);

  // Calculate Team Scores
  const allTeams = await prisma.team.findMany({
    include: {
      candidates: {
        include: { results: true }
      },
      results: true
    }
  });

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ margin: 0 }}>Live Scoring & Results Hub</h1>
        <ExcelExport results={results} />
      </div>
      
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
              <ScoringForm events={events} />
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
                Programs with assignments but no results recorded.
              </p>
              <PendingProgramsList programs={pendingPrograms} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
