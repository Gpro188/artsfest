import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) return null;

  // Parallel fetch all stats
  const [
    eventsCount,
    teamsCount,
    programsCount,
    participantsCount,
    publishedResults,
    pendingResults,
    totalResults
  ] = await Promise.all([
    prisma.event.count(),
    prisma.team.count(),
    prisma.program.count(),
    prisma.candidate.count({ where: { programs: { some: {} } } }),
    prisma.result.count({ where: { isPublished: true } }),
    prisma.result.count({ where: { isPublished: false } }),
    prisma.result.count()
  ]);

  const stats = [
    { label: "Total Events", value: eventsCount, icon: "🎭", color: "#6366f1" },
    { label: "Active Teams", value: teamsCount, icon: "🛡️", color: "#ec4899" },
    { label: "Programmes", value: programsCount, icon: "📜", color: "#f59e0b" },
    { label: "Participants", value: participantsCount, icon: "👤", color: "#10b981" },
    { label: "Results Published", value: publishedResults, icon: "🏆", color: "#8b5cf6" },
    { label: "Results Pending", value: pendingResults, icon: "⏳", color: "#ef4444" },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <h1 style={{ margin: 0 }}>Management Overview</h1>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
           <Link href="/hub" className="btn btn-primary" style={{ backgroundColor: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="pulse-dot"></span> Live Management Hub
           </Link>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 'var(--spacing-lg)',
        marginBottom: 'var(--spacing-xxl)'
      }}>
        {stats.map((stat, i) => (
          <div key={i} className="glass-panel" style={{ 
            padding: 'var(--spacing-lg)', 
            borderLeft: `4px solid ${stat.color}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: '120px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {stat.label}
              </span>
              <span style={{ fontSize: '1.2rem' }}>{stat.icon}</span>
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '4px', color: 'white' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--spacing-lg)' }}>
        <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Welcome Back</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            You are currently logged in as <strong>{session.user.username}</strong> with administrative privileges. 
            All system operations are running normally.
          </p>
          <div style={{ marginTop: 'var(--spacing-lg)', display: 'flex', gap: 'var(--spacing-md)' }}>
             <Link href="/dashboard/scoring" className="btn btn-secondary">Results Entry</Link>
             <Link href="/dashboard/schedule" className="btn btn-secondary">Manage Schedule</Link>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Manager Resources</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)', fontSize: '0.85rem' }}>
            External tools for candidate photo hosting:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <a href="https://imgbb.com" target="_blank" className="btn btn-secondary" style={{ textAlign: 'left', fontSize: '0.8rem' }}>🚀 ImgBB (Recommended)</a>
            <a href="https://postimages.org" target="_blank" className="btn btn-secondary" style={{ textAlign: 'left', fontSize: '0.8rem' }}>🖼️ PostImages</a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pulse-dot {
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
          display: inline-block;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(255, 255, 255, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }
      `}</style>
    </div>
  );
}

