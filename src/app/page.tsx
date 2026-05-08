import { prisma } from "@/lib/prisma";
import Link from "next/link";
import PublicDashboard from "./components/PublicDashboard";
import { getSettings } from "@/lib/settings";

export default async function HomePage() {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const settings = await getSettings();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ 
        padding: 'var(--spacing-md) 0', 
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: 'var(--radius-md)', 
              background: settings.festLogo ? 'transparent' : 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              overflow: 'hidden'
            }}>
              {settings.festLogo ? (
                <img src={settings.festLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                settings.festName.charAt(0)
              )}
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', margin: 0, letterSpacing: '-0.5px' }}>{settings.festName}</h1>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{settings.festMoto}</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
            <Link href="/search" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
              Search Results
            </Link>
            <Link href="/login" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: 'var(--spacing-xl) 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xxl)' }}>
             <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem' }}>{settings.festName}</h2>
             <p style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>{settings.festMoto}</p>
          </div>
          
          {events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <p style={{ color: 'var(--text-muted)' }}>No events are currently active.</p>
            </div>
          ) : (
            <PublicDashboard initialEvents={events} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: 'var(--spacing-lg) 0', borderTop: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div className="container">
          <p>&copy; 2026 {settings.festName} • {settings.festMoto}</p>
        </div>
      </footer>
    </div>
  );
}
