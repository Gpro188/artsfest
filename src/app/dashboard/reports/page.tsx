import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getReportsData } from "@/app/actions/reports";
import ReportsHubClient from "./ReportsHubClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reports & Printables Hub",
  description: "Official festival reports, Hall of Fame, printable PDFs, and Excel exports"
};

export default async function ReportsPage(props: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { role, eventId: userEventId, id: userId } = session.user;

  // Resolve manager team event if manager
  let resolvedUserEventId = userEventId;
  if (role === "MANAGER") {
    const team = await prisma.team.findUnique({
      where: { managerId: userId },
      select: { eventId: true, event: { select: { parentId: true } } }
    });
    if (team) {
      resolvedUserEventId = team.event.parentId || team.eventId;
    }
  }

  // Find accessible events
  const eventWhere: any = resolvedUserEventId
    ? {
        OR: [
          { id: resolvedUserEventId },
          { parentId: resolvedUserEventId }
        ]
      }
    : {};

  const rawEvents = await prisma.event.findMany({
    where: eventWhere,
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, createdAt: true, parentId: true }
  });

  // Sort rawEvents so root eventId comes first
  const sortedRawEvents = [...rawEvents].sort((a, b) => {
    if (a.id === resolvedUserEventId) return -1;
    if (b.id === resolvedUserEventId) return 1;
    if (!a.parentId && b.parentId) return -1;
    if (a.parentId && !b.parentId) return 1;
    return 0;
  });

  // Deduplicate events by normalized name
  const seenEventNames = new Set<string>();
  const events = sortedRawEvents.filter((ev) => {
    const key = ev.name.trim().toLowerCase();
    if (seenEventNames.has(key)) return false;
    seenEventNames.add(key);
    return true;
  });

  const activeEventId =
    searchParams.eventId && events.some((e) => e.id === searchParams.eventId)
      ? searchParams.eventId
      : events[0]?.id || resolvedUserEventId || "";

  if (!activeEventId) {
    return (
      <div className="animate-fade-in" style={{ padding: "var(--spacing-xl)", textAlign: "center" }}>
        <h2>No Events Found</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "var(--spacing-md)" }}>
          Create an event to view official festival reports and exports.
        </p>
        <a href="/dashboard/events" className="btn btn-primary">
          Go to Events
        </a>
      </div>
    );
  }

  const reportsResult = await getReportsData(activeEventId);

  if (!reportsResult.success || !reportsResult.data) {
    return (
      <div className="animate-fade-in glass-panel" style={{ padding: "var(--spacing-xl)", textAlign: "center", margin: "2rem auto", maxWidth: "600px" }}>
        <h2 style={{ color: "var(--error)", marginBottom: "1rem" }}>Failed to Load Reports</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
          {reportsResult.error || "An error occurred while compiling festival statistics."}
        </p>
        <a href="/dashboard" className="btn btn-secondary">
          Return to Dashboard
        </a>
      </div>
    );
  }

  return (
    <ReportsHubClient
      initialData={reportsResult.data}
      events={events}
      activeEventId={activeEventId}
    />
  );
}
