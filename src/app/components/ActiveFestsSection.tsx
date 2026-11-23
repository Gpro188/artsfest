"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Trophy, 
  Users, 
  Layers, 
  ExternalLink, 
  ArrowRight, 
  Search, 
  Sparkles, 
  Globe, 
  Flame, 
  X,
  Compass
} from "lucide-react";

export interface SubEventSummary {
  id: string;
  name: string;
  teams: number;
  programs: number;
  categories: number;
}

export interface FestItem {
  id: string;
  name: string;
  displayName: string;
  motto: string;
  bannerUrl: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  customDomain?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  totalTeams: number;
  totalPrograms: number;
  totalCategories: number;
  subEvents: SubEventSummary[];
}

interface ActiveFestsSectionProps {
  events: FestItem[];
  dbError?: string | null;
}

// Generate stylish initials monogram for fests without a custom logo
function getFestInitials(name: string): string {
  if (!name) return "AF";
  const clean = name.replace(/[^\w\s]/gi, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase() || "AF";
}

// Ensure color contrast and safety
function sanitizeColor(hex?: string | null, fallback = "#3b82f6"): string {
  if (!hex || !hex.startsWith("#")) return fallback;
  const h = hex.toLowerCase().trim();
  if (h === "#ffffff" || h === "#fff" || h === "#000000" || h === "#000") {
    return fallback;
  }
  return hex;
}

export default function ActiveFestsSection({ events, dbError }: ActiveFestsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "custom_domain" | "multi_edition">("all");
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string, type: "banner" | "logo") => {
    setBrokenImages(prev => ({ ...prev, [`${type}_${id}`]: true }));
  };

  // Filtered fests based on search query and active tab
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Filter tab check
      if (activeFilter === "custom_domain" && !event.customDomain) {
        return false;
      }
      if (activeFilter === "multi_edition" && (!event.subEvents || event.subEvents.length === 0)) {
        return false;
      }

      // Search query check
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchName = event.displayName.toLowerCase().includes(q) || event.name.toLowerCase().includes(q);
      const matchMotto = event.motto.toLowerCase().includes(q);
      const matchDomain = event.customDomain ? event.customDomain.toLowerCase().includes(q) : false;
      const matchSub = event.subEvents.some(s => s.name.toLowerCase().includes(q));

      return matchName || matchMotto || matchDomain || matchSub;
    });
  }, [events, searchQuery, activeFilter]);

  const customDomainCount = useMemo(() => events.filter(e => Boolean(e.customDomain)).length, [events]);
  const multiEditionCount = useMemo(() => events.filter(e => e.subEvents && e.subEvents.length > 0).length, [events]);

  return (
    <section id="active-fests" style={{ padding: "5rem 1.5rem", position: "relative" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        
        {/* Section Heading & Live Badge */}
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          textAlign: "center", 
          marginBottom: "3.5rem" 
        }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.4rem 1.25rem",
            borderRadius: "9999px",
            background: "rgba(56, 189, 248, 0.1)",
            border: "1px solid rgba(56, 189, 248, 0.25)",
            color: "#38bdf8",
            fontSize: "0.85rem",
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
            marginBottom: "1rem"
          }}>
            <span className="live-dot" />
            Live Arts Festivals ({events.length})
          </div>

          <h2 style={{ 
            fontSize: "clamp(2rem, 4vw, 3rem)", 
            fontWeight: 800, 
            letterSpacing: "-1px", 
            margin: "0 0 1rem 0",
            color: "var(--text-primary)"
          }}>
            Explore Active Fests
          </h2>
          
          <p style={{ 
            fontSize: "1.15rem", 
            color: "var(--text-secondary)", 
            maxWidth: "680px", 
            margin: 0, 
            lineHeight: 1.6 
          }}>
            Discover official festival portals, view team leaderboards, stage schedules, and follow live competitive arts standings in real-time.
          </p>
        </div>

        {/* Database Error Banner if any */}
        {dbError && (
          <div style={{
            padding: "1.5rem 2rem",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.25)",
            borderRadius: "16px",
            color: "#ef4444",
            marginBottom: "2.5rem"
          }}>
            <h3 style={{ margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>⚠️</span> Database Notice
            </h3>
            <p style={{ margin: 0, fontSize: "0.95rem" }}>{dbError}</p>
          </div>
        )}

        {/* Search & Filter Bar Controls */}
        {!dbError && events.length > 0 && (
          <div style={{
            background: "var(--surface-color)",
            border: "1px solid var(--border-color)",
            borderRadius: "20px",
            padding: "1rem 1.25rem",
            marginBottom: "3rem",
            boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.05)",
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            {/* Search Input */}
            <div style={{
              position: "relative",
              flex: "1 1 320px",
              display: "flex",
              alignItems: "center"
            }}>
              <Search 
                size={18} 
                style={{ 
                  position: "absolute", 
                  left: "14px", 
                  color: "var(--text-muted)", 
                  pointerEvents: "none" 
                }} 
              />
              <input 
                type="text"
                placeholder="Search festival name, slogan, or domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem 2.5rem 0.75rem 2.6rem",
                  fontSize: "0.95rem",
                  borderRadius: "12px",
                  border: "1px solid var(--border-color-strong)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-primary)",
                  outline: "none",
                  transition: "border-color 0.2s, box-shadow 0.2s"
                }}
                className="fest-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "12px",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center"
                  }}
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filter Chips */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                onClick={() => setActiveFilter("all")}
                className={`fest-filter-chip ${activeFilter === "all" ? "active" : ""}`}
              >
                All Fests <span className="chip-badge">{events.length}</span>
              </button>
              
              <button
                onClick={() => setActiveFilter("custom_domain")}
                className={`fest-filter-chip ${activeFilter === "custom_domain" ? "active" : ""}`}
              >
                <Globe size={14} style={{ marginRight: "4px" }} />
                Custom Domains <span className="chip-badge">{customDomainCount}</span>
              </button>

              <button
                onClick={() => setActiveFilter("multi_edition")}
                className={`fest-filter-chip ${activeFilter === "multi_edition" ? "active" : ""}`}
              >
                <Layers size={14} style={{ marginRight: "4px" }} />
                Multi-Divisions <span className="chip-badge">{multiEditionCount}</span>
              </button>
            </div>
          </div>
        )}

        {/* Empty States */}
        {!dbError && events.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "5rem 2rem",
            background: "var(--surface-color)",
            border: "1px solid var(--border-color)",
            borderRadius: "24px",
            color: "var(--text-muted)"
          }}>
            <Sparkles size={48} style={{ color: "#38bdf8", margin: "0 auto 1.5rem" }} />
            <h3 style={{ fontSize: "1.5rem", color: "var(--text-primary)", margin: "0 0 0.5rem" }}>
              No Active Festivals Right Now
            </h3>
            <p style={{ maxWidth: "450px", margin: "0 auto 2rem", fontSize: "1rem", lineHeight: 1.5 }}>
              Create an arts fest in the administrative suite to broadcast scores and manage participants.
            </p>
            <Link 
              href="/login" 
              className="btn-primary" 
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.875rem 2rem",
                borderRadius: "12px",
                color: "#ffffff",
                fontWeight: 600,
                textDecoration: "none"
              }}
            >
              Launch a Festival <ArrowRight size={18} />
            </Link>
          </div>
        ) : !dbError && filteredEvents.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "4rem 2rem",
            background: "var(--surface-color)",
            border: "1px solid var(--border-color)",
            borderRadius: "24px",
            color: "var(--text-muted)"
          }}>
            <Search size={40} style={{ color: "var(--text-muted)", margin: "0 auto 1rem" }} />
            <h3 style={{ fontSize: "1.25rem", color: "var(--text-primary)", margin: "0 0 0.5rem" }}>
              No Festivals Match Your Search
            </h3>
            <p style={{ margin: "0 0 1.5rem", fontSize: "0.95rem" }}>
              Try adjusting your search terms or clearing your filter filters.
            </p>
            <button
              onClick={() => { setSearchQuery(""); setActiveFilter("all"); }}
              style={{
                padding: "0.6rem 1.5rem",
                borderRadius: "10px",
                border: "1px solid var(--border-color-strong)",
                background: "transparent",
                color: "var(--text-primary)",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Cards Grid: Best Design Box Layout */
          <div className="fest-cards-grid">
            {filteredEvents.map((event) => {
              const primaryColor = sanitizeColor(event.primaryColor, "#2563eb");
              const secondaryColor = sanitizeColor(event.secondaryColor, "#38bdf8");
              
              const isBannerBroken = brokenImages[`banner_${event.id}`];
              const isLogoBroken = brokenImages[`logo_${event.id}`];
              const hasBanner = Boolean(event.bannerUrl && !isBannerBroken);
              const hasLogo = Boolean(event.logoUrl && !isLogoBroken);

              const initials = getFestInitials(event.displayName || event.name);
              const festUrl = `/fest/${event.id}`;
              const resultsUrl = `/fest/${event.id}/results`;

              return (
                <div 
                  key={event.id} 
                  className="fest-box-card"
                  style={{
                    "--fest-accent-primary": primaryColor,
                    "--fest-accent-secondary": secondaryColor,
                  } as React.CSSProperties}
                >
                  {/* Top Banner Box */}
                  <div className="fest-banner-wrapper">
                    {hasBanner ? (
                      <img 
                        src={event.bannerUrl} 
                        alt={`${event.displayName} banner`}
                        className="fest-banner-image"
                        onError={() => handleImageError(event.id, "banner")}
                        loading="lazy"
                      />
                    ) : (
                      /* Generative Festive Graphic Banner Fallback */
                      <div 
                        className="fest-fallback-banner"
                        style={{
                          background: `radial-gradient(circle at 80% 20%, ${secondaryColor}cc 0%, ${primaryColor} 60%, #0f172a 100%)`
                        }}
                      >
                        <div className="banner-pattern-overlay" />
                        <div className="banner-watermark">
                          {initials}
                        </div>
                      </div>
                    )}

                    {/* Gradient Scrim for Contrast */}
                    <div className="fest-banner-scrim" />

                    {/* Badges on Top of Banner */}
                    <div className="banner-badges-container">
                      {/* Live Badge */}
                      <span className="live-status-pill">
                        <span className="pulsing-live-beacon" />
                        LIVE FEST
                      </span>

                      {/* Custom Domain or Multi-Edition Badges */}
                      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                        {event.customDomain && (
                          <span className="domain-pill" title={`Official Domain: ${event.customDomain}`}>
                            <Globe size={12} />
                            {event.customDomain}
                          </span>
                        )}
                        {event.subEvents && event.subEvents.length > 0 && (
                          <span className="sub-edition-pill" title="Contains multiple divisions">
                            <Layers size={12} />
                            {event.subEvents.length} Editions
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Floating Overlap Logo */}
                    <div className="fest-logo-overlap-badge">
                      {hasLogo ? (
                        <img 
                          src={event.logoUrl} 
                          alt={`${event.displayName} logo`}
                          className="fest-logo-image"
                          onError={() => handleImageError(event.id, "logo")}
                          loading="lazy"
                        />
                      ) : (
                        <div 
                          className="fest-logo-monogram"
                          style={{
                            background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                          }}
                        >
                          <span className="monogram-text">{initials}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="fest-card-content">
                    {/* Header info */}
                    <div style={{ marginBottom: "1rem" }}>
                      <Link href={festUrl} className="fest-title-link">
                        <h3 className="fest-title">
                          {event.displayName}
                        </h3>
                      </Link>

                      {/* Motto / Slogan */}
                      {event.motto ? (
                        <p className="fest-motto" title={event.motto}>
                          &ldquo;{event.motto}&rdquo;
                        </p>
                      ) : (
                        <p className="fest-motto-placeholder">
                          Official Arts & Cultural Festival Portal
                        </p>
                      )}
                    </div>

                    {/* Multi-Division Tags (if any) */}
                    {event.subEvents && event.subEvents.length > 0 && (
                      <div className="sub-divisions-strip">
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
                          Divisions:
                        </span>
                        <div className="sub-division-chips">
                          {event.subEvents.map(sub => (
                            <span key={sub.id} className="sub-chip">
                              {sub.name}
                              {sub.programs > 0 && <span className="sub-chip-count">{sub.programs}p</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stats Matrix */}
                    <div className="fest-stats-box">
                      <div className="stat-item">
                        <div className="stat-icon-wrapper" style={{ color: "#38bdf8" }}>
                          <Users size={16} />
                        </div>
                        <div className="stat-number">{event.totalTeams}</div>
                        <div className="stat-label">Teams</div>
                      </div>

                      <div className="stat-divider" />

                      <div className="stat-item">
                        <div className="stat-icon-wrapper" style={{ color: "#f59e0b" }}>
                          <Flame size={16} />
                        </div>
                        <div className="stat-number">{event.totalPrograms}</div>
                        <div className="stat-label">Programs</div>
                      </div>

                      <div className="stat-divider" />

                      <div className="stat-item">
                        <div className="stat-icon-wrapper" style={{ color: "#10b981" }}>
                          <Trophy size={16} />
                        </div>
                        <div className="stat-number">{event.totalCategories}</div>
                        <div className="stat-label">Categories</div>
                      </div>
                    </div>

                    {/* Call-to-Action Action Buttons */}
                    <div className="fest-card-actions">
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                        {/* Primary Explore Portal Button */}
                        <Link 
                          href={festUrl} 
                          className="action-btn-portal"
                        >
                          <span>Explore Fest</span>
                          <ArrowRight size={15} />
                        </Link>

                        {/* Live Results Standings Button */}
                        <Link 
                          href={resultsUrl} 
                          className="action-btn-results"
                        >
                          <Trophy size={15} />
                          <span>Results</span>
                        </Link>
                      </div>

                      {/* Branded Custom Domain Link if configured */}
                      {event.customDomain && (
                        <a 
                          href={`https://${event.customDomain}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="action-btn-custom-domain"
                        >
                          <Compass size={14} />
                          <span>Open {event.customDomain}</span>
                          <ExternalLink size={12} style={{ marginLeft: "auto", opacity: 0.7 }} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Embedded Component Styles */}
      <style jsx>{`
        /* Live Radar Beacon */
        .live-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          background: #38bdf8;
          border-radius: 50%;
          box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7);
          animation: pulse-beacon 2s infinite;
        }

        @keyframes pulse-beacon {
          0% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(56, 189, 248, 0); }
          100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
        }

        .pulsing-live-beacon {
          display: inline-block;
          width: 7px;
          height: 7px;
          background: #22c55e;
          border-radius: 50%;
          box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.8);
          animation: pulse-green 1.8s infinite;
        }

        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.8); }
          70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }

        /* Filter Chips */
        .fest-filter-chip {
          display: inline-flex;
          align-items: center;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          border: 1px solid var(--border-color-strong);
          background: var(--bg-color);
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .fest-filter-chip:hover {
          background: var(--surface-hover);
          color: var(--text-primary);
          border-color: var(--primary);
        }

        .fest-filter-chip.active {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }

        .chip-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-left: 6px;
          font-size: 0.75rem;
          padding: 1px 6px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.2);
        }

        .fest-filter-chip:not(.active) .chip-badge {
          background: var(--border-color);
          color: var(--text-primary);
        }

        /* Fest Cards Grid */
        .fest-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 2rem;
        }

        @media (max-width: 640px) {
          .fest-cards-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }

        /* Card Box Container */
        .fest-box-card {
          display: flex;
          flex-direction: column;
          background: var(--card-bg);
          border: 1px solid var(--border-color-strong);
          border-radius: 24px;
          overflow: hidden;
          position: relative;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), 
                      box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.35s ease;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
        }

        .fest-box-card:hover {
          transform: translateY(-8px);
          border-color: var(--fest-accent-primary, #2563eb);
          box-shadow: 0 20px 45px -12px rgba(0, 0, 0, 0.2), 
                      0 0 25px -5px rgba(37, 99, 235, 0.18);
        }

        /* Banner Box */
        .fest-banner-wrapper {
          position: relative;
          height: 195px;
          width: 100%;
          overflow: hidden;
          background: #0f172a;
        }

        .fest-banner-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .fest-box-card:hover .fest-banner-image {
          transform: scale(1.08);
        }

        .fest-banner-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.35) 0%, rgba(15, 23, 42, 0.85) 100%);
          pointer-events: none;
        }

        /* Fallback Graphic Banner */
        .fest-fallback-banner {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.6s ease;
        }

        .fest-box-card:hover .fest-fallback-banner {
          transform: scale(1.04);
        }

        .banner-pattern-overlay {
          position: absolute;
          inset: 0;
          opacity: 0.12;
          background-image: radial-gradient(#ffffff 1px, transparent 1px);
          background-size: 16px 16px;
        }

        .banner-watermark {
          font-size: 5rem;
          font-weight: 900;
          color: rgba(255, 255, 255, 0.12);
          letter-spacing: 4px;
          text-transform: uppercase;
          user-select: none;
        }

        /* Badges over Banner */
        .banner-badges-container {
          position: absolute;
          top: 14px;
          left: 14px;
          right: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 2;
          pointer-events: none;
        }

        .live-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #ffffff;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          padding: 4px 10px;
          border-radius: 9999px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .domain-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(16, 185, 129, 0.25);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(52, 211, 153, 0.45);
          color: #a7f3d0;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 4px 9px;
          border-radius: 9999px;
        }

        .sub-edition-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(56, 189, 248, 0.25);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(56, 189, 248, 0.4);
          color: #bae6fd;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 4px 9px;
          border-radius: 9999px;
        }

        /* Floating Logo Overlap Badge */
        .fest-logo-overlap-badge {
          position: absolute;
          bottom: -28px;
          left: 22px;
          width: 66px;
          height: 66px;
          border-radius: 18px;
          background: #ffffff;
          border: 3.5px solid var(--surface-color);
          box-shadow: 0 10px 25px -4px rgba(0, 0, 0, 0.35);
          z-index: 5;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
        }

        .fest-box-card:hover .fest-logo-overlap-badge {
          transform: translateY(-2px) scale(1.05);
        }

        .fest-logo-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 4px;
          background: #ffffff;
        }

        .fest-logo-monogram {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .monogram-text {
          font-size: 1.25rem;
          font-weight: 900;
          color: #ffffff;
          letter-spacing: 1px;
        }

        /* Card Content Body */
        .fest-card-content {
          padding: 38px 22px 22px 22px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .fest-title-link {
          text-decoration: none;
          color: inherit;
        }

        .fest-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.25;
          margin: 0 0 6px 0;
          transition: color 0.2s ease;
        }

        .fest-box-card:hover .fest-title {
          color: var(--fest-accent-primary, #2563eb);
        }

        .fest-motto {
          font-size: 0.88rem;
          color: var(--text-secondary);
          line-height: 1.4;
          margin: 0;
          font-style: italic;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .fest-motto-placeholder {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin: 0;
        }

        /* Sub-Divisions Strip */
        .sub-divisions-strip {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          margin-bottom: 4px;
          flex-wrap: wrap;
        }

        .sub-division-chips {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .sub-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
          background: rgba(99, 102, 241, 0.08);
          border: 1px solid rgba(99, 102, 241, 0.2);
          color: var(--primary);
        }

        .sub-chip-count {
          opacity: 0.75;
          font-size: 0.68rem;
        }

        /* Stats Box */
        .fest-stats-box {
          display: grid;
          grid-template-columns: 1fr auto 1fr auto 1fr;
          align-items: center;
          margin: 1.25rem 0;
          padding: 0.85rem 0.5rem;
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          text-align: center;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .stat-icon-wrapper {
          margin-bottom: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-number {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1;
        }

        .stat-label {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.75px;
          font-weight: 600;
        }

        .stat-divider {
          width: 1px;
          height: 28px;
          background: var(--border-color-strong);
          opacity: 0.6;
        }

        /* Action Buttons Area */
        .fest-card-actions {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border-color);
        }

        .action-btn-portal {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--fest-accent-primary, #2563eb) 0%, #1d4ed8 100%);
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }

        .action-btn-portal:hover {
          opacity: 0.95;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.4);
        }

        .action-btn-results {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          background: var(--surface-color);
          border: 1px solid var(--border-color-strong);
          color: var(--text-primary);
          font-size: 0.9rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .action-btn-results:hover {
          background: var(--surface-hover);
          border-color: #f59e0b;
          color: #f59e0b;
        }

        .action-btn-custom-domain {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 0.85rem;
          border-radius: 10px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.25);
          color: #10b981;
          font-size: 0.8rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .action-btn-custom-domain:hover {
          background: rgba(16, 185, 129, 0.15);
          border-color: rgba(16, 185, 129, 0.45);
        }
      `}</style>
    </section>
  );
}
