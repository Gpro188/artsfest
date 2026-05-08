"use client";

type TeamScore = {
  id: string;
  name: string;
  flagColor: string | null;
  publishedPoints: number;
  totalPoints: number;
};

export default function TeamScorePreview({ scores }: { scores: TeamScore[] }) {
  const sortedScores = [...scores].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="glass-panel" style={{ padding: 'var(--spacing-lg)', height: 'fit-content' }}>
      <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Team Competition Tracker</h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)' }}>
        Compare <strong>Live</strong> points (public) vs <strong>Projected</strong> points (draft results included).
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
        {sortedScores.map((team, index) => (
          <div key={team.id} style={{ 
            padding: 'var(--spacing-sm)', 
            backgroundColor: 'rgba(255,255,255,0.02)', 
            borderRadius: 'var(--radius-sm)',
            borderLeft: `4px solid ${team.flagColor || 'var(--primary)'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>{index + 1}. {team.name}</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{team.totalPoints} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Draft</span></div>
                <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>{team.publishedPoints} <span style={{ color: 'var(--text-muted)' }}>Live</span></div>
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', marginTop: '6px', borderRadius: '2px', overflow: 'hidden', display: 'flex' }}>
               <div style={{ 
                 width: `${(team.publishedPoints / (Math.max(...scores.map(s => s.totalPoints)) || 1)) * 100}%`, 
                 backgroundColor: 'var(--success)', 
                 height: '100%' 
               }}></div>
               <div style={{ 
                 width: `${((team.totalPoints - team.publishedPoints) / (Math.max(...scores.map(s => s.totalPoints)) || 1)) * 100}%`, 
                 backgroundColor: 'var(--warning)', 
                 opacity: 0.5,
                 height: '100%' 
               }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
