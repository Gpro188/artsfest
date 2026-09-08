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
 * Generates Prisma where filter for Categories scoped to a festival.
 */
export function getFestivalCategoryWhere(festEventIds: string[]) {
  if (!festEventIds || festEventIds.length === 0) return {};
  return {
    eventId: { in: festEventIds }
  };
}
