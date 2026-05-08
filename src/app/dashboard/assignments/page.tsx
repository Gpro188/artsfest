import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AssignmentForm from "./AssignmentForm";

export default async function AssignmentsPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  let teamId = null;
  let isAssignmentOpen = true;

  const settings = await prisma.globalSetting.findUnique({ where: { id: "default" } });
  if (session.user.role !== "ADMIN" && settings?.programAssignmentDeadline) {
    isAssignmentOpen = new Date() <= new Date(settings.programAssignmentDeadline);
  }

  if (session.user.role === "MANAGER") {
    const team = await prisma.team.findUnique({
      where: { managerId: session.user.id }
    });
    if (!team) return <div>You are not assigned to any team.</div>;
    teamId = team.id;
  }

  const whereClause = teamId ? { teamId, isApproved: true } : { isApproved: true };

  // Get approved candidates with their category and its point matrix
  const candidates = await prisma.candidate.findMany({
    where: whereClause,
    include: {
      category: { include: { pointMatrix: true } },
      programs: { include: { program: true } }
    }
  });

  // Get all programs with their category info
  const programs = await prisma.program.findMany({
    include: { 
      event: true,
      category: true
    }
  });

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Program Assignments</h1>
      
      {candidates.length === 0 ? (
        <div className="glass-panel" style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
          <p style={{ color: 'var(--warning)', marginBottom: 'var(--spacing-sm)' }}>
            No approved candidates found. Ensure candidates have been approved by the Admin and generated Chest Numbers.
          </p>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Assign Candidates to Programs</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
            Select a candidate to assign them to programs. Validations will automatically enforce category rules and limits.
          </p>
          
          <AssignmentForm candidates={candidates as any} programs={programs as any} isAssignmentOpen={isAssignmentOpen} />
        </div>
      )}
    </div>
  );
}
