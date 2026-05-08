import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import EventForm from "./EventForm";
import EventList from "./EventList";

const prisma = new PrismaClient();

export default async function EventsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const events = await prisma.event.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { programs: true, teams: true }
      }
    }
  });

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <h1>Events Management</h1>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--spacing-lg)' }}>
        <div>
          <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Create New Event</h3>
            <EventForm />
          </div>
        </div>
        
        <div>
          <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>All Events</h3>
            <EventList events={events} />
          </div>
        </div>
      </div>
    </div>
  );
}
