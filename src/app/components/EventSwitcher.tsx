"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useRef, useEffect } from "react";

export default function EventSwitcher({ events, activeEventId }: { events: any[], activeEventId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSwitch = (eventId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (eventId) {
      params.set("eventId", eventId);
    } else {
      params.delete("eventId");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Center the active element on load
  useEffect(() => {
    if (scrollRef.current) {
      const activeElement = scrollRef.current.querySelector(`[data-active="true"]`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeEventId]);

  return (
    <div className="event-switcher-wrapper">
      <div 
        ref={scrollRef}
        className="event-switcher-scroll"
      >
        {events.map(event => (
          <button
            key={event.id}
            data-active={activeEventId === event.id}
            onClick={() => handleSwitch(event.id)}
            className={`event-switch-btn ${activeEventId === event.id ? 'active' : ''}`}
          >
            {event.name}
          </button>
        ))}
      </div>

      <style jsx>{`
        .event-switcher-wrapper {
          position: relative;
          margin-bottom: var(--spacing-lg);
          padding: 4px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          max-width: 100%;
          overflow: hidden;
          align-self: flex-start;
          box-shadow: var(--shadow-sm);
        }

        .event-switcher-scroll {
          display: flex;
          gap: 4px;
          overflow-x: auto;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none;  /* IE/Edge */
          scroll-snap-type: x mandatory;
          padding: 2px;
        }

        .event-switcher-scroll::-webkit-scrollbar {
          display: none; /* Chrome/Safari */
        }

        .event-switch-btn {
          white-space: nowrap;
          padding: 0.55rem 1.6rem;
          border-radius: var(--radius-full);
          border: none;
          background: transparent;
          color: var(--muted);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 0.9rem;
          scroll-snap-align: center;
        }

        .event-switch-btn:hover {
          color: var(--text);
          background: var(--bg);
        }

        .event-switch-btn.active {
          background: linear-gradient(135deg, var(--maroon) 0%, #b83247 100%);
          color: white;
          font-weight: 700;
          box-shadow: 0 4px 14px rgba(156, 43, 60, 0.35);
          transform: scale(1.02);
        }

        @container fest-shell (max-width: 768px) {
          .event-switcher-wrapper {
            width: 100%;
            border-radius: var(--radius-lg);
          }
          .event-switch-btn {
            padding: 0.5rem 1.2rem;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
}

