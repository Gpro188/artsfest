import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TeamForm from "./TeamForm";
import TeamList from "./TeamList";
import Link from "next/link";

export default async function TeamsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const events = await prisma.event.findMany({
    where: { parentId: session.user.eventId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, createdAt: true }
  });

  const teams = await prisma.team.findMany({
    where: { event: { parentId: session.user.eventId } },
    include: {
      event: true,
      manager: true,
      _count: {
        select: { candidates: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ marginBottom: 'var(--spacing-xs)' }}>Teams Management</h1>
        <p className="page-description">
          Manage participating teams. Assign managers, set flag colors, and define prefix codes used for chest number generation.
        </p>
      </div>
      
      {events.length === 0 ? (
        <div className="glass-panel empty-state-guidance">
          <p style={{ color: 'var(--warning)', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
            No events found.
          </p>
          <p>Events are the foundation of your festival. Create an event first, then come back to add participating teams.</p>
          <Link href="/dashboard/events" className="empty-state-action">Go to Events &rarr;</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--spacing-lg)' }}>
          <div>
            <div data-tour="teams-form" className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Create New Team</h3>
              <TeamForm events={events} />
            </div>
          </div>
          
          <div>
            <div data-tour="teams-list" className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>All Teams</h3>
              <TeamList teams={teams} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
