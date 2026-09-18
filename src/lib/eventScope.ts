import { prisma } from "@/lib/prisma";

/**
 * Returns all event IDs associated with a festival (the root event and any sub-events).
 * If the input eventId is a sub-event, it resolves the root parent and all sibling sub-events.
 */
export async function getFestivalEventIds(eventId?: string | null): Promise<string[]> {
  if (!eventId) return [];

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, parentId: true }
    });

    if (!event) return [eventId];

    const rootId = event.parentId || event.id;
    const subEvents = await prisma.event.findMany({
      where: { parentId: rootId },
      select: { id: true }
    });

    const ids = Array.from(new Set([rootId, ...subEvents.map(s => s.id)]));
    return ids;
  } catch (error) {
    console.error("Failed to resolve festival event IDs:", error);
    return eventId ? [eventId] : [];
  }
}

/**
 * Generates Prisma where filter for Candidates scoped to a festival.
 */
export function getFestivalCandidateWhere(festEventIds: string[]) {
  if (!festEventIds || festEventIds.length === 0) return {};
  return {
    team: {
      eventId: { in: festEventIds }
    }
  };
}

/**
 * Generates Prisma where filter for Teams scoped to a festival.
 */
export function getFestivalTeamWhere(festEventIds: string[]) {
  if (!festEventIds || festEventIds.length === 0) return {};
  return {
    eventId: { in: festEventIds }
  };
}

/**
 * Resolves the festival eventId and all associated event IDs (parent + sub-events).
 * Prioritizes explicit eventId, custom domain (host), session, team, or category.
 * Ensures cross-festival candidate bleeding never occurs.
 */
export async function resolveFestivalScope({
  eventId,
  teamId,
  categoryId,
  sessionEventId,
  host
}: {
  eventId?: string | null;
  teamId?: string | null;
  categoryId?: string | null;
  sessionEventId?: string | null;
  host?: string | null;
}) {
  let targetEventId = eventId || null;

  // 1. If host provided and is a custom domain, check database
  if (!targetEventId && host) {
    const domain = host.replace(/^www\./, '').split(':')[0].toLowerCase();
    if (!domain.includes('localhost') && !domain.includes('127.0.0.1') && !domain.endsWith('.vercel.app') && !domain.endsWith('.netlify.app')) {
      const domainEvent = await prisma.event.findUnique({
        where: { customDomain: domain },
        select: { id: true, parentId: true }
      });
      if (domainEvent) {
        targetEventId = domainEvent.parentId || domainEvent.id;
      }
    }
  }

  // 2. Try session
  if (!targetEventId && sessionEventId) {
    targetEventId = sessionEventId;
  }

  // 3. Try teamId
  if (!targetEventId && teamId) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { eventId: true }
    });
    if (team) targetEventId = team.eventId;
  }

  // 4. Try categoryId
  if (!targetEventId && categoryId) {
    const cat = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { eventId: true }
    });
    if (cat) targetEventId = cat.eventId;
  }

  // 5. Fallback: find the first active parent event so we never query cross-festival
  if (!targetEventId) {
    const firstEvent = await prisma.event.findFirst({
      where: { parentId: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true }
    });
    if (firstEvent) targetEventId = firstEvent.id;
  }

  const festEventIds = await getFestivalEventIds(targetEventId);
  return {
    eventId: targetEventId,
    festEventIds
  };
}

/**
 * Generates Prisma where filter for Categories scoped to a festival.
 */
export function getFestivalCategoryWhere(festEventIds: string[]) {
  if (!festEventIds || festEventIds.length === 0) return {};
  return {
    eventId: { in: festEventIds }
  };
}

