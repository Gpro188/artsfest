import { prisma } from "@/lib/prisma";
import Link from "next/link";
import SearchClient from "./SearchClient";
import { getSettings } from "@/lib/settings";
import FestHeader from "../components/FestHeader";
import { getTeamColor } from "@/lib/teamTheme";
import { ArrowRight, Trophy, Calendar, MapPin, Tag } from "lucide-react";

export default async function SearchPage(props: {
  searchParams: Promise<{ 
    q?: string; 
    type?: string; 
    categoryId?: string; 
    stageType?: string; 
    programType?: string;
    eventId?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const eventId = searchParams.eventId || "";
  const settings = await getSettings(eventId);
  const festName = settings.festName || "Arts Fest";
  const query = searchParams.q || "";
  const type = searchParams.type || "chestNumber"; 
  const categoryId = searchParams.categoryId || "";
  const stageType = searchParams.stageType || "";
  const programType = searchParams.programType || "";
  
  // If eventId is provided, filter events dropdown to the main event & its sub-events
  let eventWhere: any = {};
  if (eventId) {
    const targetEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, parentId: true }
    });
    const rootId = targetEvent?.parentId || eventId;
    eventWhere = {
      OR: [
        { id: rootId },
        { parentId: rootId }
      ]
    };
  }

  const rawEvents = await prisma.event.findMany({
    where: eventWhere,
    select: { id: true, name: true, parentId: true },
    orderBy: { createdAt: 'desc' }
  });

  // Deduplicate by name/id
  const seenNames = new Set<string>();
  const events = rawEvents.filter(ev => {
    const key = ev.name.trim().toLowerCase();
    if (seenNames.has(key)) return false;
    seenNames.add(key);
    return true;
  });

  const categories = await prisma.category.findMany({
    where: eventId ? { eventId } : {},
    orderBy: { name: 'asc' }
  });

  let candidateResults: any[] = [];
  let programResults: any[] = [];

  if (query || categoryId || stageType || programType || eventId) {
    if (type === "chestNumber") {
      const candidateWhere: any = {};
      const filters: any[] = [];
      if (query) {
        filters.push({
          OR: [
            { chestNumber: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
            { team: { name: { contains: query, mode: 'insensitive' } } },
            { team: { prefixCode: { contains: query, mode: 'insensitive' } } }
          ]
        });
      }
      if (categoryId) filters.push({ categoryId });
      if (eventId) filters.push({ team: { eventId } });

      if (filters.length > 0) {
        candidateWhere.AND = filters;
      }

      candidateResults = await prisma.candidate.findMany({
        where: candidateWhere,
        include: {
          team: true,
          category: true,
          programs: { 
            where: {
              program: {
                AND: [
                  stageType ? { stageType: stageType as any } : {},
                  programType ? { type: programType as any } : {}
                ]
              }
            },
            include: { program: true } 
          },
          results: {
            include: { program: true }
          }
        }
      });
    } else if (type === "program") {
      const programWhere: any = {};
      const filters: any[] = [];

      if (query) {
        filters.push({
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { programCode: { contains: query, mode: 'insensitive' } }
          ]
        });
      }
      if (categoryId) filters.push({ categoryId });
      if (eventId) filters.push({ eventId });
      if (stageType) filters.push({ stageType: stageType as any });
      if (programType) filters.push({ type: programType as any });

      if (filters.length > 0) {
        programWhere.AND = filters;
      }

      programResults = await prisma.program.findMany({
        where: programWhere,
        include: {
          event: true,
          category: true,
          results: {
            orderBy: { marks: 'desc' },
            include: { candidate: { include: { team: true } } }
          },
          assignments: {
            include: { candidate: { include: { team: true } } }
          }
        }
      });
    }
  }

  const backUrl = eventId ? `/fest/${eventId}/results` : "/";

  return (
    <div className="search-page-root">
      {/* Global Header */}
      <FestHeader 
        festName={festName}
        festMoto={settings.festMoto || "Advanced Search Portal"}
        festLogo={settings.festLogo}
        searchUrl="/search"
        loginUrl="/login"
        backUrl={backUrl}
        backLabel="Dashboard"
      />

      <main className="search-page-main">
        <div className="search-page-container">
          <div className="search-page-heading-block">
            <h2 className="search-page-title font-display">Advanced Programme & Result Search</h2>
            <p className="search-page-sub font-body">
              Search by candidate name, chest number, programme code, or stage filters.
            </p>
          </div>
          
          <SearchClient 
            initialQuery={query} 
            initialType={type} 
            events={events}
            categories={categories}
            initialEventId={eventId}
            initialCategoryId={categoryId}
            initialStageType={stageType}
            initialProgramType={programType}
          />
          
          <div className="search-results-section">
            {type === "chestNumber" && (
              <div>
                {(query || categoryId || eventId) && candidateResults.length === 0 ? (
                  <div className="no-matches-box font-body">
                    No candidates found matching your criteria.
                  </div>
                ) : (
                  <div className="candidates-list-stack">
                    {candidateResults.map(candidate => {
                      const teamColor = getTeamColor(candidate.team?.name, candidate.team?.flagColor);

                      return (
                        <div key={candidate.id} className="candidate-result-card">
                          <div className="candidate-card-header">
                            <div className="candidate-name-col">
                              <h3 className="candidate-name font-display">{candidate.name}</h3>
                              <span className="chest-badge-mono font-mono-num">
                                #{candidate.chestNumber || "N/A"}
                              </span>
                            </div>
                            <div className="candidate-team-badge" style={{ backgroundColor: teamColor }}>
                              {candidate.team?.name} • {candidate.category?.name}
                            </div>
                          </div>

                          <div className="candidate-programs-section">
                            <h4 className="section-label font-body">Schedule & Results</h4>
                            {candidate.programs.length === 0 ? (
                              <div className="empty-programs-msg font-body">
                                No programs matching current filters.
                              </div>
                            ) : (
                              <div className="programs-items-grid">
                                {candidate.programs.map((p: any) => {
                                  const progStartTime = p.program.startTime ? new Date(p.program.startTime) : null;
                                  const hasResult = candidate.results.some((r: any) => r.programId === p.programId);
                                  const matchResult = candidate.results.find((r: any) => r.programId === p.programId);
                                  
                                  return (
                                    <div key={p.id} className="candidate-prog-item">
                                      <div className="prog-item-info">
                                        <div className="prog-item-title-row">
                                          <Link href={`/results/${p.program.id}`} className="prog-item-title font-display">
                                            {p.program.name}
                                          </Link>
                                          <span className={`status-pill ${hasResult ? 'status-entered' : 'status-upcoming'}`}>
                                            {hasResult ? 'RESULT ENTERED' : 'UPCOMING'}
                                          </span>
                                        </div>
                                        <div className="prog-item-meta font-body">
                                          {progStartTime ? (
                                            <span>
                                              {progStartTime.toLocaleDateString()} • {progStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                          ) : 'Time TBD'} 
                                          {p.program.venue ? ` @ ${p.program.venue}` : ''}
                                          {p.slotNumber && ` • Slot #${p.slotNumber}`}
                                        </div>
                                      </div>

                                      {matchResult && (
                                        <div className="prog-item-score-col">
                                          {matchResult.rank && (
                                            <div className="prog-rank-chip font-mono-num">
                                              Rank #{matchResult.rank}
                                            </div>
                                          )}
                                          {matchResult.points !== undefined && (
                                            <div className="prog-pts-chip font-mono-num">
                                              +{matchResult.points} pts
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {type === "program" && (
              <div>
                {(query || categoryId || eventId || stageType || programType) && programResults.length === 0 ? (
                  <div className="no-matches-box font-body">
                    No programs found matching your criteria.
                  </div>
                ) : (
                  <div className="programs-list-stack">
                    {programResults.map(program => (
                      <div key={program.id} className="program-search-card">
                        <div className="prog-card-head">
                          <Link href={`/results/${program.id}`} className="prog-card-link">
                            <h3 className="prog-card-title font-display">
                              {program.name} 
                              {program.category && (
                                <span className="prog-category-badge font-body">({program.category.name})</span>
                              )}
                            </h3>
                          </Link>

                          <Link href={`/results/${program.id}`} className="view-board-cta font-body">
                            <span>View Full Board</span>
                            <ArrowRight size={14} />
                          </Link>
                        </div>

                        <div className="prog-card-meta font-body">
                          <span>{program.event?.name}</span> • 
                          <span>{program.type}</span> • 
                          <span>{program.stageType}</span>
                          {program.startTime && ` • ${new Date(program.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          {program.venue && ` @ ${program.venue}`}
                        </div>
                        
                        {program.results.length > 0 && (
                          <div className="prog-winners-mini-table">
                            {program.results.slice(0, 3).map((res: any) => {
                              const teamColor = getTeamColor(res.candidate?.team?.name, res.candidate?.team?.flagColor);
                              return (
                                <div key={res.id} className="mini-winner-row">
                                  <div className="mini-winner-rank font-mono-num">
                                    {res.rank ? `Rank #${res.rank}` : res.grade ? `Grade ${res.grade}` : 'Award'}
                                  </div>
                                  <div className="mini-winner-name font-display">
                                    {res.candidate?.name}
                                    {res.candidate?.chestNumber && (
                                      <span className="mini-chest font-mono-num"> ({res.candidate.chestNumber})</span>
                                    )}
                                  </div>
                                  <div className="mini-winner-team font-body" style={{ color: teamColor }}>
                                    {res.candidate?.team?.name}
                                  </div>
                                  <div className="mini-winner-pts font-mono-num">
                                    +{res.points} pts
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="search-page-footer">
        <div className="search-page-container">
          <p className="font-body">&copy; {new Date().getFullYear()} {festName} • Search System</p>
        </div>
      </footer>

      <style>{`
        .search-page-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: var(--bg);
          color: var(--text);
          font-family: var(--font-body);
          overflow-x: hidden;
        }

        .search-page-main {
          flex: 1;
          padding: 2rem 0 3.5rem 0;
          container-type: inline-size;
          container-name: fest-shell;
        }

        .search-page-container {
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 1.25rem;
        }

        .search-page-heading-block {
          text-align: center;
          margin-bottom: 2rem;
        }

        .search-page-title {
          font-size: 2.2rem;
          font-weight: 800;
          color: var(--ink);
          margin: 0 0 0.4rem 0;
        }

        .search-page-sub {
          font-size: 0.95rem;
          color: var(--muted);
          margin: 0;
        }

        .search-results-section {
          margin-top: 2rem;
        }

        .no-matches-box {
          background: var(--surface);
          border: 1px dashed var(--border);
          border-radius: var(--radius);
          padding: 3rem 1.5rem;
          text-align: center;
          color: var(--muted);
        }

        .candidates-list-stack,
        .programs-list-stack {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .candidate-result-card,
        .program-search-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.5rem;
          box-shadow: var(--shadow-sm);
        }

        .candidate-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border);
          padding-bottom: 1rem;
          margin-bottom: 1rem;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .candidate-name-col {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .candidate-name {
          margin: 0;
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--text);
        }

        .chest-badge-mono {
          background: var(--bg);
          border: 1px solid var(--border);
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--muted);
        }

        .candidate-team-badge {
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          color: #ffffff;
          font-weight: 700;
          font-size: 0.8rem;
        }

        .section-label {
          font-size: 0.82rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted);
          margin: 0 0 0.75rem 0;
        }

        .programs-items-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .candidate-prog-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.85rem 1rem;
          background: var(--bg);
          border-radius: 10px;
          border: 1px solid var(--border);
          gap: 12px;
        }

        .prog-item-info {
          min-width: 0;
          flex: 1;
        }

        .prog-item-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .prog-item-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text);
          text-decoration: none;
        }

        .prog-item-title:hover {
          color: var(--indigo);
        }

        .status-pill {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 9999px;
          letter-spacing: 0.04em;
        }

        .status-entered {
          background: rgba(30, 122, 91, 0.12);
          color: var(--emerald);
          border: 1px solid rgba(30, 122, 91, 0.3);
        }

        .status-upcoming {
          background: rgba(75, 79, 158, 0.1);
          color: var(--indigo);
          border: 1px solid rgba(75, 79, 158, 0.3);
        }

        .prog-item-meta {
          font-size: 0.78rem;
          color: var(--muted);
          margin-top: 2px;
        }

        .prog-item-score-col {
          text-align: right;
          flex-shrink: 0;
        }

        .prog-rank-chip {
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--gold-ink);
        }

        .prog-pts-chip {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--emerald);
        }

        /* Program Search Card */
        .prog-card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 0.4rem;
        }

        .prog-card-link {
          text-decoration: none;
          color: inherit;
        }

        .prog-card-title {
          margin: 0;
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--text);
        }

        .prog-card-title:hover {
          color: var(--indigo);
        }

        .prog-category-badge {
          font-size: 0.85rem;
          color: var(--muted);
          font-weight: 500;
          margin-left: 6px;
        }

        .view-board-cta {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: var(--indigo);
          font-weight: 700;
          font-size: 0.85rem;
          text-decoration: none;
          white-space: nowrap;
        }

        .view-board-cta:hover {
          text-decoration: underline;
        }

        .prog-card-meta {
          font-size: 0.82rem;
          color: var(--muted);
          margin-bottom: 1rem;
        }

        .prog-winners-mini-table {
          display: flex;
          flex-direction: column;
          gap: 6px;
          background: var(--bg);
          border-radius: 10px;
          padding: 0.75rem;
          border: 1px solid var(--border);
        }

        .mini-winner-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.85rem;
          gap: 8px;
        }

        .mini-winner-rank {
          font-weight: 800;
          color: var(--gold-ink);
          width: 80px;
        }

        .mini-winner-name {
          flex: 1;
          font-weight: 700;
          color: var(--text);
        }

        .mini-chest {
          color: var(--muted);
          font-size: 0.78rem;
        }

        .mini-winner-team {
          font-weight: 600;
          font-size: 0.8rem;
        }

        .mini-winner-pts {
          font-weight: 800;
          color: var(--emerald);
        }

        .search-page-footer {
          padding: 2.5rem 0;
          border-top: 1px solid var(--border);
          text-align: center;
          color: var(--muted);
          background-color: var(--surface);
          font-size: 0.85rem;
        }

        @container fest-shell (max-width: 600px) {
          .search-page-title {
            font-size: 1.6rem;
          }
          .candidate-card-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .prog-card-head {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
