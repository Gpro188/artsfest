import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import CandidateForm from "./CandidateForm";
import CandidateList from "./CandidateList";
import CandidateFilter from "./CandidateFilter";

const prisma = new PrismaClient();

export default async function CandidatesPage({ searchParams }: { searchParams: Promise<{ teamId?: string, categoryId?: string }> }) {
  const session = await getServerSession(authOptions);
  const { teamId: filterTeamId, categoryId: filterCategoryId } = await searchParams;

  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  let userTeamId = null;
  let categories: any[] = [];
  let teams: any[] = [];
  let isRegistrationOpen = true;

  const settings = await prisma.globalSetting.findUnique({ where: { id: "default" } });
  if (session.user.role !== "ADMIN" && settings?.candidateRegistrationDeadline) {
    isRegistrationOpen = new Date() <= new Date(settings.candidateRegistrationDeadline);
  }

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
  } else {
    categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    teams = await prisma.team.findMany({ orderBy: { name: 'asc' } });
  }

  // Define where clause
  const whereClause: any = {};
  if (session.user.role === "MANAGER") {
    whereClause.teamId = userTeamId;
  } else {
    if (filterTeamId) whereClause.teamId = filterTeamId;
  }
  
  if (filterCategoryId) whereClause.categoryId = filterCategoryId;

  const candidates = await prisma.candidate.findMany({
    where: whereClause,
    include: {
      team: { include: { event: true } },
      category: true,
      _count: {
        select: { programs: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Candidates Management</h1>
      
      {session.user.role === "MANAGER" && userTeamId && (
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Add Candidate</h3>
            {categories.length === 0 ? (
              <p style={{ color: 'var(--warning)' }}>No categories created for this event. Please ask Admin to add categories.</p>
            ) : (
              <CandidateForm teamId={userTeamId} categories={categories} isRegistrationOpen={isRegistrationOpen} />
            )}
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
          <div>
            <h3 style={{ margin: 0 }}>Candidate List</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Showing {candidates.length} candidates</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
             <CandidateFilter 
                teams={teams} 
                categories={categories} 
                currentTeamId={filterTeamId} 
                currentCategoryId={filterCategoryId}
                showTeamFilter={session.user.role === "ADMIN"}
             />
            <a href="/print/candidates" target="_blank" className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
              🖨️ Print List
            </a>
            <a 
              href={`/print/id-cards?${session.user.role === "MANAGER" ? `teamId=${userTeamId}` : (filterTeamId ? `teamId=${filterTeamId}` : '')}${filterCategoryId ? `&categoryId=${filterCategoryId}` : ''}`} 
              target="_blank" 
              className="btn btn-primary" 
              style={{ padding: '0.4rem 1rem', fontSize: '0.875rem', backgroundColor: 'var(--primary)', color: 'white' }}
            >
              🆔 Bulk ID Cards
            </a>
          </div>
        </div>
        <CandidateList candidates={candidates as any} role={session.user.role} categories={categories} />
      </div>
    </div>
  );
}
