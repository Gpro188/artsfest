import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProgramForm from "./ProgramForm";
import ProgramList from "./ProgramList";
import ProgramBulkActions from "./BulkActions";
import Link from "next/link";

export default async function ProgramsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const events = await prisma.event.findMany({
    select: {
      id: true,
      name: true,
      createdAt: true,
      categories: {
        select: { id: true, name: true }
      }
    },
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

  const allCategories = events.flatMap(e => e.categories);
  const currentEventId = events[0]?.id || "";

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ marginBottom: 'var(--spacing-xs)' }}>Programs Management</h1>
        <p className="page-description">
          Define all competition programs. Set types (Individual/Group), categories, time limits, and candidate limits per team.
        </p>
      </div>
      
      {events.length === 0 ? (
        <div className="glass-panel empty-state-guidance">
          <p style={{ color: 'var(--warning)', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
            No events found.
          </p>
          <p>Programs belong to events. Create an event first, then define programs and categories here.</p>
          <Link href="/dashboard/events" className="empty-state-action">Go to Events &rarr;</Link>
        </div>
      ) : (
        <>
          <div data-tour="programs-bulk">
            <ProgramBulkActions 
              eventId={currentEventId} 
              programs={programs} 
              categories={allCategories} 
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--spacing-lg)' }}>
          <div>
            <div data-tour="programs-form" className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Create New Program</h3>
              <ProgramForm events={events} />
            </div>
          </div>
          
          <div>
            <div data-tour="programs-list" className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
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
