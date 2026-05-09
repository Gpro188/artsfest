"use client";

import { useState } from "react";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

interface SidebarProps {
  role: string;
  username: string;
  festName: string;
  festMoto: string;
}

export default function DashboardSidebar({ role, username, festName, festMoto }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);
  const close = () => setIsOpen(false);

  const NavLinks = () => (
    <>
      <Link href="/dashboard" onClick={close} className="nav-link">Dashboard Home</Link>
      <Link href="/hub" onClick={close} className="nav-link" style={{ color: 'var(--primary)', fontWeight: 700 }}>🌐 Live Hub (Slides)</Link>

      {role === 'ADMIN' && (
        <>
          <div className="nav-section-title">Admin Setup</div>
          <Link href="/dashboard/events" onClick={close} className="nav-link">Events</Link>
          <Link href="/dashboard/teams" onClick={close} className="nav-link">Teams</Link>
          <Link href="/dashboard/candidates" onClick={close} className="nav-link">Candidates (Approval)</Link>
          <Link href="/dashboard/programs" onClick={close} className="nav-link">Programs</Link>
          <Link href="/dashboard/scoring" onClick={close} className="nav-link">Results & Scoring</Link>
          <Link href="/dashboard/schedule" onClick={close} className="nav-link">Global Schedule</Link>
          <Link href="/dashboard/media" onClick={close} className="nav-link media-link">Media Branding</Link>
          <Link href="/dashboard/settings" onClick={close} className="nav-link">Settings</Link>
        </>
      )}

      {role === 'MEDIA' && (
        <>
          <div className="nav-section-title">Media Center</div>
          <Link href="/dashboard/media" onClick={close} className="nav-link media-link">Poster Branding</Link>
          <Link href="/hub" onClick={close} className="nav-link">🌐 Live Hub (Slides)</Link>
          <Link href="/dashboard/scoring" onClick={close} className="nav-link">View Results</Link>
        </>
      )}

      {role === 'MANAGER' && (
        <>
          <div className="nav-section-title">Team Manager</div>
          <Link href="/dashboard/candidates" onClick={close} className="nav-link">Candidates</Link>
          <Link href="/dashboard/assignments" onClick={close} className="nav-link">Program Assignments</Link>
          <Link href="/dashboard/schedule" onClick={close} className="nav-link">Print Team Schedule</Link>
        </>
      )}
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <header className="mobile-header no-print">
        <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--primary)' }}>{festName}</h3>
        <button onClick={toggle} className="burger-btn">
          {isOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Sidebar Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={close}></div>}

      {/* Sidebar Content */}
      <aside className={`dashboard-sidebar no-print ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.5rem' }}>{festName}</h2>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{festMoto}</div>
          <div className="user-profile">
            Logged in as <strong style={{ color: 'var(--text-primary)' }}>{username}</strong>
            <br />
            <span className="role-badge">{role.toLowerCase()}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLinks />
        </nav>

        <div className="sidebar-footer">
          <LogoutButton />
        </div>
      </aside>

      <style jsx global>{`
        .dashboard-sidebar {
          width: 260px;
          background-color: var(--surface-color);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: sticky;
          top: 0;
          transition: transform 0.3s ease;
          z-index: 1000;
        }

        .mobile-header {
          display: none;
          padding: 1rem;
          background-color: var(--surface-color);
          border-bottom: 1px solid var(--border-color);
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 1100;
        }

        .burger-btn {
          background: transparent;
          border: 1px solid var(--border-color);
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
        }

        .nav-link {
          padding: 0.75rem 1.5rem;
          display: block;
          transition: all 0.2s;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .nav-link:hover {
          background-color: rgba(255,255,255,0.05);
          color: var(--primary);
        }

        .media-link {
          color: var(--secondary);
          font-weight: 700;
        }

        .nav-section-title {
          padding: 1.5rem 1.5rem 0.5rem 1.5rem;
          font-size: 0.7rem;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.1em;
          font-weight: 700;
        }

        .sidebar-header {
          padding: 2rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .user-profile {
          margin-top: 1rem;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .role-badge {
          text-transform: capitalize;
          color: var(--accent);
          font-weight: 600;
        }

        .sidebar-nav {
          flex: 1;
          padding: 1rem 0;
          overflow-y: auto;
        }

        .sidebar-footer {
          padding: 1.5rem;
          border-top: 1px solid var(--border-color);
        }

        @media (max-width: 1024px) {
          .dashboard-sidebar {
            position: fixed;
            left: 0;
            top: 0;
            transform: translateX(-100%);
          }

          .dashboard-sidebar.open {
            transform: translateX(0);
          }

          .mobile-header {
            display: flex;
          }

          .sidebar-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(4px);
            z-index: 900;
          }
        }
      `}</style>
    </>
  );
}
