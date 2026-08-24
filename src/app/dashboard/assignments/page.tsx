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
      team: {
        select: {
          id: true,
          name: true,
          eventId: true,
          event: {
            select: {
              id: true,
              parentId: true
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

  let programWhere: any = undefined;
  if (session.user.role === "MANAGER" && teamId) {
    const team = await prisma.team.findUnique({ where: { id: teamId }, include: { event: true } });
    if (team) {
      const parentId = team.event.parentId || team.eventId;
      programWhere = {
        OR: [
          { eventId: parentId },
          { event: { parentId: parentId } }
        ]
      };
    }
  } else if (session.user.eventId) {
    programWhere = {
      OR: [
        { eventId: session.user.eventId },
        { event: { parentId: session.user.eventId } }
      ]
    };
  }

  let teamsWhere: any = undefined;
  if (teamId) {
    teamsWhere = { id: teamId };
  } else if (session.user.eventId) {
    teamsWhere = {
      OR: [
        { eventId: session.user.eventId },
        { event: { parentId: session.user.eventId } }
      ]
    };
  }

  const teams = await prisma.team.findMany({
    where: teamsWhere,
    select: { id: true, name: true, prefixCode: true, flagColor: true, eventId: true },
    orderBy: { name: 'asc' }
  });

  const programs = await prisma.program.findMany({
    where: programWhere,
    include: { 
      event: true,
      category: true,
      assignments: {
        select: {
          id: true,
          candidateId: true,
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
  });

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ marginBottom: 'var(--spacing-xs)' }}>Program Assignments</h1>
        <p className="page-description">
          Enroll approved candidates into competition programs. Assign individually or manage group sessions and squads.
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
          <AssignmentForm 
            candidates={candidates as any} 
            programs={programs as any} 
            teams={teams as any}
            userRole={session.user.role}
            userTeamId={teamId}
            isAssignmentOpen={isAssignmentOpen} 
            statusMessage={assignmentStatusMessage} 
          />
        </div>
      )}
    </div>
  );
}
