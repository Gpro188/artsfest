import { getHubData } from "../actions/hub";
import HubClient from "../components/HubClient";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import HubTourWrapper from "./HubTourWrapper";
import { Suspense } from "react";

export const revalidate = 30; // Revalidate every 30 seconds to save serverless invocations

export default async function HubPage() {
  const settings = await getSettings();
  const res = await getHubData();
  const events = (res.success && res.data) ? res.data : [];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: 'var(--spacing-md) 0', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <h1 style={{ fontSize: '1.2rem', margin: 0 }}>{settings.festName} <span style={{ color: 'var(--primary)', fontWeight: 400 }}>Hub</span></h1>
          </Link>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <Link href="/search" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Search</Link>
            <Link href="/dashboard" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '8px 15px' }}>Dashboard</Link>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, padding: 'var(--spacing-xl) 0' }}>
        <div className="container">
          <Suspense fallback={<div className="glass-panel" style={{ padding: '50px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Hub...</div>}>
            <HubClient events={events} />
          </Suspense>
        </div>
      </main>

      <footer style={{ padding: 'var(--spacing-xl) 0', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.8rem' }}>
        <p>&copy; {new Date().getFullYear()} {settings.festName} Management Hub. All rights reserved.</p>
      </footer>

      <HubTourWrapper />
    </div>
  );
}
