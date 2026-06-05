import { prisma } from "@/lib/prisma";
import Link from "next/link";
import VisitTracker from "./components/VisitTracker";
import LandingTourWrapper from "./components/LandingTourWrapper";

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
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1050px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: 'var(--radius-md)', 
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <img src="/logo.png" alt="Dpro Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.3rem', margin: 0, letterSpacing: '-0.5px', color: 'white' }}>Dpro_artsfest system</h1>
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
        <div className="container" style={{ maxWidth: '1050px' }}>
          
          {/* Hero Section */}
          <div style={{ textAlign: 'left', maxWidth: '850px', margin: '0 0 var(--spacing-xxl) 0' }}>
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
              Organize Your Festival <span style={{ background: 'linear-gradient(135deg, #60a5fa, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>With Confidence</span>
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--spacing-xl)', maxWidth: '750px' }}>
              Complete multi-tenant platform with innovative features like scratch cards, participant cards, team priority sorting, and poster customization.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
              <Link href="/login" className="btn btn-primary" style={{ padding: '0.8rem 2.5rem', fontSize: '1rem', background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', fontWeight: 600 }}>
                Login to Dashboard
              </Link>
            </div>
          </div>

          {/* Active Fests Section */}
          <section data-tour="landing-events" style={{ marginBottom: 'var(--spacing-xxl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-lg)', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 'var(--spacing-sm)' }}>
              <div>
                <h2 style={{ margin: 0, color: 'white', fontSize: '1.75rem' }}>🚩 Running Events</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Choose an event below to view its live standings and dynamic result updates.</p>
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

          {/* Comprehensive Management Tools Section */}
          <section data-tour="landing-tools" style={{ marginBottom: 'var(--spacing-xxl)' }}>
            <h2 style={{ textAlign: 'center', color: 'white', marginBottom: '8px', fontSize: '2.25rem' }}>🛠️ Comprehensive Festival Management Tools</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)', fontSize: '1rem', maxWidth: '700px', marginInline: 'auto' }}>
              Everything you need to organize, evaluate, and showcase your arts festival from start to finish.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-lg)' }}>
              {[
                { title: "Multi-Tenant Architecture", desc: "Secure, isolated data for each organization with dedicated tenant management, role-based access control, and complete data privacy.", icon: "🌐" },
                { title: "Division Management", desc: "Organize festivals by age groups with unlimited divisions, minimum/maximum age validation, and comprehensive statistics tracking.", icon: "👥" },
                { title: "Team Management", desc: "Create and manage participating teams with chest number ranges, automatic point calculation, and team-wise performance tracking.", icon: "🛡️" },
                { title: "Participant Cards", desc: "Print professional participant ID cards with chest numbers, team & division details. Filter by division/team for targeted printing.", icon: "💳", badge: "NEW" },
                { title: "Program Management", desc: "Define programs by category (Stage/Off-Stage), type (Individual/Group), with point schemes, time limits, and judge requirements.", icon: "📜" },
                { title: "Program Registration", desc: "Register participants for programs with automatic eligibility checks, conflict detection, and participant limit management.", icon: "📝" },
                { title: "Code Letters Assignment", desc: "Assign anonymous code letters (A, B, C) to participants for unbiased evaluation with auto-generation and bulk assignment.", icon: "🔑" },
                { title: "Interactive Scratch Cards", desc: "Generate virtual scratch cards with random code letters (A-Z) for fun, interactive code letter picking. Mouse/touch/keyboard supported.", icon: "🃏", badge: "NEW" },
                { title: "Event Scheduling", desc: "Create detailed schedules with venue assignment, time slot management, and printable timetables for seamless event coordination.", icon: "📅" },
                { title: "Evaluation System", desc: "Multi-judge marks entry (0-100), automatic average calculation, real-time validation, and support for up to 5 judges per program.", icon: "⚖️" },
                { title: "Team Priority Sorting", desc: "Smart result filtering that prioritizes programs where weaker teams perform better, promoting balanced competition and fair opportunities.", icon: "📊", badge: "NEW" },
                { title: "Results & Rankings", desc: "Auto-generated results with rankings, grade assignment, position points, declaration controls, and comprehensive winner tracking.", icon: "🏆" },
                { title: "Poster Customizer", desc: "Design custom result posters with drag-and-drop editor, multiple templates, gradient backgrounds, and professional print-ready layouts.", icon: "🎨", badge: "NEW" },
                { title: "Grade Schemes", desc: "Flexible grading configuration with mark ranges, grade labels (A+, A, B), grade points, and customizable evaluation criteria.", icon: "📈" },
                { title: "Points & Statistics", desc: "Automated points calculation, team rankings, stage/off-stage categorization, and comprehensive performance analytics.", icon: "📈" },
                { title: "Role-Based Access", desc: "Five role types (Owner, Committee, Program Leader, Judge, Participant) with granular permissions and activity controls.", icon: "🔒" }
              ].map((tool, idx) => (
                <div key={idx} className="glass-panel" style={{ padding: 'var(--spacing-md) var(--spacing-lg)', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '1.75rem', marginTop: '4px' }}>{tool.icon}</div>
                  <div>
                    <h3 style={{ color: 'white', margin: '0 0 6px 0', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {tool.title}
                      {tool.badge && (
                        <span style={{ fontSize: '0.6rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)', fontWeight: 700 }}>
                          {tool.badge}
                        </span>
                      )}
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{tool.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Innovative Features Showcase Section */}
          <section style={{ marginBottom: 'var(--spacing-xxl)' }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700, marginBottom: '6px' }}>Innovative Features</div>
              <h2 style={{ color: 'white', margin: 0, fontSize: '2rem' }}>✨ What Makes Us Different</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-lg)' }}>
              {[
                {
                  title: "Interactive Scratch Cards",
                  icon: "🃏",
                  desc: "Generate interactive virtual scratch cards with random code letters for participants to pick their codes. Fun and engaging way to assign evaluation codes!",
                  bullets: [
                    "Random letter generation (1-26 participants)",
                    "Interactive scratch-to-reveal with mouse/touch/keyboard",
                    "Auto-reveal at 40% scratch threshold"
                  ],
                  color: "linear-gradient(135deg, rgba(236, 72, 153, 0.05), rgba(244, 63, 94, 0.05))",
                  borderColor: "rgba(236, 72, 153, 0.15)"
                },
                {
                  title: "Participant ID Cards",
                  icon: "💳",
                  desc: "Professional participant ID cards with chest numbers, team and division details. Perfect for event identification and festival passes.",
                  bullets: [
                    "Filter by division and team for targeted printing",
                    "Individual programs list on each card",
                    "Automated card structure layout matching standards"
                  ],
                  color: "linear-gradient(135deg, rgba(79, 70, 229, 0.05), rgba(59, 130, 246, 0.05))",
                  borderColor: "rgba(79, 70, 229, 0.15)"
                },
                {
                  title: "Team Priority Sorting",
                  icon: "📊",
                  desc: "Intelligent result sorting that prioritizes programs where weaker teams perform better, ensuring balanced competition and fair opportunities for all teams.",
                  bullets: [
                    "Global team ranking calculation",
                    "Weakest team performance analysis",
                    "Strategic result declaration guidance"
                  ],
                  color: "linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(5, 150, 105, 0.05))",
                  borderColor: "rgba(16, 185, 129, 0.15)"
                },
                {
                  title: "Poster Customizer",
                  icon: "🎨",
                  desc: "Design stunning result posters with our drag-and-drop visual editor. Multiple templates, gradient backgrounds, and professional layouts ready to print or share.",
                  bullets: [
                    "Drag-and-drop element positioning",
                    "Custom backgrounds & gradient overlays",
                    "Multiple poster templates per organization"
                  ],
                  color: "linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(217, 119, 6, 0.05))",
                  borderColor: "rgba(245, 158, 11, 0.15)"
                }
              ].map((feat, idx) => (
                <div key={idx} className="glass-panel" style={{ padding: 'var(--spacing-lg)', border: `1px solid ${feat.borderColor}`, background: feat.color, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{feat.icon}</div>
                    <h3 style={{ color: 'white', margin: '0 0 10px 0', fontSize: '1.25rem' }}>{feat.title}</h3>
                    <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{feat.desc}</p>
                    
                    <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {feat.bullets.map((b, bIdx) => (
                        <li key={bIdx}>{b}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Onboarding Guide */}
          <section className="glass-panel" style={{ padding: 'var(--spacing-xl)', border: '1px solid rgba(79, 70, 229, 0.2)' }}>
            <h2 style={{ color: 'white', fontSize: '1.75rem', marginBottom: 'var(--spacing-md)' }}>🚀 Setting Up Your Fest</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--spacing-lg)', maxWidth: '800px' }}>
              Want to run this system for your college, university, or community arts fest? Follow these steps to get onboarding from Dpro_artsfest system:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-lg)' }}>
              {[
                { step: "1", title: "Provision Fest URL", desc: "Contact Dpro_artsfest system support to initialize your event database and receive your dedicated URL path." },
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
        <div className="container" style={{ maxWidth: '1050px' }}>
          <p style={{ margin: '0 0 6px 0', color: 'white', fontWeight: 600 }}>ArtsFest Management Suite</p>
          <p style={{ margin: '0 0 12px 0' }}>Developed and powered by **Dpro_artsfest system**. All rights reserved &copy; 2026.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <Link href="/login" style={{ color: 'var(--primary)' }}>Manager Login</Link>
            <span>•</span>
            <Link href="/super-admin" style={{ color: 'var(--secondary)' }}>Super Admin Console</Link>
          </div>
        </div>
      </footer>
      <LandingTourWrapper />
    </div>
  );
}
