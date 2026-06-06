export default function DemoResultsPage() {
  const teams = [
    { rank: 1, name: "Team Alpha", points: 145, color: "#f59e0b" },
    { rank: 2, name: "Team Bravo", points: 130, color: "#94a3b8" },
    { rank: 3, name: "Team Charlie", points: 110, color: "#b45309" },
    { rank: 4, name: "Team Delta", points: 95, color: "#334155" },
  ];

  const recentResults = [
    { program: "Classical Dance (Solo)", first: "Aisha M. (Alpha)", second: "Rohan K. (Bravo)", time: "10 mins ago" },
    { program: "Debate Competition", first: "Sam T. (Charlie)", second: "Emma W. (Alpha)", time: "1 hour ago" },
    { program: "Oil Painting", first: "Liam P. (Delta)", second: "Noah R. (Bravo)", time: "2 hours ago" },
  ];

  return (
    <div style={{ padding: '3rem 1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem 0', letterSpacing: '-1px' }}>Live Leaderboard</h1>
          <p style={{ margin: 0, color: '#94a3b8' }}>Real-time point standings across all teams.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '0.5rem 1rem', borderRadius: '8px', color: '#38bdf8', fontWeight: 600 }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#38bdf8', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
          LIVE
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        
        {/* Leaderboard Table */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Rank</th>
                <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Team Name</th>
                <th style={{ padding: '1rem 1.5rem', color: '#94a3b8', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'right' }}>Total Points</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s', cursor: 'default' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '1.25rem 1.5rem' }}>
                    <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: idx < 3 ? team.color : 'rgba(255,255,255,0.1)', color: idx < 3 ? '#fff' : '#94a3b8', borderRadius: '50%', fontWeight: 700 }}>
                      {team.rank}
                    </div>
                  </td>
                  <td style={{ padding: '1.25rem 1.5rem', color: '#fff', fontWeight: 600, fontSize: '1.1rem' }}>{team.name}</td>
                  <td style={{ padding: '1.25rem 1.5rem', color: '#38bdf8', fontWeight: 700, fontSize: '1.25rem', textAlign: 'right' }}>{team.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Results Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', color: '#fff', margin: 0, fontWeight: 700 }}>Recent Updates</h3>
          {recentResults.map((res, idx) => (
            <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.25rem', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Published Result</span>
                <span>{res.time}</span>
              </div>
              <h4 style={{ margin: '0 0 1rem 0', color: '#e2e8f0', fontSize: '1.1rem' }}>{res.program}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.2rem' }}>🥇</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.95rem' }}>{res.first}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.2rem' }}>🥈</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.95rem' }}>{res.second}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
