import { prisma } from "@/lib/prisma";
import Link from "next/link";
import VisitTracker from "./components/VisitTracker";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const events = await prisma.event.findMany({
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

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: '#ffffff', 
      color: '#0f172a',
      fontFamily: 'var(--font-sans)'
    }}>
      <style>{`
        .hover-card { transition: all 0.2s ease-in-out; }
        .hover-card:hover { transform: translateY(-4px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01); border-color: #cbd5e1 !important; }
      `}</style>
      <VisitTracker eventId={null} />

      {/* Header */}
      <header style={{ 
        padding: '1.2rem 0', 
        borderBottom: '1px solid #f1f5f9',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1100px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src="/logo.png" alt="Dpro Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
            <div>
              <h1 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px' }}>Dpro Artsfest</h1>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link href="/login" style={{ color: '#475569', fontWeight: 500, fontSize: '0.9rem', textDecoration: 'none' }}>
              Client Login
            </Link>
            <Link href="/super-admin" style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', fontWeight: 600, backgroundColor: '#0f172a', color: '#ffffff', borderRadius: '8px', textDecoration: 'none' }}>
              Admin Panel
            </Link>
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {/* Hero Section */}
        <section style={{ padding: '6rem 1rem', textAlign: 'center', background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '20px', backgroundColor: '#eff6ff', color: '#2563eb', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.5rem', letterSpacing: '0.5px' }}>
              SMART FESTIVAL MANAGEMENT
            </span>
            <h1 style={{ fontSize: '4rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, letterSpacing: '-2px', marginBottom: '1.5rem' }}>
              Elevate Your Arts Fest.
            </h1>
            <p style={{ fontSize: '1.25rem', color: '#475569', lineHeight: 1.6, marginBottom: '2.5rem', maxWidth: '600px', marginInline: 'auto' }}>
              A premium, fast, and secure platform to manage teams, schedule programs, and publish live standings with ease.
            </p>
            <Link href="/login" style={{ display: 'inline-block', padding: '0.875rem 2rem', fontSize: '1.1rem', fontWeight: 600, backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '10px', textDecoration: 'none', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)' }}>
              Get Started Now
            </Link>
          </div>
        </section>

        {/* Active Events */}
        <section style={{ padding: '4rem 1rem', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Active Fests</h2>
              <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>{events.length} Live</span>
            </div>
            
            {events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#f8fafc', borderRadius: '12px', color: '#64748b' }}>
                No active fests right now. Check back later!
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {events.map(event => (
                  <div key={event.id} style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', cursor: 'pointer' }} className="hover-card">
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem 0' }}>{event.name}</h3>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{event._count.teams} Teams</span>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{event._count.programs} Programs</span>
                    </div>
                    <Link href={`/fest/${event.id}`} style={{ display: 'block', textAlign: 'center', padding: '0.75rem', backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 600, borderRadius: '8px', textDecoration: 'none' }}>
                      View Live Standings &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Smart Features */}
        <section style={{ padding: '5rem 1rem', backgroundColor: '#f8fafc' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1rem 0', letterSpacing: '-0.5px' }}>Why Choose Dpro?</h2>
              <p style={{ fontSize: '1.1rem', color: '#475569', maxWidth: '600px', margin: '0 auto' }}>We focus on smart automation so you can focus on the festival.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
              {[
                { title: "Live Leaderboards", desc: "Real-time standings updated instantly as judges submit scores." },
                { title: "Smart Scheduling", desc: "Conflict-free program scheduling across multiple stages." },
                { title: "ID Cards & Badges", desc: "One-click generation of professional participant and team ID cards." },
                { title: "Custom Posters", desc: "Beautifully designed result posters ready for social media." }
              ].map((feat, i) => (
                <div key={i} style={{ padding: '2rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>{feat.title}</h3>
                  <p style={{ fontSize: '0.95rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer style={{ padding: '3rem 1rem', textAlign: 'center', borderTop: '1px solid #f1f5f9', backgroundColor: '#ffffff' }}>
        <p style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontWeight: 600 }}>Dpro Artsfest System</p>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>&copy; {new Date().getFullYear()} All rights reserved.</p>
      </footer>
    </div>
  );
}
