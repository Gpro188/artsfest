import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import TeamForm from "./TeamForm";
import TeamList from "./TeamList";

const prisma = new PrismaClient();

export default async function TeamsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const events = await prisma.event.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const teams = await prisma.team.findMany({
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
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Teams Management</h1>
      
      {events.length === 0 ? (
        <div className="glass-panel" style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
          <p style={{ color: 'var(--warning)', marginBottom: 'var(--spacing-sm)' }}>
            You need to create an Event first before creating Teams.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--spacing-lg)' }}>
          <div>
            <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Create New Team</h3>
              <TeamForm events={events} />
            </div>
          </div>
          
          <div>
            <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>All Teams</h3>
              <TeamList teams={teams} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
