"use client";

import Link from 'next/link';
import { Search, LogIn, ArrowLeft } from 'lucide-react';

interface FestHeaderProps {
  festName: string;
  festMoto?: string | null;
  festLogo?: string | null;
  searchUrl?: string;
  loginUrl?: string;
  backUrl?: string;
  backLabel?: string;
}

export default function FestHeader({
  festName,
  festMoto,
  festLogo,
  searchUrl = '/search',
  loginUrl = '/login',
  backUrl,
  backLabel = 'Back',
}: FestHeaderProps) {
  const initial = (festName || 'Fest').charAt(0).toUpperCase();

  return (
    <header className="fest-header">
      <div className="fest-header-container">
        {/* Left: Monogram Mark + Back Button + Fest Name + Subtitle */}
        <div className="fest-header-left">
          {backUrl && (
            <Link href={backUrl} className="fest-back-btn font-body" title={backLabel}>
              <ArrowLeft size={16} />
              <span className="fest-back-text">{backLabel}</span>
            </Link>
          )}

          <div className="fest-mark-circle">
            {festLogo ? (
              <img src={festLogo} alt="" className="fest-mark-img" />
            ) : (
              <span className="fest-mark-letter font-display">{initial}</span>
            )}
          </div>

          <div className="fest-title-block">
            <Link href={backUrl || "/"} className="fest-name-link">
              <h1 className="fest-name font-display">{festName}</h1>
            </Link>
            {festMoto && <div className="fest-subtitle font-body">{festMoto}</div>}
          </div>
        </div>

        {/* Right: LIVE Pulsing Badge, Search, Login */}
        <div className="fest-header-right">
          <div className="fest-live-pill font-mono-num">
            <span className="fest-live-dot" />
            <span className="fest-live-text">LIVE</span>
          </div>

          <Link href={searchUrl} className="fest-action-btn fest-search-btn" title="Search">
            <Search size={16} />
            <span className="fest-btn-label">Search</span>
          </Link>

          <Link href={loginUrl} className="fest-action-btn fest-login-btn" title="Login">
            <LogIn size={16} />
            <span className="fest-btn-label">Login</span>
          </Link>
        </div>
      </div>

      <style jsx>{`
        .fest-header {
          position: sticky;
          top: 0;
          z-index: 60;
          background: linear-gradient(135deg, var(--ink) 0%, var(--ink-soft) 100%);
          border-bottom: 1px solid rgba(229, 230, 240, 0.12);
          box-shadow: 0 4px 20px rgba(18, 22, 42, 0.25);
          width: 100%;
        }

        .fest-header-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0.75rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .fest-header-left {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          min-width: 0;
        }

        .fest-mark-circle {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--gold-bright) 0%, var(--gold) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(200, 151, 63, 0.35);
          border: 1.5px solid rgba(255, 255, 255, 0.25);
        }

        .fest-mark-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .fest-mark-letter {
          color: var(--gold-ink);
          font-weight: 800;
          font-size: 1.35rem;
          line-height: 1;
        }

        .fest-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.85rem;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 9999px;
          color: #ffffff;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .fest-back-btn:hover {
          background: rgba(255, 255, 255, 0.16);
          color: var(--gold-bright);
        }

        .fest-title-block {
          min-width: 0;
        }

        .fest-name-link {
          text-decoration: none;
          color: inherit;
        }

        .fest-name {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.02em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .fest-subtitle {
          font-size: 0.72rem;
          color: var(--gold-bright);
          letter-spacing: 0.03em;
          opacity: 0.9;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .fest-header-right {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-shrink: 0;
        }

        .fest-live-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(214, 69, 69, 0.18);
          border: 1px solid rgba(214, 69, 69, 0.4);
          color: #ff6b6b;
          padding: 0.3rem 0.65rem;
          border-radius: 9999px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
        }

        .fest-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--live);
          box-shadow: 0 0 8px var(--live);
          animation: pulseDot 1.8s ease-in-out infinite;
        }

        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }

        .fest-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.9rem;
          border-radius: 9999px;
          font-size: 0.82rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .fest-search-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #e5e6f0;
        }

        .fest-search-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }

        .fest-login-btn {
          background: linear-gradient(135deg, var(--gold-bright) 0%, var(--gold) 100%);
          color: var(--gold-ink);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 2px 8px rgba(200, 151, 63, 0.3);
        }

        .fest-login-btn:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }

        /* Responsive Media Queries (Mobile & Tablet) */
        @media (max-width: 640px) {
          .fest-header-container {
            padding: 0.55rem 0.75rem;
            gap: 0.5rem;
          }
          .fest-header-left {
            gap: 0.5rem;
          }
          .fest-mark-circle {
            width: 34px;
            height: 34px;
          }
          .fest-mark-letter {
            font-size: 1.1rem;
          }
          .fest-name {
            font-size: 1rem;
            max-width: 140px;
          }
          .fest-subtitle {
            display: none;
          }
          .fest-header-right {
            gap: 0.35rem;
          }
          .fest-live-pill {
            padding: 0.25rem 0.5rem;
            font-size: 0.65rem;
            gap: 4px;
          }
          .fest-live-dot {
            width: 5px;
            height: 5px;
          }
          .fest-btn-label {
            display: none;
          }
          .fest-action-btn {
            padding: 0;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }

        @media (max-width: 380px) {
          .fest-name {
            font-size: 0.9rem;
            max-width: 100px;
          }
          .fest-live-text {
            display: none;
          }
          .fest-live-pill {
            padding: 0.3rem;
            border-radius: 50%;
          }
        }
      `}</style>
    </header>
  );
}
