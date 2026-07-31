import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminScheduler from "./AdminScheduler";
import ManagerScheduler from "./ManagerScheduler";
import EventSwitcher from "@/app/components/EventSwitcher";

export default async function SchedulePage(props: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { role, id: userId } = session.user;

  if (role === "ADMIN") {
    const userEventId = session.user.eventId;
    const eventWhere: any = userEventId ? {
      OR: [
        { id: userEventId },
        { parentId: userEventId }
      ]
    } : {};

    const rawEvents = await prisma.event.findMany({
      where: eventWhere,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, createdAt: true }
    });

    const seenEventNames = new Set<string>();
    const events = rawEvents.filter(ev => {
      const key = ev.name.trim().toLowerCase();
      if (seenEventNames.has(key)) return false;
      seenEventNames.add(key);
      return true;
    });

    const activeEventId = (searchParams.eventId && events.some(e => e.id === searchParams.eventId)) 
      ? searchParams.eventId 
      : events[0]?.id;

    const programs = await prisma.program.findMany({
      where: activeEventId ? { eventId: activeEventId } : {},
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <div>
            <h1 style={{ margin: '0 0 var(--spacing-xs) 0' }}>Global Festival Schedule</h1>
            <p className="page-description" style={{ marginBottom: 0 }}>
              Plan and manage the festival timeline. Assign time slots and venues for each program.
            </p>
          </div>
          <div data-tour="schedule-print" style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <a href={`/print/schedule?eventId=${activeEventId}`} target="_blank" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
              Print Schedule
            </a>
            <a href={`/print/venue?eventId=${activeEventId}`} target="_blank" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
              Print Venue List
            </a>
          </div>
        </div>

        <div data-tour="schedule-switcher">
          <EventSwitcher events={events} activeEventId={activeEventId || ""} />
        </div>

        <div data-tour="schedule-grid">
          <AdminScheduler initialPrograms={programs as any} eventId={activeEventId || "default"} />
        </div>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <div>
            <h1 style={{ margin: '0 0 var(--spacing-xs) 0' }}>Team Festival Schedule</h1>
            <p className="page-description" style={{ marginBottom: 0 }}>
              View all programs and track your team's assignments and time slots.
            </p>
          </div>
          <a href={`/print/schedule?teamId=${team.id}`} target="_blank" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            Print Team Schedule
          </a>
        </div>
        <ManagerScheduler initialPrograms={programs as any} teamId={team.id} />
      </div>
    );
  }

  redirect("/dashboard");
}
