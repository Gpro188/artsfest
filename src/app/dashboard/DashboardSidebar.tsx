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
      <Link href="/dashboard" onClick={close} className="nav-link-wrapper">
        <span className="nav-link-main">Dashboard Home</span>
        <span className="nav-link-subtitle">Overview & quick stats</span>
      </Link>
      <Link href="/hub" onClick={close} className="nav-link-wrapper" style={{ borderLeftColor: 'transparent' }}>
        <span className="nav-link-main" style={{ color: 'var(--primary)', fontWeight: 700 }}>Live Hub (Slides)</span>
        <span className="nav-link-subtitle">Real-time public standings</span>
      </Link>

      {role === 'ADMIN' && (
        <>
          <div className="nav-section-title">Admin Setup</div>
          <Link href="/dashboard/events" onClick={close} className="nav-link-wrapper">
            <span className="nav-link-main">Events</span>
            <span className="nav-link-subtitle">Create & manage festival events</span>
          </Link>
          <Link href="/dashboard/teams" onClick={close} className="nav-link-wrapper">
            <span className="nav-link-main">Teams</span>
            <span className="nav-link-subtitle">Teams, managers & flag colors</span>
          </Link>
          <Link href="/dashboard/candidates" onClick={close} className="nav-link-wrapper">
            <span className="nav-link-main">Candidates (Approval)</span>
            <span className="nav-link-subtitle">Register & approve participants</span>
          </Link>
          <Link href="/dashboard/programs" onClick={close} className="nav-link-wrapper">
            <span className="nav-link-main">Programs</span>
            <span className="nav-link-subtitle">Competition programs & rules</span>
          </Link>
          <Link href="/dashboard/scoring" onClick={close} className="nav-link-wrapper">
            <span className="nav-link-main">Results & Scoring</span>
            <span className="nav-link-subtitle">Enter marks & publish results</span>
          </Link>
          <Link href="/dashboard/schedule" onClick={close} className="nav-link-wrapper">
            <span className="nav-link-main">Global Schedule</span>
            <span className="nav-link-subtitle">Timeline & venue planning</span>
          </Link>
          <Link href="/dashboard/media" onClick={close} className="nav-link-wrapper">
            <span className="nav-link-main" style={{ color: 'var(--secondary)', fontWeight: 700 }}>Media Branding</span>
            <span className="nav-link-subtitle">Posters, logos & branding</span>
          </Link>
          <Link href="/dashboard/settings" onClick={close} className="nav-link-wrapper">
            <span className="nav-link-main">Settings</span>
            <span className="nav-link-subtitle">Config, audit & maintenance</span>
          </Link>
        </>
      )}

      {role === 'MEDIA' && (
        <>
          <div className="nav-section-title">Media Center</div>
          <Link href="/dashboard/media" onClick={close} className="nav-link-wrapper">
            <span className="nav-link-main" style={{ color: 'var(--secondary)', fontWeight: 700 }}>Poster Branding</span>
            <span className="nav-link-subtitle">Design result posters</span>
          </Link>
          <Link href="/hub" onClick={close} className="nav-link-wrapper">
            <span className="nav-link-main">Live Hub (Slides)</span>
            <span className="nav-link-subtitle">Real-time public standings</span>
          </Link>
          <Link href="/dashboard/scoring" onClick={close} className="nav-link-wrapper">
            <span className="nav-link-main">View Results</span>
            <span className="nav-link-subtitle">Browse published results</span>
          </Link>
        </>
      )}

      {role === 'MANAGER' && (
        <>
          <div className="nav-section-title">Team Manager</div>
          <Link href="/dashboard/candidates" onClick={close} className="nav-link-wrapper">
            <span className="nav-link-main">Candidates</span>
            <span className="nav-link-subtitle">Register your team's participants</span>
          </Link>
          <Link href="/dashboard/assignments" onClick={close} className="nav-link-wrapper">
            <span className="nav-link-main">Program Assignments</span>
            <span className="nav-link-subtitle">Enroll candidates in programs</span>
          </Link>
          <Link href="/dashboard/schedule" onClick={close} className="nav-link-wrapper">
            <span className="nav-link-main">Print Team Schedule</span>
            <span className="nav-link-subtitle">View & print team timetable</span>
          </Link>
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

        .nav-link-wrapper {
          padding: 0.6rem 1.5rem;
          display: block;
          transition: all 0.2s;
          border-left: 3px solid transparent;
          text-decoration: none;
        }

        .nav-link-wrapper:hover {
          background-color: rgba(255,255,255,0.05);
          border-left-color: var(--primary);
        }

        .nav-link-main {
          display: block;
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 0.9rem;
          transition: color 0.2s;
        }

        .nav-link-wrapper:hover .nav-link-main {
          color: var(--primary);
        }

        .nav-link-subtitle {
          display: block;
          font-size: 0.65rem;
          color: var(--text-muted);
          margin-top: 2px;
          line-height: 1.3;
          font-weight: 400;
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
