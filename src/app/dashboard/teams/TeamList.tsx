"use client";

import { useState } from "react";
import { deleteTeam } from "./actions";
import EditTeamModal from "./EditTeamModal";

type TeamType = {
  id: string;
  name: string;
  prefixCode: string;
  event: { name: string };
  manager: { username: string } | null;
  leaderName: string | null;
  leaderPhoto: string | null;
  flagColor: string | null;
  _count: { candidates: number };
};

export default function TeamList({ teams }: { teams: TeamType[] }) {
  const [editingTeam, setEditingTeam] = useState<TeamType | null>(null);

  if (teams.length === 0) {
    return <div style={{ color: 'var(--text-muted)' }}>No teams created yet.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      {teams.map((team) => (
        <div key={team.id} style={{ 
          padding: 'var(--spacing-md)', 
          border: '1px solid var(--border-color)', 
          borderLeft: `5px solid ${team.flagColor || 'var(--primary)'}`,
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            {team.leaderPhoto && (
              <img 
                src={team.leaderPhoto} 
                alt={team.leaderName || "Leader"} 
                style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }}
              />
            )}
            <div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>
                {team.name} <span style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>Prefix: {team.prefixCode}</span>
              </h4>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Event: {team.event.name} • Manager: {team.manager?.username || 'None'} • Candidates: {team._count.candidates}
              </div>
              {team.leaderName && (
                <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '2px' }}>
                  Leader: {team.leaderName}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <button 
              onClick={() => setEditingTeam(team)}
              className="btn btn-secondary" 
              style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
            >
              Edit
            </button>
            <button 
              onClick={() => {
                if (confirm('Are you sure you want to delete this team and its manager?')) {
                  deleteTeam(team.id);
                }
              }}
              className="btn btn-secondary" 
              style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      {editingTeam && (
        <EditTeamModal 
          team={editingTeam} 
          onClose={() => setEditingTeam(null)} 
        />
      )}
    </div>
  );
}
