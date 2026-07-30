import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CandidateForm from "./CandidateForm";
import CandidateList from "./CandidateList";
import CandidateFilter from "./CandidateFilter";

export default async function CandidatesPage(props: { searchParams: Promise<{ teamId?: string, categoryId?: string }> }) {
  const searchParams = await props.searchParams;
  const session = await getServerSession(authOptions);
  const { teamId: filterTeamId, categoryId: filterCategoryId } = searchParams;

  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  let userTeamId = null;
  let categories: any[] = [];
  let teams: any[] = [];
  let isRegistrationOpen = true;
  let registrationStatusMessage = "";

  const eventFilter = session.user.eventId ? { eventId: session.user.eventId } : undefined;

  const [allTeams, allCategories] = await Promise.all([
    session.user.role === "ADMIN" ? prisma.team.findMany({ where: eventFilter, select: { id: true, name: true }, orderBy: { name: 'asc' } }) : Promise.resolve([]),
    session.user.role === "ADMIN" ? prisma.category.findMany({ where: eventFilter, select: { id: true, name: true }, orderBy: { name: 'asc' } }) : Promise.resolve([])
  ]);

  if (session.user.role === "MANAGER") {
    const team = await prisma.team.findUnique({
      where: { managerId: session.user.id },
      include: { event: { include: { categories: true } } }
    });
    if (!team) {
      return <div>You are not assigned to any team.</div>;
    }
    userTeamId = team.id;
    categories = team.event.categories;
    
    // Check event-specific registration window
    const now = new Date();
    const start = team.event.registrationStart;
    const end = team.event.registrationEnd;
    
    if (start && now < start) {
      isRegistrationOpen = false;
      registrationStatusMessage = `Registration will open on ${start.toLocaleString()}.`;
    } else if (end && now > end) {
      isRegistrationOpen = false;
      registrationStatusMessage = `Registration closed on ${end.toLocaleString()}.`;
    }
  } else {
    categories = allCategories;
    teams = allTeams;
  }

  // Define where clause scoped by eventId and role
  const whereClause: any = {};
  if (session.user.role === "MANAGER") {
    whereClause.teamId = userTeamId;
  } else {
    // If Admin has an eventId assigned, scope candidates to that event
    if (session.user.eventId) {
      whereClause.team = { eventId: session.user.eventId };
    }
    if (filterTeamId) whereClause.teamId = filterTeamId;
  }
  
  if (filterCategoryId) whereClause.categoryId = filterCategoryId;

  const candidates = await prisma.candidate.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      chestNumber: true,
      photo: true,
      createdAt: true,
      team: { select: { id: true, name: true, flagColor: true, event: { select: { name: true } } } },
      category: { select: { id: true, name: true } },
      _count: {
        select: { programs: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ marginBottom: 'var(--spacing-xs)' }}>Candidates Management</h1>
        <p className="page-description">
          Register and approve candidates for competition. Managers add candidates to their team; Admins review, approve, and assign chest numbers.
        </p>
      </div>
      
      {/* Add Candidate Form (Available to Managers and Admins) */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <div data-tour="candidates-form" className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Add Candidate {session.user.role === "ADMIN" && "(Admin Direct Add)"}</h3>
          {categories.length === 0 ? (
            <p style={{ color: 'var(--warning)' }}>No categories created for this event. Please add categories in Settings or Categories setup first.</p>
          ) : session.user.role === "MANAGER" ? (
            userTeamId ? (
              <CandidateForm teamId={userTeamId} categories={categories} isRegistrationOpen={isRegistrationOpen} statusMessage={registrationStatusMessage} />
            ) : (
              <p style={{ color: 'var(--warning)' }}>You are not assigned to any team.</p>
            )
          ) : (
            <CandidateForm teams={teams} categories={categories} isAdmin={true} />
          )}
        </div>
      </div>

      <div data-tour="candidates-list" className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
          <div>
            <h3 style={{ margin: 0 }}>Candidate List</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Showing {candidates.length} candidates</p>
          </div>
          <div data-tour="candidates-filters" style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
             <CandidateFilter 
                teams={teams} 
                categories={categories} 
                currentTeamId={filterTeamId} 
                currentCategoryId={filterCategoryId}
                showTeamFilter={session.user.role === "ADMIN"}
             />
            <a href="/print/candidates" target="_blank" className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
              Print List
            </a>
            <a 
              data-tour="candidates-idcards"
              href={`/print/id-cards?${session.user.role === "MANAGER" ? `teamId=${userTeamId}` : (filterTeamId ? `teamId=${filterTeamId}` : '')}${filterCategoryId ? `&categoryId=${filterCategoryId}` : ''}`} 
              target="_blank" 
              className="btn btn-primary" 
              style={{ padding: '0.4rem 1rem', fontSize: '0.875rem', backgroundColor: 'var(--primary)', color: 'white' }}
            >
              Bulk ID Cards
            </a>
          </div>
        </div>
        <CandidateList candidates={candidates as any} role={session.user.role} categories={categories} />
      </div>
    </div>
  );
}
