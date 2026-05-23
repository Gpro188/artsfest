"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { recordVisit } from "../actions/analytics";

export default function VisitTracker({ eventId }: { eventId: string | null }) {
  const pathname = usePathname();

  useEffect(() => {
    // Avoid double logs or empty tracks
    if (pathname) {
      recordVisit(eventId, pathname);
    }
  }, [pathname, eventId]);

  return null; // Invisible component
}
