"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function EventSwitcher({ events, activeEventId }: { events: any[], activeEventId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSwitch = (eventId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (eventId) {
      params.set("eventId", eventId);
    } else {
      params.delete("eventId");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)', marginBottom: 'var(--spacing-md)', alignSelf: 'flex-start' }}>
      {events.map(event => (
        <button
          key={event.id}
          onClick={() => handleSwitch(event.id)}
          style={{
            padding: '0.5rem 1.5rem',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            background: activeEventId === event.id ? 'var(--primary)' : 'transparent',
            color: activeEventId === event.id ? 'white' : 'var(--text-secondary)',
            fontWeight: activeEventId === event.id ? 600 : 400,
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontSize: '0.875rem'
          }}
        >
          {event.name}
        </button>
      ))}
    </div>
  );
}
