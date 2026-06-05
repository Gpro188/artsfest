import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import PublicDashboard from "../../components/PublicDashboard";
import VisitTracker from "../../components/VisitTracker";
import { getSettings } from "@/lib/settings";

export const revalidate = 30; // Revalidate standings every 30 seconds

export default async function FestPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      parent: {
        include: { subEvents: true }
      },
      subEvents: true
    }
  });

  if (!event) {
    notFound();
  }

  // Gather related events for switching
  const relatedEvents = [];
  if (event.parentId) {
    // It's a sub-event, so include the main event and sibling sub-events
    relatedEvents.push({ id: event.parent!.id, name: event.parent!.name, type: 'Main Event' });
    event.parent!.subEvents.forEach(sub => {
      if (sub.id !== event.id) {
        relatedEvents.push({ id: sub.id, name: sub.name, type: 'Sub Event' });
      }
    });
  } else {
    // It's a main event, so include all its sub-events
    event.subEvents.forEach(sub => {
      relatedEvents.push({ id: sub.id, name: sub.name, type: 'Sub Event' });
    });
  }

  const settings = await getSettings(event.id);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <VisitTracker eventId={event.id} />

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
                event.name.charAt(0)
              )}
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', margin: 0, letterSpacing: '-0.5px', color: 'white' }}>{event.name}</h1>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{settings.festMoto}</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>

            <Link href="/login" className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: 'var(--spacing-xl) 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
             <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'white' }}>{event.name}</h2>
             <p style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>Live Results Dashboard</p>
             
             {relatedEvents.length > 0 && (
               <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                 {relatedEvents.map(re => (
                   <Link key={re.id} href={`/fest/${re.id}`} className="btn" style={{ 
                     background: 'rgba(255, 255, 255, 0.1)', 
                     color: 'white', 
                     padding: '0.3rem 0.8rem', 
                     fontSize: '0.8rem',
                     border: '1px solid rgba(255, 255, 255, 0.2)'
                   }}>
                     View {re.name} ({re.type})
                   </Link>
                 ))}
               </div>
             )}
          </div>
          
          <PublicDashboard initialEvents={[event]} />
        </div>
      </main>

      {/* Brand Advertisement Footer */}
      <footer style={{ 
        padding: 'var(--spacing-xl) 0', 
        borderTop: '1px solid var(--border-color)', 
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        textAlign: 'center', 
        color: 'var(--text-muted)',
        marginTop: 'var(--spacing-xxl)'
      }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <p style={{ margin: 0 }}>&copy; 2026 {event.name} • Live Leaderboard Standings</p>
          
          {/* Brand Ad Link */}
          <div className="glass-panel" style={{ 
            padding: '12px 24px', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid rgba(79, 70, 229, 0.15)',
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05), rgba(6, 182, 212, 0.05))',
            marginTop: '10px',
            maxWidth: '550px'
          }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 6px 0' }}>
              ⚡ Powered by <strong>Dpro_artsfest system</strong>.
            </p>
            <Link href="/" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Host your own arts fest on this system ➔
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
