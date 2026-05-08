"use client";

import Link from "next/link";

export default function PendingProgramsList({ programs }: { programs: any[] }) {
  if (programs.length === 0) {
    return (
      <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center', color: 'var(--success)' }}>
        🎉 All programs have results entered!
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>
        Programs that have candidates assigned but no marks entered.
      </p>
      {programs.map((program) => (
        <div key={program.id} style={{ 
          padding: 'var(--spacing-sm) var(--spacing-md)', 
          border: '1px solid var(--border-color)', 
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{program.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {program.category?.name || 'General'} • {program.type} • {program._count?.assignments} Candidates
            </div>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--error)', fontWeight: 'bold' }}>
            MISSING
          </div>
        </div>
      ))}
    </div>
  );
}
