import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import ProgramForm from "./ProgramForm";
import ProgramList from "./ProgramList";
import ProgramBulkActions from "./BulkActions";

const prisma = new PrismaClient();

export default async function ProgramsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const events = await prisma.event.findMany({
    include: { categories: true },
    orderBy: { createdAt: 'desc' }
  });

  const programs = await prisma.program.findMany({
    include: {
      event: true,
      category: true,
      _count: {
        select: { assignments: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Flatten categories for the edit modal
  const allCategories = events.flatMap(e => e.categories);
  const currentEventId = events[0]?.id || "";

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>Programs Management</h1>
      
      {events.length === 0 ? (
        <div className="glass-panel" style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
          <p style={{ color: 'var(--warning)', marginBottom: 'var(--spacing-sm)' }}>
            You need to create an Event first before creating Programs.
          </p>
        </div>
      ) : (
        <>
          <ProgramBulkActions 
            eventId={currentEventId} 
            programs={programs} 
            categories={allCategories} 
          />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--spacing-lg)' }}>
          <div>
            <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Create New Program</h3>
              <ProgramForm events={events} />
            </div>
          </div>
          
          <div>
            <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>All Programs</h3>
              <ProgramList programs={programs as any} categories={allCategories} />
            </div>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
