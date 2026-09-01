"use client";

import { useState } from "react";
import { createFest, createFestUser, deleteFest, deleteUser, resetUserPassword, updateFestDomain } from "../actions/superAdmin";

interface SuperAdminDashboardProps {
  initialData: {
    totalVisits: number;
    totalEvents: number;
    events: any[];
    users: any[];
  };
}

export default function SuperAdminDashboard({ initialData }: SuperAdminDashboardProps) {
  const [data, setData] = useState(initialData);
  const [festName, setFestName] = useState("");
  const [festLoading, setFestLoading] = useState(false);
  const [festMessage, setFestMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // User form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MANAGER" | "JUDGE">("ADMIN");
  const [eventId, setEventId] = useState(data.events[0]?.id || "");
  const [userLoading, setUserLoading] = useState(false);
  const [userMessage, setUserMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDeleteFest = async (eventId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the fest "${name}"? This will permanently delete all candidates, teams, programs, results, and page views associated with it. This action cannot be undone.`)) {
      return;
    }
    const res = await deleteFest(eventId);
    if (res.success) {
      alert(`Fest "${name}" deleted successfully.`);
      window.location.reload();
    } else {
      alert(res.error || "Failed to delete fest.");
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete the user account "${username}"?`)) {
      return;
    }
    const res = await deleteUser(userId);
    if (res.success) {
      alert(`User "${username}" deleted successfully.`);
      window.location.reload();
    } else {
      alert(res.error || "Failed to delete user.");
    }
  };

  const handleResetPassword = async (userId: string, username: string) => {
    const newPassword = prompt(`Enter new password for "${username}":`);
    if (newPassword === null) return; // User cancelled
    
    const passwordTrim = newPassword.trim();
    if (!passwordTrim) {
      alert("Password cannot be empty.");
      return;
    }

    const res = await resetUserPassword(userId, passwordTrim);
    if (res.success) {
      alert(`Password for "${username}" has been reset successfully.`);
    } else {
      alert(res.error || "Failed to reset password.");
    }
  };

  const handleSetDomain = async (eventId: string, currentDomain: string | null, name: string) => {
    const newDomain = prompt(`Enter custom domain for "${name}" (e.g. www.mehfil26.com) or leave empty to remove:`, currentDomain || "");
    if (newDomain === null) return; // User cancelled
    
    const domainTrim = newDomain.trim();

    const res = await updateFestDomain(eventId, domainTrim || null);
    if (res.success) {
      alert(`Domain for "${name}" updated successfully.`);
      window.location.reload();
    } else {
      alert(res.error || "Failed to update domain.");
    }
  };

  const handleCreateFest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFestLoading(true);
    setFestMessage(null);

    const res = await createFest(festName);
    if (res.success) {
      setFestMessage({ type: 'success', text: `Fest "${festName}" created successfully!` });
      setFestName("");
      // Reload page to refresh event dropdown and listings
      window.location.reload();
    } else {
      setFestMessage({ type: 'error', text: res.error || "Failed to create fest" });
    }
    setFestLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserLoading(true);
    setUserMessage(null);

    if (!eventId) {
      setUserMessage({ type: 'error', text: "Please create a Fest first before assigning users." });
      setUserLoading(false);
      return;
    }

    const res = await createFestUser({ username, password, role, eventId });
    if (res.success) {
      setUserMessage({ type: 'success', text: `User "${username}" registered successfully!` });
      setUsername("");
      setPassword("");
      // Reload page to refresh the user list
      window.location.reload();
    } else {
      setUserMessage({ type: 'error', text: res.error || "Failed to register user" });
    }
    setUserLoading(false);
  };

  return (
    <div className="super-admin-root">
      
      {/* ─── 1. TOP METRIC STATS ─── */}
      <div className="super-admin-stats-grid">
        <div className="super-admin-stat-card">
          <div className="sa-stat-icon">👁️</div>
          <div className="sa-stat-info">
            <span className="sa-stat-val font-mono-num">{data.totalVisits.toLocaleString()}</span>
            <span className="sa-stat-lbl font-body">TOTAL PAGE VIEWS</span>
          </div>
        </div>
        <div className="super-admin-stat-card">
          <div className="sa-stat-icon">🎪</div>
          <div className="sa-stat-info">
            <span className="sa-stat-val font-mono-num">{data.totalEvents}</span>
            <span className="sa-stat-lbl font-body">REGISTERED FESTIVALS</span>
          </div>
        </div>
      </div>

      {/* ─── 2. CREATION FORMS (FEST & USER) ─── */}
      <div className="sa-two-col-grid">
        {/* Create Festival Form */}
        <div className="sa-card">
          <div className="sa-card-header">
            <div className="sa-header-badge">🎪</div>
            <div>
              <h3 className="sa-card-title font-display">Create Festival Workspace</h3>
              <p className="sa-card-subtitle font-body">Provision a new multi-event festival database</p>
            </div>
          </div>

          <form onSubmit={handleCreateFest} className="sa-form">
            {festMessage && (
              <div className={`sa-alert ${festMessage.type === 'success' ? 'sa-alert-success' : 'sa-alert-error'} font-body`}>
                {festMessage.text}
              </div>
            )}
            <div className="sa-field-group">
              <label className="sa-field-label font-body">Main Event / Fest Name</label>
              <input 
                type="text" 
                className="sa-input font-body"
                placeholder="e.g. Arts Fest 2026" 
                value={festName}
                onChange={(e) => setFestName(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="sa-btn-primary font-body" disabled={festLoading}>
              {festLoading ? "Creating Fest..." : "✨ Add Main Event"}
            </button>
          </form>
        </div>

        {/* Register Scoped User */}
        <div className="sa-card">
          <div className="sa-card-header">
            <div className="sa-header-badge">👤</div>
            <div>
              <h3 className="sa-card-title font-display">Provision Scoped User</h3>
              <p className="sa-card-subtitle font-body">Grant festival admin or manager access</p>
            </div>
          </div>

          <form onSubmit={handleCreateUser} className="sa-form">
            {userMessage && (
              <div className={`sa-alert ${userMessage.type === 'success' ? 'sa-alert-success' : 'sa-alert-error'} font-body`}>
                {userMessage.text}
              </div>
            )}
            <div className="sa-input-row">
              <div className="sa-field-group">
                <label className="sa-field-label font-body">Username</label>
                <input 
                  type="text" 
                  className="sa-input font-body"
                  placeholder="e.g. manager_arts" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="sa-field-group">
                <label className="sa-field-label font-body">Password</label>
                <input 
                  type="password" 
                  className="sa-input font-body"
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="sa-input-row">
              <div className="sa-field-group">
                <label className="sa-field-label font-body">Role</label>
                <select 
                  className="sa-select font-body"
                  value={role} 
                  onChange={(e) => setRole(e.target.value as any)}
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="JUDGE">JUDGE</option>
                </select>
              </div>
              <div className="sa-field-group">
                <label className="sa-field-label font-body">Assign to Fest</label>
                <select 
                  className="sa-select font-body"
                  value={eventId} 
                  onChange={(e) => setEventId(e.target.value)}
                >
                  {data.events.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="sa-btn-primary font-body" disabled={userLoading}>
              {userLoading ? "Registering..." : "➕ Register Fest User"}
            </button>
          </form>
        </div>
      </div>

      {/* ─── 2.5. DOMAIN CONFIGURATION INSTRUCTIONS ─── */}
      <div className="sa-card sa-instructions-card">
        <div className="sa-card-header">
          <div className="sa-header-badge">🌐</div>
          <div>
            <h3 className="sa-card-title font-display">Custom Domain Configuration Guide</h3>
            <p className="sa-card-subtitle font-body">How to point a custom domain exclusively to a festival</p>
          </div>
        </div>
        <div className="sa-instructions-content font-body">
          <p style={{ marginBottom: "8px" }}><strong>Step 1: Set the Custom Domain below</strong></p>
          <p style={{ marginBottom: "16px" }}>Find your festival in the directory below and click <strong>"Set Domain"</strong>. Enter the domain (e.g. <code>bilhikma.online</code>).</p>
          
          <p style={{ marginBottom: "8px" }}><strong>Step 2: Update next.config.ts in the code</strong></p>
          <p style={{ marginBottom: "8px" }}>Next.js needs to know how to route the domain. Add the domain to the <code>rewrites()</code> function in <code>next.config.ts</code>:</p>
          <pre style={{ background: "var(--bg)", padding: "10px", borderRadius: "8px", overflowX: "auto", marginBottom: "16px", fontSize: "0.8rem", border: "1px solid var(--border)" }}><code>{`async rewrites() {
  return {
    beforeFiles: [
      {
        source: "/",
        has: [{ type: "host", value: "yourdomain.com" }],
        destination: "/fest/<FEST_ID>",
      },
      {
        source: "/:path+",
        has: [{ type: "host", value: "yourdomain.com" }],
        destination: "/fest/<FEST_ID>/:path+",
      }
    ]
  }
}`}</code></pre>
          
          <p style={{ marginBottom: "8px" }}><strong>Step 3: Add the domain in Vercel & Update DNS</strong></p>
          <ul style={{ paddingLeft: '20px', marginTop: '4px', marginBottom: "0", lineHeight: "1.6" }}>
            <li>Go to <strong>Vercel Dashboard &rarr; Project &rarr; Settings &rarr; Domains</strong> and add the domain.</li>
            <li>In your domain registrar (GoDaddy, Namecheap, etc.), add the DNS records Vercel provides.</li>
            <li>Usually: <strong>A Record</strong> for <code>@</code> pointing to <code>76.76.21.21</code> and a <strong>CNAME</strong> for <code>www</code> pointing to <code>cname.vercel-dns.com.</code></li>
          </ul>
        </div>
      </div>

      {/* ─── 3. FESTIVALS TENANT DIRECTORY TABLE ─── */}
      <div className="sa-card">
        <div className="sa-card-header">
          <div className="sa-header-badge">🎪</div>
          <div>
            <h3 className="sa-card-title font-display">Registered Festivals Directory</h3>
            <p className="sa-card-subtitle font-body">Manage festival domains, status, metrics, and actions</p>
          </div>
        </div>

        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Main Event Name</th>
                <th>Custom Domain</th>
                <th>Public URL</th>
                <th>Page Views</th>
                <th>Teams</th>
                <th>Programs</th>
                <th>Staff Users</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.events.map(ev => {
                const publicUrl = `/fest/${ev.id}`;
                return (
                  <tr key={ev.id}>
                    <td>
                      <div className="sa-cell-title font-display">{ev.name}</div>
                      <div className="sa-cell-sub font-mono-num">{ev.id}</div>
                    </td>
                    <td>
                      <div className="domain-cell-stack">
                        <span className="domain-txt font-mono-num">{ev.customDomain || "None"}</span>
                        <button 
                          onClick={() => handleSetDomain(ev.id, ev.customDomain, ev.name)}
                          className="sa-btn-domain font-body"
                        >
                          {ev.customDomain ? "Edit" : "Set Domain"}
                        </button>
                      </div>
                    </td>
                    <td>
                      <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="sa-link font-mono-num">
                        {publicUrl}
                      </a>
                    </td>
                    <td>
                      <span className="sa-chip-emerald font-mono-num">{ev._count?.pageVisits || 0} views</span>
                    </td>
                    <td className="font-mono-num">{ev._count?.teams || 0}</td>
                    <td className="font-mono-num">{ev._count?.programs || 0}</td>
                    <td className="font-mono-num">{ev._count?.users || 0}</td>
                    <td className="font-body text-muted">{new Date(ev.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button 
                        onClick={() => handleDeleteFest(ev.id, ev.name)}
                        className="sa-btn-danger font-body"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {data.events.length === 0 && (
                <tr>
                  <td colSpan={9} className="sa-empty-row font-body">No festivals provisioned yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 4. USERS TABLE LISTING ─── */}
      <div className="sa-card">
        <div className="sa-card-header">
          <div className="sa-header-badge">👥</div>
          <div>
            <h3 className="sa-card-title font-display">Scoped User Accounts</h3>
            <p className="sa-card-subtitle font-body">Manage credentials and roles per festival tenant</p>
          </div>
        </div>

        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Assigned Fest</th>
                <th>Registered At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map(u => (
                <tr key={u.id}>
                  <td>
                    <span className="sa-user-name font-display">{u.username}</span>
                  </td>
                  <td>
                    <span className={`sa-role-pill font-mono-num role-${u.role.toLowerCase()}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="font-body">{u.event?.name || "N/A (Global)"}</td>
                  <td className="font-body text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="sa-action-row">
                      <button 
                        onClick={() => handleResetPassword(u.id, u.username)}
                        className="sa-btn-warning font-body"
                      >
                        Reset Pass
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        className="sa-btn-danger font-body"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {data.users.length === 0 && (
                <tr>
                  <td colSpan={5} className="sa-empty-row font-body">No user accounts created yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .super-admin-root {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
        }

        .super-admin-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }

        .super-admin-stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: var(--shadow-sm);
        }

        .sa-stat-icon {
          font-size: 2rem;
          background: var(--bg);
          padding: 0.75rem;
          border-radius: 12px;
          border: 1px solid var(--border);
        }

        .sa-stat-info {
          display: flex;
          flex-direction: column;
        }

        .sa-stat-val {
          font-size: 1.85rem;
          font-weight: 800;
          color: var(--text);
          line-height: 1.1;
        }

        .sa-stat-lbl {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: var(--muted);
          margin-top: 4px;
        }

        .sa-two-col-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .sa-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.5rem;
          box-shadow: var(--shadow-sm);
        }

        .sa-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 1.25rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 1rem;
        }

        .sa-header-badge {
          font-size: 1.4rem;
        }

        .sa-card-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text);
        }

        .sa-card-subtitle {
          margin: 2px 0 0 0;
          font-size: 0.8rem;
          color: var(--muted);
        }

        .sa-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .sa-field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }

        .sa-field-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .sa-input, .sa-select {
          height: 44px;
          padding: 0 0.85rem;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--bg);
          color: var(--text);
          font-size: 0.9rem;
          outline: none;
        }

        .sa-input:focus, .sa-select:focus {
          border-color: var(--indigo);
          background: var(--surface);
        }

        .sa-input-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .sa-btn-primary {
          height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: linear-gradient(135deg, var(--gold-bright) 0%, var(--gold) 100%);
          color: var(--gold-ink);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .sa-btn-primary:hover {
          transform: translateY(-1px);
        }

        .sa-alert {
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .sa-alert-success {
          background: rgba(30, 122, 91, 0.12);
          color: var(--emerald);
          border: 1px solid rgba(30, 122, 91, 0.3);
        }

        .sa-alert-error {
          background: rgba(214, 69, 69, 0.12);
          color: var(--live);
          border: 1px solid rgba(214, 69, 69, 0.3);
        }

        .sa-table-wrap {
          overflow-x: auto;
        }

        .sa-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .sa-table th {
          padding: 0.75rem 1rem;
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border);
        }

        .sa-table td {
          padding: 0.85rem 1rem;
          font-size: 0.85rem;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }

        .sa-cell-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text);
        }

        .sa-cell-sub {
          font-size: 0.72rem;
          color: var(--muted);
        }

        .sa-link {
          color: var(--indigo);
          text-decoration: none;
          font-size: 0.8rem;
        }

        .sa-link:hover {
          text-decoration: underline;
        }

        .sa-chip-emerald {
          background: rgba(30, 122, 91, 0.12);
          color: var(--emerald);
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .sa-role-pill {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.72rem;
          font-weight: 800;
        }

        .role-admin {
          background: rgba(75, 79, 158, 0.15);
          color: var(--indigo);
        }

        .role-manager {
          background: rgba(200, 151, 63, 0.15);
          color: var(--gold-ink);
        }

        .sa-user-name {
          font-weight: 700;
          color: var(--text);
        }

        .domain-cell-stack {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .domain-txt {
          font-size: 0.8rem;
          color: var(--muted);
        }

        .sa-btn-domain {
          background: var(--bg);
          border: 1px solid var(--border);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.72rem;
          color: var(--text);
          cursor: pointer;
        }

        .sa-action-row {
          display: flex;
          gap: 6px;
        }

        .sa-btn-warning {
          background: rgba(200, 151, 63, 0.15);
          border: 1px solid var(--gold);
          color: var(--gold-ink);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }

        .sa-btn-danger {
          background: rgba(214, 69, 69, 0.12);
          border: 1px solid rgba(214, 69, 69, 0.3);
          color: var(--live);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }

        .sa-empty-row {
          text-align: center;
          padding: 2rem 1rem;
          color: var(--muted);
        }

        .text-muted {
          color: var(--muted);
        }

        @media (max-width: 900px) {
          .super-admin-stats-grid,
          .sa-two-col-grid {
            grid-template-columns: 1fr;
          }
          .sa-input-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
