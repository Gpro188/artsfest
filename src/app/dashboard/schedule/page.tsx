import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminScheduler from "./AdminScheduler";
import ManagerScheduler from "./ManagerScheduler";

export default async function SchedulePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { role, id: userId } = session.user;

  if (role === "ADMIN") {
    const programs = await prisma.program.findMany({
      include: {
        event: true,
        category: true,
        _count: { select: { assignments: true } },
        assignments: {
          include: {
            candidate: { include: { team: true } }
          }
        }
      },
      orderBy: { startTime: 'asc' }
    });

    return (
      <div className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <h1 style={{ margin: 0 }}>Global Festival Schedule</h1>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <a href="/print/schedule" target="_blank" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
              🖨️ Print Schedule
            </a>
            <a href="/print/venue" target="_blank" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
              🖨️ Print Venue List
            </a>
          </div>
        </div>
        <AdminScheduler initialPrograms={programs as any} eventId={programs[0]?.eventId || "default"} />
      </div>
    );
  }

  if (role === "MANAGER") {
    const team = await prisma.team.findUnique({
      where: { managerId: userId }
    });

    if (!team) return <div>You are not assigned to any team.</div>;

    // Fetch all programs of the event
    const programs = await prisma.program.findMany({
      where: { eventId: team.eventId },
      include: {
        category: true,
        assignments: {
          where: { candidate: { teamId: team.id } },
          include: { candidate: true }
        }
      },
      orderBy: { startTime: 'asc' }
    });

    return (
      <div className="animate-fade-in">
        <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Team Festival Schedule</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
          View all programs and track your team's assignments.
        </p>
        <ManagerScheduler initialPrograms={programs as any} teamId={team.id} />
      </div>
    );
  }

  redirect("/dashboard");
}
