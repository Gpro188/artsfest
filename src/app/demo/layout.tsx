import Link from "next/link";
import { ReactNode } from "react";

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      backgroundColor: '#050505', 
      color: '#f8fafc',
      fontFamily: 'var(--font-sans)',
      overflowX: 'hidden'
    }}>
      <style>{`
        .demo-glass-header { background: rgba(10, 10, 10, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .demo-nav-link { color: #94a3b8; text-decoration: none; font-weight: 500; font-size: 0.95rem; padding: 0.5rem 1rem; border-radius: 8px; transition: all 0.2s; }
        .demo-nav-link:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .demo-nav-link.active { color: #38bdf8; background: rgba(56, 189, 248, 0.1); font-weight: 600; }
        .demo-content-container { flex: 1; display: flex; flex-direction: column; }
      `}</style>
      
      {/* Top Navigation specifically for Demo */}
      <header className="demo-glass-header" style={{ position: 'sticky', top: 0, zIndex: 50, padding: '1rem 0' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: '#fff' }}>
              <span style={{ fontSize: '1.2rem' }}>&larr;</span>
              <span style={{ fontWeight: 600 }}>Back</span>
            </Link>
            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }}></div>
            <span style={{ fontWeight: 700, fontSize: '1.25rem', color: '#38bdf8' }}>Demo Fest</span>
          </div>

          <nav style={{ display: 'flex', gap: '0.5rem' }}>
            <Link href="/demo" className="demo-nav-link">Guide</Link>
            <Link href="/demo/results" className="demo-nav-link">Results</Link>
            <Link href="/demo/poster" className="demo-nav-link">Poster</Link>
            <Link href="/demo/idcard" className="demo-nav-link">ID Card</Link>
          </nav>
        </div>
      </header>

      <div className="demo-content-container">
        {children}
      </div>
    </div>
  );
}
