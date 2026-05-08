import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) return null;

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: 'var(--spacing-md)' }}>Welcome to Arts Fest Dashboard</h1>
      
      <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Quick Stats</h3>
        <p style={{ color: 'var(--text-secondary)' }}>
          You are logged in as {session.user.username} with role <strong>{session.user.role}</strong>.
        </p>
        <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--spacing-xs)' }}>
          Use the sidebar to navigate to your specific tasks.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: 'var(--spacing-lg)', marginTop: 'var(--spacing-lg)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Manager Resources</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
          To upload candidate photos and get a URL, use these free services:
        </p>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <a href="https://imgbb.com" target="_blank" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>🚀 ImgBB</a>
          <a href="https://postimages.org" target="_blank" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>🖼️ PostImages</a>
          <a href="https://imgur.com/upload" target="_blank" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>🎨 Imgur</a>
        </div>
      </div>
    </div>
  );
}
