import { prisma } from "@/lib/prisma";
import Link from "next/link";
import VisitTracker from "./components/VisitTracker";
import Header from "./components/Header";
import ActiveFestsSection, { FestItem } from "./components/ActiveFestsSection";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let events: FestItem[] = [];
  let dbError = null;

  try {
    const rawEvents = await prisma.event.findMany({
      where: { parentId: null },
      select: {
        id: true,
        name: true,
        customDomain: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        globalSetting: {
          select: {
            festName: true,
            festMoto: true,
            festLogo: true,
            posterBgUrl: true,
            posterLogoUrl: true,
            posterPrimaryColor: true,
            posterSecondaryColor: true,
          }
        },
        homepageSetting: {
          select: {
            heroTitle: true,
            heroSubtitle: true,
            heroBgUrl: true,
            primaryColor: true,
            secondaryColor: true,
            pinnedButtonLogoUrl: true,
            aboutTitle: true,
            aboutText: true,
          }
        },
        _count: {
          select: { teams: true, programs: true, categories: true }
        },
        subEvents: {
          select: {
            id: true,
            name: true,
            _count: {
              select: { teams: true, programs: true, categories: true }
            },
            globalSetting: {
              select: {
                festLogo: true,
                posterBgUrl: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    events = rawEvents.map(event => {
      let totalTeams = event._count.teams;
      let totalPrograms = event._count.programs;
      let totalCategories = event._count.categories;
      
      const subEventsSummary = [];
      if (event.subEvents && event.subEvents.length > 0) {
        for (const sub of event.subEvents) {
          totalTeams += sub._count.teams;
          totalPrograms += sub._count.programs;
          totalCategories += sub._count.categories;

          subEventsSummary.push({
            id: sub.id,
            name: sub.name,
            teams: sub._count.teams,
            programs: sub._count.programs,
            categories: sub._count.categories,
          });
        }
      }

      // Resolve Banner Image (homepage hero -> global poster -> subevent poster -> empty)
      const bannerUrl = 
        event.homepageSetting?.heroBgUrl?.trim() || 
        event.globalSetting?.posterBgUrl?.trim() || 
        event.subEvents?.find(s => s.globalSetting?.posterBgUrl?.trim())?.globalSetting?.posterBgUrl?.trim() || 
        "";

      // Resolve Logo Image (global logo -> homepage pinned -> poster logo -> subevent logo -> empty)
      const logoUrl = 
        event.globalSetting?.festLogo?.trim() || 
        event.homepageSetting?.pinnedButtonLogoUrl?.trim() || 
        event.globalSetting?.posterLogoUrl?.trim() || 
        event.subEvents?.find(s => s.globalSetting?.festLogo?.trim())?.globalSetting?.festLogo?.trim() || 
        "";

      // Resolve Display Name & Motto
      const displayName = 
        event.homepageSetting?.heroTitle?.trim() || 
        event.globalSetting?.festName?.trim() || 
        event.name;

      const motto = 
        event.homepageSetting?.heroSubtitle?.trim() || 
        event.globalSetting?.festMoto?.trim() || 
        "";

      const primaryColor = 
        event.homepageSetting?.primaryColor?.trim() || 
        event.globalSetting?.posterPrimaryColor?.trim() || 
        "#2563eb";

      const secondaryColor = 
        event.homepageSetting?.secondaryColor?.trim() || 
        event.globalSetting?.posterSecondaryColor?.trim() || 
        "#38bdf8";

      return {
        id: event.id,
        name: event.name,
        displayName,
        motto,
        bannerUrl,
        logoUrl,
        primaryColor,
        secondaryColor,
        customDomain: event.customDomain,
        startDate: event.startDate ? event.startDate.toISOString() : null,
        endDate: event.endDate ? event.endDate.toISOString() : null,
        totalTeams,
        totalPrograms,
        totalCategories,
        subEvents: subEventsSummary
      };
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
        .btn-primary { background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); transition: opacity 0.2s, box-shadow 0.2s; }
        .btn-primary:hover { opacity: 0.95; box-shadow: 0 0 20px rgba(37,99,235,0.4); }
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
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/demo" className="btn-primary" style={{ display: 'inline-block', padding: '1rem 2.5rem', fontSize: '1.1rem', fontWeight: 600, color: '#ffffff', borderRadius: '12px', textDecoration: 'none' }}>
                Experience Demo Fest
              </Link>
              <a href="#active-fests" className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', fontSize: '1.1rem', fontWeight: 600, borderRadius: '12px', textDecoration: 'none' }}>
                Explore Active Fests ↓
              </a>
              <Link href="/login" className="btn-outline" style={{ display: 'inline-block', padding: '1rem 2rem', fontSize: '1.1rem', fontWeight: 600, borderRadius: '12px', textDecoration: 'none' }}>
                Client Portal
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

        {/* Active Festivals Section with Logo, Banner, and Best Design Box Layout */}
        <ActiveFestsSection events={events} dbError={dbError} />
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
    </div>
  );
}
