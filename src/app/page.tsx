import { prisma } from "@/lib/prisma";
import Link from "next/link";
import VisitTracker from "./components/VisitTracker";
import Header from "./components/Header";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let events: any[] = [];
  let dbError = null;
  try {
    events = await prisma.event.findMany({
      where: { parentId: null },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: { teams: true, programs: true, categories: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error: any) {
    dbError = error.message || "Unknown Database Error";
    console.error("Database Error on Landing Page:", error);
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: 'var(--bg-color)', 
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      overflowX: 'hidden',
      transition: 'background-color 0.3s, color 0.3s'
    }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Dpro ArtsFes System",
            "operatingSystem": "Web",
            "applicationCategory": "BusinessApplication",
            "description": "Premium multi-tenant festival management suite by Dpro Technologies.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "author": {
              "@type": "Organization",
              "name": "Dpro Technologies",
              "url": "https://dpro-artsfest.vercel.app/"
            }
          })
        }}
      />
      <style>{`
        .glass-header { background: var(--hero-glass-bg); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border-color); transition: background 0.3s; }
        .hero-gradient { background: radial-gradient(circle at 50% 0%, var(--hero-orb-1) 0%, var(--hero-gradient-center) 70%); background-size: 200% 200%; animation: bg-shift 8s ease infinite; transition: background 0.3s; }
        @keyframes bg-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes float-slow { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(20vw, -15vh) scale(1.2); } 66% { transform: translate(-15vw, 20vh) scale(0.8); } }
        @keyframes float-medium { 0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); } 50% { transform: translate(-25vw, 15vh) rotate(180deg) scale(1.1); } }
        @keyframes float-fast { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(25vw, 15vh) scale(1.3); } }
        .demo-link:hover { background: var(--border-color-strong) !important; }
        .hover-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid var(--border-color-strong); background: var(--card-bg); }
        .hover-card:hover { transform: translateY(-5px); border-color: var(--card-border-hover); background: var(--surface-hover); box-shadow: 0 20px 40px -10px rgba(37,99,235,0.1); }
        .btn-primary { background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); transition: opacity 0.2s; }
        .btn-primary:hover { opacity: 0.9; box-shadow: 0 0 20px rgba(37,99,235,0.4); }
        .btn-outline { background: transparent; border: 1px solid var(--border-color-strong); transition: all 0.2s; color: var(--text-primary) !important; }
        .btn-outline:hover { background: var(--border-color); border-color: var(--text-secondary); }
        .text-gradient { background: linear-gradient(to right, var(--text-primary), var(--text-muted)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        @media (max-width: 768px) {
          .hero-gradient { padding: 6rem 1rem 3rem 1rem !important; }
          .hero-gradient h1 { font-size: 2.5rem !important; }
        }
      `}</style>
      <VisitTracker eventId={null} />

      {/* Header */}
      <Header />

      <main style={{ flex: 1, paddingTop: '70px' }}>
        {/* Hero Section */}
        <section className="hero-gradient" style={{ padding: '8rem 1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          {/* Animated Background Orbs */}
          <div style={{ position: 'absolute', top: '10%', left: '15%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, var(--hero-orb-1) 0%, transparent 60%)', filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none', animation: 'float-slow 6s infinite alternate ease-in-out', opacity: 0.8 }}></div>
          <div style={{ position: 'absolute', bottom: '-20%', right: '5%', width: '45vw', height: '45vw', background: 'radial-gradient(circle, var(--hero-orb-2) 0%, transparent 60%)', filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none', animation: 'float-medium 5s infinite alternate ease-in-out', opacity: 0.8 }}></div>
          <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: '70vw', height: '50vw', background: 'radial-gradient(circle, var(--hero-orb-3) 0%, transparent 70%)', filter: 'blur(50px)', zIndex: 0, pointerEvents: 'none', animation: 'float-fast 7s infinite alternate-reverse ease-in-out', opacity: 0.8 }}></div>
          
          <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
            <span style={{ display: 'inline-block', padding: '0.35rem 1rem', borderRadius: '20px', border: '1px solid rgba(56, 189, 248, 0.3)', backgroundColor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 600, marginBottom: '2rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Premium Festival Management
            </span>
            <h1 className="text-gradient" style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-2px', marginBottom: '1.5rem' }}>
              Elevate Your <br/>Arts Fest.
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '3rem', maxWidth: '600px', marginInline: 'auto' }}>
              A state-of-the-art platform engineered to manage teams, schedule programs seamlessly, and broadcast live standings with breathtaking speed.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link href="/demo" className="btn-primary" style={{ display: 'inline-block', padding: '1rem 2.5rem', fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', borderRadius: '12px', textDecoration: 'none' }}>
                Experience Demo Fest
              </Link>
              <Link href="/login" className="btn-outline" style={{ display: 'inline-block', padding: '1rem 2.5rem', fontSize: '1.1rem', fontWeight: 600, borderRadius: '12px', textDecoration: 'none' }}>
                Get Started
              </Link>
            </div>
          </div>
        </section>

        {/* Demo Callout Section */}
        <section style={{ padding: '3rem 1.5rem', background: 'var(--surface-color)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '2rem' }}>
            <div style={{ flex: '1 1 400px' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Test Drive the Platform</h2>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                Explore our fully interactive Demo Fest. See firsthand how we handle live results, generate stunning posters, and create professional ID cards automatically.
              </p>
            </div>
            <div style={{ flex: '0 0 auto' }}>
              <Link href="/demo" className="demo-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 2rem', fontSize: '1rem', fontWeight: 600, backgroundColor: 'var(--border-color)', color: 'var(--text-primary)', borderRadius: '10px', textDecoration: 'none', border: '1px solid var(--border-color-strong)', transition: 'background 0.2s' }}>
                Explore Demo Modules &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* Active Events */}
        <section style={{ padding: '5rem 1.5rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Active Fests</h2>
              <span style={{ fontSize: '0.9rem', color: '#38bdf8', fontWeight: 600, background: 'rgba(56, 189, 248, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#38bdf8', borderRadius: '50%', marginRight: '6px', animation: 'pulse 2s infinite' }}></span>
                {events.length} Live
              </span>
            </div>
            
            {dbError && (
              <div style={{ padding: '2rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', color: '#EF4444' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>⚠️</span> Database Connection Error
                </h3>
                <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9 }}>{dbError}</p>
              </div>
            )}
            
            {!dbError && events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--surface-color)', border: '1px solid var(--border-color-strong)', borderRadius: '16px', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>No fests are currently active.</p>
                <Link href="/login" className="btn-outline" style={{ display: 'inline-block', padding: '0.75rem 2rem', borderRadius: '8px', textDecoration: 'none' }}>Create One Now</Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                {events.map(event => (
                  <div key={event.id} className="hover-card" style={{ padding: '2rem', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>{event.name}</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                      <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{event._count.teams}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Teams</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{event._count.programs}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Programs</div>
                      </div>
                    </div>
                    <Link href={`/fest/${event.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#38bdf8', fontWeight: 600, textDecoration: 'none', fontSize: '1rem' }}>
                      <span>View Live Standings</span>
                      <span style={{ fontSize: '1.2rem' }}>&rarr;</span>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <footer style={{ padding: '3rem 1.5rem', textAlign: 'center', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '24px', height: '24px', filter: 'grayscale(100%) opacity(50%)' }} />
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '1px' }}>DPRO ARTSFEST SYSTEM</p>
        </div>
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="https://wa.me/918592888137" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e', textDecoration: 'none', fontWeight: 600, fontSize: '1rem', background: 'rgba(34, 197, 94, 0.1)', padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid rgba(34, 197, 94, 0.2)', transition: 'all 0.2s' }}>
            <span style={{ fontSize: '1.1rem' }}>💬</span> +91 8592888137
          </a>
          <a href="https://wa.me/918086318145" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#22c55e', textDecoration: 'none', fontWeight: 600, fontSize: '1rem', background: 'rgba(34, 197, 94, 0.1)', padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid rgba(34, 197, 94, 0.2)', transition: 'all 0.2s' }}>
            <span style={{ fontSize: '1.1rem' }}>💬</span> +91 80863 18145
          </a>
        </div>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>&copy; {new Date().getFullYear()} All rights reserved. Designed for excellence.</p>
      </footer>
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(56, 189, 248, 0); }
          100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
        }
      `}</style>
    </div>
  );
}
