import { getProgramResults } from "@/app/actions/public";
import ProgramResultsView from "@/app/components/ProgramResultsView";
import { notFound } from "next/navigation";
import { getSettings } from "@/lib/settings";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ProgramResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getProgramResults(id);
  const session = await getServerSession(authOptions);

  if (!res.success || !res.data) {
    notFound();
  }

  const { program, settings: rawSettings } = res.data;
  const userRole = session?.user?.role;

  const settings = rawSettings || {
    festName: "Arts Fest",
    festMoto: "Celebrating Creativity",
    festLogo: null
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
       {/* Simple Header for Results Page */}
       <header style={{ 
        padding: 'var(--spacing-md) 0', 
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(10px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }} className="no-print">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: 'var(--radius-md)', 
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1rem'
            }}>
              {settings.festName.charAt(0)}
            </div>
            <h1 style={{ fontSize: '1.2rem', margin: 0 }}>{settings.festName} Results</h1>
          </Link>
          <Link href="/search" className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}>
            🔍 Search
          </Link>
        </div>
      </header>

      <main style={{ flex: 1, padding: 'var(--spacing-xl) 0' }}>
        <div className="container">
            <ProgramResultsView program={program} settings={settings} userRole={userRole} />
        </div>
      </main>

      <footer style={{ padding: 'var(--spacing-lg) 0', borderTop: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-muted)' }} className="no-print">
        <div className="container">
          <p>&copy; 2026 {settings.festName} • Official Results Feed</p>
        </div>
      </footer>
    </div>
  );
}
