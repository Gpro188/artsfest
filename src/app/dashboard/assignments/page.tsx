import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AssignmentForm from "./AssignmentForm";
import Link from "next/link";

export default async function AssignmentsPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  let teamId = null;
  let isAssignmentOpen = true;
  let assignmentStatusMessage = "";

  if (session.user.role === "MANAGER") {
    const team = await prisma.team.findUnique({
      where: { managerId: session.user.id },
      include: { event: true }
    });
    if (!team) return <div>You are not assigned to any team.</div>;
    teamId = team.id;

    // Check event-specific assignment window
    const now = new Date();
    const start = team.event.assignmentStart;
    const end = team.event.assignmentEnd;
    
    if (start && now < start) {
      isAssignmentOpen = false;
      assignmentStatusMessage = `Program assignments will open on ${start.toLocaleString()}.`;
    } else if (end && now > end) {
      isAssignmentOpen = false;
      assignmentStatusMessage = `Program assignments closed on ${end.toLocaleString()}.`;
    }
  }

  const eventFilter = session.user.eventId ? { eventId: session.user.eventId } : undefined;

  const whereClause: any = { isApproved: true };
  if (teamId) {
    whereClause.teamId = teamId;
  } else if (session.user.eventId) {
    whereClause.team = {
      OR: [
        { eventId: session.user.eventId },
        { event: { parentId: session.user.eventId } }
      ]
    };
  }

  const candidates = await prisma.candidate.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      chestNumber: true,
      categoryId: true,
      team: { select: { id: true, name: true } },
      category: {
        select: {
          id: true,
          name: true,
          pointMatrix: {
            select: {
              id: true,
              maxIndividualPrograms: true
            }
          }
        }
      },
      programs: {
        select: {
          id: true,
          programId: true,
          program: {
            select: {
              id: true,
              name: true,
              type: true
            }
          }
        }
      }
    }
  });

  const programs = await prisma.program.findMany({
    where: eventFilter,
    include: { 
      event: true,
      category: true
    }
  });

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ marginBottom: 'var(--spacing-xs)' }}>Program Assignments</h1>
        <p className="page-description">
          Enroll approved candidates into competition programs. Category limits and eligibility rules are enforced automatically.
        </p>
      </div>
      
      {candidates.length === 0 ? (
        <div className="glass-panel empty-state-guidance">
          <p style={{ color: 'var(--warning)', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
            No approved candidates found.
          </p>
          <p>Candidates must be registered and approved by the Admin before program assignments can be made.</p>
          {session.user.role === "MANAGER" ? (
            <Link href="/dashboard/candidates" className="empty-state-action">Go to Candidates &rarr;</Link>
          ) : (
            <Link href="/dashboard/candidates" className="empty-state-action">Review Candidates &rarr;</Link>
          )}
        </div>
      ) : (
        <div data-tour="assignments-form" className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Assign Candidates to Programs</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)', fontSize: '0.85rem' }}>
            Select a candidate below to see available programs and make assignments. Validations enforce category rules and entry limits.
          </p>
          <AssignmentForm candidates={candidates as any} programs={programs as any} isAssignmentOpen={isAssignmentOpen} statusMessage={assignmentStatusMessage} />
        </div>
      )}
    </div>
  );
}
