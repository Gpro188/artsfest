import { prisma } from "@/lib/prisma";
import Link from "next/link";
import VisitTracker from "./components/VisitTracker";

export const revalidate = 60; // Revalidate landing page every 60 seconds

export default async function HomePage() {
  const events = await prisma.event.findMany({
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: {
        select: {
          teams: true,
          programs: true,
          categories: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'radial-gradient(circle at top right, #1e1b4b, #0f172a)' }}>
      <VisitTracker eventId={null} />

      {/* Hero Header */}
      <header style={{ 
        padding: 'var(--spacing-md) 0', 
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
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
              background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 800,
              fontSize: '1.2rem'
            }}>
              D
            </div>
            <div>
              <h1 style={{ fontSize: '1.3rem', margin: 0, letterSpacing: '-0.5px', color: 'white' }}>Dpro Technologies</h1>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Artsfest Manage Suite</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
            <Link href="/login" className="btn btn-secondary" style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem' }}>
              Client Login
            </Link>
            <Link href="/super-admin" className="btn btn-primary" style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem', background: 'linear-gradient(135deg, #4f46e5, #3b82f6)' }}>
              Super Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Main SaaS Showcase */}
      <main style={{ flex: 1, padding: 'var(--spacing-xxl) 0' }}>
        <div className="container">
          
          {/* Hero Section */}
          <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto var(--spacing-xxl) auto' }}>
            <div style={{ 
              display: 'inline-block', 
              padding: '6px 16px', 
              borderRadius: 'var(--radius-full)', 
              background: 'rgba(79, 70, 229, 0.1)', 
              border: '1px solid rgba(79, 70, 229, 0.3)',
              color: '#a5b4fc',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              marginBottom: 'var(--spacing-lg)'
            }}>
              ⚡ Next-Generation Arts Fest Software
            </div>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 800, color: 'white', lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 'var(--spacing-md)' }}>
              Powering Creativity & <span style={{ background: 'linear-gradient(135deg, #60a5fa, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Live Standing Results</span>
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--spacing-xl)' }}>
              An all-in-one management, scoring, and live broadcasting suite built by **Dpro Technologies**. Host your institution fests, assign candidates, enter marks rapidly, and display live slide leaderboards.
            </p>
          </div>

          {/* Active Fests Section */}
          <section style={{ marginBottom: 'var(--spacing-xxl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-lg)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 'var(--spacing-sm)' }}>
              <div>
                <h2 style={{ margin: 0, color: 'white', fontSize: '1.75rem' }}>🚩 Running Events</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Choose an event below to view its live standings, star candidates, and event schedule.</p>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>{events.length} Active Tenants</span>
            </div>

            {events.length === 0 ? (
              <div className="glass-panel" style={{ padding: 'var(--spacing-xxl)', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>No active fests found. Super Admin must register a new fest in the administration portal.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--spacing-lg)' }}>
                {events.map(event => (
                  <div key={event.id} className="glass-panel animate-fade-in" style={{ padding: 'var(--spacing-lg)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '200px' }}>
                    <div>
                      <h3 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '1.25rem' }}>{event.name}</h3>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0 0 var(--spacing-md) 0' }}>Launched on {new Date(event.createdAt).toLocaleDateString()}</p>
                      
                      {/* Stats Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: 'var(--spacing-lg)' }}>
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid rgba(255,255,255,0.02)' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#60a5fa' }}>{event._count.teams}</div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Teams</div>
                        </div>
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid rgba(255,255,255,0.02)' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b' }}>{event._count.programs}</div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Programs</div>
                        </div>
                        <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid rgba(255,255,255,0.02)' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>{event._count.categories}</div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Categories</div>
                        </div>
                      </div>
                    </div>

                    <Link href={`/fest/${event.id}`} className="btn btn-primary" style={{ width: '100%', textAlign: 'center', background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', fontWeight: 600 }}>
                      Enter Live Standings ➔
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Product Facilities Section */}
          <section style={{ marginBottom: 'var(--spacing-xxl)' }}>
            <h2 style={{ textAlign: 'center', color: 'white', marginBottom: 'var(--spacing-xl)', fontSize: '2rem' }}>⚡ Suite Facilities</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-lg)' }}>
              {[
                { title: "🎯 Rapid Results Entry", desc: "Judges can quickly record scorecards, award places/grades, and calculate individual points with automated tie-breaker handling.", icon: "🏆" },
                { title: "📊 Live Hub (Audience Slides)", desc: "A real-time sliding scoreboard view designed for big screens/projectors, showing team leaderboard standings and category champions.", icon: "🌐" },
                { title: "📥 Excel Batch Importer", desc: "Seamless onboarding of event schedules, programs, and candidates from Excel files, processed instantly via database transactions.", icon: "📋" },
                { title: "🛡️ Conflict & Schedule Audit", desc: "Built-in auditing checks program times and durations, identifying scheduling overlaps for candidates before they occur.", icon: "⏳" },
                { title: "🆔 Bulk Candidate ID Cards", desc: "Generate print-ready layouts for contestant ID cards complete with category descriptors, team flag colors, and unique barcodes.", icon: "💳" },
                { title: "🛠️ Multi-Fest Scaling", desc: "Host distinct fests with individual configurations, isolated team managers, custom points matrices, and discrete analytics tracking.", icon: "⚙️" }
              ].map((fac, i) => (
                <div key={i} className="glass-panel" style={{ padding: 'var(--spacing-lg)', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{fac.icon}</div>
                  <h3 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '1.1rem' }}>{fac.title}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{fac.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Onboarding Guide */}
          <section className="glass-panel" style={{ padding: 'var(--spacing-xl)', border: '1px solid rgba(79, 70, 229, 0.2)' }}>
            <h2 style={{ color: 'white', fontSize: '1.75rem', marginBottom: 'var(--spacing-md)' }}>🚀 Setting Up Your Fest</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--spacing-lg)', maxWidth: '800px' }}>
              Want to run this system for your college, university, or community arts fest? Follow these steps to get onboarding from Dpro Technologies:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-lg)' }}>
              {[
                { step: "1", title: "Provision Fest URL", desc: "Contact Dpro Technologies to initialize your event database and receive your dedicated URL path." },
                { step: "2", title: "Setup Rules", desc: "Define category metrics, team allocations, manager accounts, and point templates inside the Admin Panel." },
                { step: "3", title: "Batch Import", desc: "Upload candidate data and scheduled program times directly using our spreadsheet templates." },
                { step: "4", title: "Go Live!", desc: "Open the Rapid Scoring entry and connect your Live projector to stream immediate stats to the audience." }
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '50%', 
                    backgroundColor: 'var(--primary)', 
                    color: 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    flexShrink: 0
                  }}>
                    {step.step}
                  </div>
                  <div>
                    <h4 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '0.95rem' }}>{step.title}</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer style={{ 
        padding: 'var(--spacing-xl) 0', 
        borderTop: '1px solid rgba(255,255,255,0.05)', 
        backgroundColor: 'rgba(15, 23, 42, 0.6)', 
        textAlign: 'center', 
        color: 'var(--text-muted)',
        fontSize: '0.8rem'
      }}>
        <div className="container">
          <p style={{ margin: '0 0 6px 0', color: 'white', fontWeight: 600 }}>ArtsFest Management Suite</p>
          <p style={{ margin: '0 0 12px 0' }}>Developed and powered by **Dpro Technologies**. All rights reserved &copy; 2026.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <Link href="/login" style={{ color: 'var(--primary)' }}>Manager Login</Link>
            <span>•</span>
            <Link href="/super-admin" style={{ color: 'var(--secondary)' }}>Super Admin Console</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
