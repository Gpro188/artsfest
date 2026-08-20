"use client";

import { useState, useEffect } from "react";
import { getPublicEventData } from "../actions/public";
import Link from "next/link";
import Podium, { PodiumItem } from "./Podium";
import { getTeamColor, getTeamSoftColor, getTeamInitials } from "@/lib/teamTheme";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  Star,
  Radio,
  ArrowRight,
  ChevronDown,
  X,
} from "lucide-react";

export default function PublicDashboard({
  initialEvents,
  initialActiveId,
}: {
  initialEvents: any[];
  initialActiveId?: string;
}) {
  const [activeEventId, setActiveEventId] = useState(
    initialActiveId || initialEvents[0]?.id || ""
  );
  const [activeTab, setActiveTab] = useState<"standings" | "hall" | "live">("standings");
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [isBannerFading, setIsBannerFading] = useState(false);
  const [data, setData] = useState<{
    latestResults: any[];
    leaderboard: any[];
    teams: any[];
    topStars: any[];
    categoryStars: Record<string, any[]>;
    stats?: {
      totalPrograms: number;
      publishedPrograms: number;
      pendingPrograms: number;
      totalCandidates: number;
      totalParticipants: number;
    };
  }>({
    latestResults: [],
    leaderboard: [],
    teams: [],
    topStars: [],
    categoryStars: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeEventId) return;

    const fetchData = async () => {
      setLoading(true);
      const res = await getPublicEventData(activeEventId);
      if (res.success && res.data) {
        setData(res.data);
        const categoryNames = Object.keys(res.data.categoryStars || {});
        if (categoryNames.length > 0) {
          setActiveCategoryTab(prev => (prev && categoryNames.includes(prev) ? prev : categoryNames[0]));
        }
      }
      setLoading(false);
    };

    fetchData();
    const interval = setInterval(fetchData, 45000);
    return () => clearInterval(interval);
  }, [activeEventId]);

  // Rotate Just Published live results banner with smooth fade-in / fade-out
  useEffect(() => {
    if (!data.latestResults || data.latestResults.length <= 1) return;

    const timer = setInterval(() => {
      setIsBannerFading(true);
      setTimeout(() => {
        setCurrentResultIndex((prev) => (prev + 1) % data.latestResults.length);
        setIsBannerFading(false);
      }, 400); // 400ms fade-out, then swap & fade-in
    }, 4000); // cycle every 4 seconds

    return () => clearInterval(timer);
  }, [data.latestResults]);

  // Client-side filtering for quick search
  const filteredResults = data.latestResults.filter((prog) =>
    prog.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prog.category?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prog.results?.some((r: any) =>
      r.candidate?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.candidate?.chestNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.team?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const maxPoints = Math.max(...data.leaderboard.map((t) => t.points), 1);
  const activeJustPublished = data.latestResults[currentResultIndex] || data.latestResults[0];

  // Map top 3 teams for the Podium component
  const teamPodiumItems: PodiumItem[] = data.leaderboard.slice(0, 3).map((team, idx) => ({
    id: team.id,
    name: team.name,
    subName: team.leaderName ? `Leader: ${team.leaderName}` : undefined,
    points: team.points,
    rank: (idx + 1) as 1 | 2 | 3,
    photoUrl: team.leaderPhoto,
    teamName: team.name,
    teamFlagColor: team.flagColor,
  }));

  const categoryNames = Object.keys(data.categoryStars || {});
  const currentCategoryStars = activeCategoryTab ? (data.categoryStars[activeCategoryTab] || []) : [];

  // Extract top winners for active just published program
  const justPubWinners = activeJustPublished?.results?.filter((r: any) => r.rank && r.rank <= 3) || [];
  const rank1Winner = justPubWinners.find((r: any) => r.rank === 1) || activeJustPublished?.results?.[0];

  return (
    <div className="fest-dashboard-shell">
      {/* ─── 1. TEAM SWITCHER (GIRLS / BOYS) ─── */}
      {initialEvents.length > 1 && (
        <div className="section-switch-wrapper">
          <div className="section-switch-pill">
            {initialEvents.map((event) => {
              const isActive = activeEventId === event.id;
              return (
                <button
                  key={event.id}
                  onClick={() => setActiveEventId(event.id)}
                  className={`section-switch-btn ${isActive ? "active" : ""}`}
                >
                  {event.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 2. SCOREBOARD STRIP (Desktop only, hidden on mobile) ─── */}
      {data.stats && (
        <div className="scoreboard-strip-card hide-on-mobile">
          <div className="stat-segment">
            <div className="stat-num font-mono-num">{data.stats.totalPrograms}</div>
            <div className="stat-label">Total Programs</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-segment highlight-emerald">
            <div className="stat-num font-mono-num">{data.stats.publishedPrograms}</div>
            <div className="stat-label">Programs Published</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-segment">
            <div className="stat-num font-mono-num">{data.stats.pendingPrograms}</div>
            <div className="stat-label">Results Pending</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-segment">
            <div className="stat-num font-mono-num">{data.stats.totalCandidates}</div>
            <div className="stat-label">Total Candidates</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-segment highlight-gold">
            <div className="stat-num font-mono-num">{data.stats.totalParticipants}</div>
            <div className="stat-label">Live Participants</div>
          </div>
        </div>
      )}

      {/* ─── 3. SEARCH ROW ─── */}
      <div className="search-row-container">
        <div className="search-pill-input-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Quick search by Programme or Chest Number..."
            className="search-pill-input font-body"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="search-clear-btn"
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <Link
          href={`/search${activeEventId ? `?eventId=${activeEventId}` : ""}`}
          className="advanced-search-btn font-body"
        >
          <SlidersHorizontal size={16} />
          <span>Advanced Search</span>
        </Link>
      </div>

      {/* ─── 4. "JUST PUBLISHED" BANNER (Full Program Results Announcement) ─── */}
      {activeJustPublished && !searchQuery && (
        <div className="just-published-banner">
          <div className="just-pub-top-row">
            <div className="just-pub-badge">
              <Sparkles size={14} />
              <span>JUST PUBLISHED RESULT</span>
            </div>
            {activeJustPublished.category?.name && (
              <span className="just-pub-cat font-body">
                {activeJustPublished.category.name}
              </span>
            )}
          </div>
          
          <div className={`just-pub-info ${isBannerFading ? "fade-out" : "fade-in"}`}>
            <h4 className="just-pub-title font-display">
              {activeJustPublished.name}
            </h4>

            {/* Total Results Summary: 1st, 2nd, 3rd */}
            <div className="just-pub-winners-strip">
              {justPubWinners.length > 0 ? (
                justPubWinners.map((w: any) => {
                  const teamColor = getTeamColor(
                    w.candidate?.team?.name || w.team?.name,
                    w.candidate?.team?.flagColor || w.team?.flagColor
                  );
                  const rankLabel = w.rank === 1 ? "1st" : w.rank === 2 ? "2nd" : "3rd";
                  return (
                    <span key={w.id} className="just-pub-winner-tag font-body">
                      <strong className="rank-tag-lbl font-mono-num">{rankLabel}:</strong>{" "}
                      {w.candidate?.name || w.team?.name}{" "}
                      <span style={{ color: teamColor, fontWeight: 700 }}>
                        ({w.candidate?.team?.name || w.team?.name})
                      </span>
                    </span>
                  );
                })
              ) : rank1Winner ? (
                <span className="just-pub-winner-tag font-body">
                  <strong>Winner:</strong> {rank1Winner.candidate?.name || rank1Winner.team?.name}
                </span>
              ) : null}
            </div>
          </div>

          <Link
            href={`/results/${activeJustPublished.id}`}
            className="just-pub-cta font-body"
          >
            <span>View Full Result</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* ─── 5. TABS NAVIGATION ─── */}
      <div className="tabs-nav-bar">
        {[
          { id: "standings", label: "Standings", icon: Trophy },
          { id: "hall", label: "Hall of Fame", icon: Star },
          { id: "live", label: "Live Feed", icon: Radio },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`nav-tab-btn ${isActive ? "active font-display" : "font-body"}`}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── CONTENT AREA ─── */}
      {loading ? (
        <div className="dashboard-loading-state">
          <div className="spinner-glow" />
          <p className="font-display">Fetching live festival scores...</p>
        </div>
      ) : searchQuery ? (
        /* ─── SEARCH RESULTS OVERLAY ─── */
        <div className="search-results-pane">
          <div className="pane-header">
            <h3 className="font-display">Search Results ({filteredResults.length})</h3>
            <p className="pane-sub">Matching &ldquo;{searchQuery}&rdquo;</p>
          </div>
          {filteredResults.length > 0 ? (
            <div className="search-results-list">
              {filteredResults.map((prog, i) => {
                const programWinners = prog.results?.filter((r: any) => r.rank && r.rank <= 3) || [];
                const topWinner = programWinners[0] || prog.results?.[0];
                const teamColor = topWinner
                  ? getTeamColor(
                      topWinner.candidate?.team?.name || topWinner.team?.name,
                      topWinner.candidate?.team?.flagColor || topWinner.team?.flagColor
                    )
                  : "var(--indigo)";
                
                return (
                  <Link
                    key={prog.id || i}
                    href={`/results/${prog.id}`}
                    className="search-item-row"
                  >
                    <div className="search-item-left">
                      <div
                        className="search-item-badge"
                        style={{ backgroundColor: teamColor }}
                      >
                        {prog.name.charAt(0)}
                      </div>
                      <div className="search-item-info">
                        <div className="search-item-name font-display">
                          {prog.name}
                        </div>
                        <div className="search-item-meta">
                          {prog.category?.name}
                        </div>
                      </div>
                    </div>
                    <div className="search-item-right">
                      <div className="search-item-rank font-display">
                        View Result
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="dashboard-empty-card">
              <div className="empty-icon">🔍</div>
              <h4 className="font-display">No results found</h4>
              <p>Try searching for a different program name or chest number.</p>
            </div>
          )}
        </div>
      ) : activeTab === "standings" ? (
        /* ─── TAB 1: STANDINGS ─── */
        <div className="standings-layout">
          {/* Main Column: Podium + Leaderboard */}
          <div className="standings-main-col">
            <div className="leaderboard-card">
              <div className="card-header-row">
                <div>
                  <h3 className="card-title font-display">🏆 Team Leaderboard</h3>
                  <p className="card-subtitle">Live cumulative standings across all events</p>
                </div>
              </div>

              {/* PODIUM VISUALIZATION */}
              <Podium items={teamPodiumItems} variant="team" />

              {/* RANKED LIST OF TEAMS */}
              <div className="ranked-team-list">
                {data.leaderboard.map((team, index) => {
                  const teamColor = getTeamColor(team.name, team.flagColor);
                  const softColor = getTeamSoftColor(team.name, team.flagColor);
                  const isTop = index === 0;

                  return (
                    <div
                      key={team.id}
                      className={`ranked-team-row ${isTop ? "ranked-team-top" : ""}`}
                    >
                      <div className="team-row-meta">
                        {/* Rank Badge */}
                        <div
                          className="team-rank-pill font-mono-num"
                          style={{
                            backgroundColor: teamColor,
                            color: '#ffffff',
                          }}
                        >
                          #{index + 1}
                        </div>

                        {/* Team Name + Leader */}
                        <div className="team-row-name-col">
                          <div className="team-row-name font-display">{team.name}</div>
                          {team.leaderName && (
                            <div className="team-row-leader">Leader: {team.leaderName}</div>
                          )}
                        </div>

                        {/* Points Total */}
                        <div className="team-row-points font-mono-num">
                          {team.points} <span className="pts-suffix">pts</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="team-progress-track">
                        <div
                          className="team-progress-fill"
                          style={{
                            width: `${(team.points / maxPoints) * 100}%`,
                            background: `linear-gradient(90deg, ${teamColor} 0%, ${softColor} 100%)`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar Column: Team Detail Cards */}
          <div className="standings-side-col">
            <h3 className="side-section-title font-display">🚩 Team Details</h3>
            <div className="team-cards-grid">
              {data.leaderboard.map((team) => {
                const teamColor = getTeamColor(team.name, team.flagColor);
                return (
                  <div
                    key={team.id}
                    className="team-detail-card"
                    style={{ borderTopColor: teamColor }}
                  >
                    <div className="team-avatar-wrapper">
                      {team.leaderPhoto ? (
                        <img
                          src={team.leaderPhoto}
                          alt={team.leaderName || team.name}
                          className="team-leader-img"
                        />
                      ) : (
                        <div
                          className="team-leader-monogram font-display"
                          style={{ backgroundColor: teamColor }}
                        >
                          {getTeamInitials(team.name)}
                        </div>
                      )}
                    </div>
                    <h4 className="team-card-name font-display">{team.name}</h4>
                    <p className="team-card-leader">
                      {team.leaderName ? `Leader: ${team.leaderName}` : "Active Team"}
                    </p>
                    <div
                      className="team-card-score font-mono-num"
                      style={{ color: teamColor }}
                    >
                      {team.points} <span className="pts-label">PTS</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : activeTab === "hall" ? (
        /* ─── TAB 2: HALL OF FAME ─── */
        <div className="hall-layout">
          {/* Left Column: Overall Top 5 Stars */}
          <div className="hall-overall-col">
            <h3 className="side-section-title font-display">👑 Overall Top 5 Stars</h3>

            {data.topStars.length === 0 ? (
              <div className="dashboard-empty-card">
                <p>No individual champions recorded yet.</p>
              </div>
            ) : (
              <div className="top-stars-container">
                {/* #1 Featured Star */}
                {data.topStars[0] && (
                  <div className="featured-star-card">
                    <div className="featured-star-badge font-mono-num">
                      <Sparkles size={14} />
                      <span>RANK #1 STAR</span>
                    </div>
                    <div className="featured-star-body">
                      <div
                        className="featured-avatar"
                        style={{
                          borderColor: getTeamColor(data.topStars[0].teamName, data.topStars[0].teamColor),
                        }}
                      >
                        {data.topStars[0].photo ? (
                          <img
                            src={data.topStars[0].photo}
                            alt={data.topStars[0].name}
                            className="avatar-img"
                          />
                        ) : (
                          <div
                            className="avatar-placeholder font-display"
                            style={{
                              backgroundColor: getTeamColor(
                                data.topStars[0].teamName,
                                data.topStars[0].teamColor
                              ),
                            }}
                          >
                            {data.topStars[0].name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="featured-details">
                        <h4 className="featured-name font-display">{data.topStars[0].name}</h4>
                        <div className="featured-meta">
                          <span
                            className="featured-team"
                            style={{
                              color: getTeamColor(data.topStars[0].teamName, data.topStars[0].teamColor),
                            }}
                          >
                            {data.topStars[0].teamName}
                          </span>
                          {' • '}
                          <span>{data.topStars[0].categoryName}</span>
                        </div>
                        <div className="featured-pts font-mono-num">
                          {data.topStars[0].points} <span className="pts-label">pts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ranks 2-5 in a compact card */}
                {data.topStars.slice(1).length > 0 && (
                  <div className="compact-stars-card">
                    {data.topStars.slice(1).map((star, idx) => {
                      const rankNum = idx + 2;
                      const teamColor = getTeamColor(star.teamName, star.teamColor);

                      return (
                        <div key={star.id || idx} className="compact-star-row">
                          <div className="compact-rank font-mono-num">#{rankNum}</div>
                          <div
                            className="compact-avatar"
                            style={{
                              backgroundColor: star.photo ? 'transparent' : teamColor,
                              borderColor: teamColor,
                            }}
                          >
                            {star.photo ? (
                              <img src={star.photo} alt={star.name} className="avatar-img" />
                            ) : (
                              <span className="font-display">{star.name.charAt(0)}</span>
                            )}
                          </div>
                          <div className="compact-info">
                            <div className="compact-name font-display">{star.name}</div>
                            <div className="compact-meta">
                              <span style={{ color: teamColor, fontWeight: 600 }}>
                                {star.teamName}
                              </span>{' '}
                              • {star.categoryName}
                            </div>
                          </div>
                          <div className="compact-pts font-mono-num">
                            {star.points} <span className="pts-label">pts</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Category Champions (Dropdown selector on top) */}
          <div className="hall-category-col">
            <h3 className="side-section-title font-display">🎖️ Category Champions</h3>
            <div className="category-champs-card">
              {categoryNames.length > 0 ? (
                <>
                  {/* Modern Dropdown & Category Selector */}
                  <div className="category-selector-header">
                    <label className="cat-selector-label font-body">Select Category:</label>
                    <div className="cat-select-box">
                      <select
                        value={activeCategoryTab}
                        onChange={(e) => setActiveCategoryTab(e.target.value)}
                        className="cat-dropdown-select font-body"
                      >
                        {categoryNames.map((catName) => (
                          <option key={catName} value={catName}>
                            {catName}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="cat-dropdown-icon" />
                    </div>
                  </div>

                  {/* Ranked list for active category */}
                  <div className="cat-stars-list">
                    {currentCategoryStars.length > 0 ? (
                      currentCategoryStars.map((star, idx) => {
                        const teamColor = getTeamColor(star.teamName, star.teamColor);
                        return (
                          <div key={star.id || idx} className="cat-star-item">
                            <div className="cat-star-rank font-mono-num">#{idx + 1}</div>
                            <div className="cat-star-info">
                              <div className="cat-star-name font-display">{star.name}</div>
                              <div className="cat-star-team" style={{ color: teamColor }}>
                                {star.teamName}
                              </div>
                            </div>
                            <div className="cat-star-pts font-mono-num">
                              {star.points} <span className="pts-label">pts</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="dashboard-empty-card">
                        <p>No champions recorded for {activeCategoryTab} yet.</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="dashboard-empty-card">
                  <p>No categories configured yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ─── TAB 3: LIVE FEED (Guaranteed within bounds and neatly formatted) ─── */
        <div className="live-feed-layout">
          <div className="feed-header-row">
            <div className="live-feed-pill">
              <span className="live-dot" />
              <span className="font-mono-num">LATEST 10 PUBLISHED RESULTS</span>
            </div>
          </div>

          {data.latestResults.length === 0 ? (
            <div className="dashboard-empty-card empty-feed-state">
              <div className="empty-icon">⏳</div>
              <h4 className="font-display">No new results yet</h4>
              <p>
                Judges and tabulators are evaluating performances. Published results
                will stream live directly to this feed as soon as verified.
              </p>
            </div>
          ) : (
            <div className="feed-programs-list">
              {data.latestResults.map((prog, i) => {
                const programWinners = prog.results?.filter((r: any) => r.rank && r.rank <= 3) || [];
                const topWinner = programWinners[0] || prog.results?.[0];
                const topTeamColor = topWinner
                  ? getTeamColor(topWinner.candidate?.team?.name || topWinner.team?.name, topWinner.candidate?.team?.flagColor || topWinner.team?.flagColor)
                  : "var(--indigo)";

                return (
                  <Link
                    key={prog.id || i}
                    href={`/results/${prog.id}`}
                    className={`feed-program-card ${i === 0 ? "feed-program-featured" : ""}`}
                  >
                    <div className="feed-card-header">
                      <div className="feed-card-title-col">
                        <h4 className="feed-program-title font-display">{prog.name}</h4>
                        {prog.category?.name && (
                          <span className="feed-program-cat font-body">{prog.category.name}</span>
                        )}
                      </div>
                      <div className="feed-view-btn font-body">
                        <span>View Result</span>
                        <ArrowRight size={14} />
                      </div>
                    </div>

                    {/* Winners Grid */}
                    <div className="feed-winners-grid">
                      {programWinners.length > 0 ? (
                        programWinners.map((w: any) => {
                          const teamColor = getTeamColor(
                            w.candidate?.team?.name || w.team?.name,
                            w.candidate?.team?.flagColor || w.team?.flagColor
                          );
                          const rankLabel = w.rank === 1 ? "1st" : w.rank === 2 ? "2nd" : "3rd";
                          return (
                            <div key={w.id} className="feed-winner-item">
                              <span className={`feed-winner-rank-badge font-mono-num rank-${w.rank}`}>
                                {rankLabel}
                              </span>
                              <div className="feed-winner-meta">
                                <span className="feed-winner-name font-display">
                                  {w.candidate?.name || w.team?.name}
                                </span>
                                <span className="feed-winner-team" style={{ color: teamColor }}>
                                  {w.candidate?.team?.name || w.team?.name}
                                </span>
                              </div>
                              <span className="feed-winner-pts font-mono-num">
                                +{w.points} pts
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="feed-single-winner font-body">
                          <strong>Winner:</strong> {topWinner?.candidate?.name || topWinner?.team?.name || "Participant"}
                          {topWinner && (
                            <span className="feed-winner-pts font-mono-num"> +{topWinner.points} pts</span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .fest-dashboard-shell {
          container-type: inline-size;
          container-name: fest-shell;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          overflow-x: hidden;
        }

        /* ─── 1. TEAM SWITCHER (GIRLS/BOYS) ─── */
        .section-switch-wrapper {
          display: flex;
          justify-content: center;
          width: 100%;
          padding: 0 0.5rem;
          box-sizing: border-box;
        }

        .section-switch-pill {
          display: inline-flex;
          background: var(--surface);
          padding: 4px;
          border-radius: 9999px;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
          max-width: 100%;
          box-sizing: border-box;
        }

        .section-switch-btn {
          padding: 0.5rem 1.25rem;
          border-radius: 9999px;
          border: none;
          background: transparent;
          color: var(--muted);
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          text-align: center;
        }

        .section-switch-btn:hover {
          color: var(--text);
        }

        .section-switch-btn.active {
          background: linear-gradient(135deg, var(--maroon) 0%, #b83247 100%);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(156, 43, 60, 0.35);
        }

        @media (max-width: 480px) {
          .section-switch-pill {
            width: 100%;
            display: flex;
          }
          .section-switch-btn {
            flex: 1;
            padding: 0.45rem 0.5rem;
            font-size: 0.76rem;
          }
        }

        /* ─── 2. SCOREBOARD STRIP ─── */
        .scoreboard-strip-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          padding: 1.25rem 0.75rem;
          align-items: center;
        }

        .stat-segment {
          text-align: center;
          padding: 0.25rem 0.5rem;
        }

        .stat-num {
          font-size: 1.85rem;
          font-weight: 800;
          color: var(--text);
          line-height: 1.1;
        }

        .stat-label {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted);
          margin-top: 4px;
        }

        .stat-divider {
          width: 1px;
          height: 36px;
          background: var(--border);
          margin: 0 auto;
          display: none;
        }

        .highlight-emerald .stat-num {
          color: var(--emerald);
        }

        .highlight-gold .stat-num {
          color: var(--gold-ink);
        }

        /* ─── 3. SEARCH ROW ─── */
        .search-row-container {
          display: flex;
          gap: 12px;
          align-items: center;
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
        }

        .search-pill-input-box {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 18px;
          color: var(--muted);
          pointer-events: none;
        }

        .search-pill-input {
          width: 100%;
          height: 48px;
          padding-left: 48px;
          padding-right: 40px;
          border-radius: 9999px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          font-size: 0.92rem;
          box-shadow: var(--shadow-sm);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .search-pill-input:focus {
          border-color: var(--indigo);
          box-shadow: 0 0 0 3px var(--indigo-soft);
        }

        .search-clear-btn {
          position: absolute;
          right: 14px;
          background: transparent;
          border: none;
          color: var(--muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }

        .advanced-search-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 48px;
          padding: 0 1.5rem;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 9999px;
          color: var(--text);
          font-weight: 600;
          font-size: 0.88rem;
          text-decoration: none;
          box-shadow: var(--shadow-sm);
          transition: all 0.2s;
          white-space: nowrap;
        }

        .advanced-search-btn:hover {
          background: var(--bg);
          border-color: var(--muted);
        }

        /* ─── 4. "JUST PUBLISHED" BANNER (FADE-IN / FADE-OUT) ─── */
        .just-published-banner {
          background: linear-gradient(135deg, var(--ink) 0%, var(--ink-soft) 100%);
          border-radius: var(--radius);
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          color: #ffffff;
          box-shadow: var(--shadow-md);
          border: 1px solid rgba(255, 255, 255, 0.08);
          min-height: 72px;
        }

        .just-pub-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(200, 151, 63, 0.2);
          border: 1px solid var(--gold);
          color: var(--gold-bright);
          padding: 0.35rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          flex-shrink: 0;
        }

        .just-pub-info {
          flex: 1;
          min-width: 0;
          transition: opacity 0.4s ease-in-out, transform 0.4s ease-in-out;
        }

        .just-pub-info.fade-in {
          opacity: 1;
          transform: translateY(0);
        }

        .just-pub-info.fade-out {
          opacity: 0;
          transform: translateY(-4px);
        }

        .just-pub-title {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 700;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .just-pub-sub {
          margin: 2px 0 0 0;
          font-size: 0.82rem;
          color: #a0aec0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .just-pub-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0.55rem 1.1rem;
          background: linear-gradient(135deg, var(--gold-bright) 0%, var(--gold) 100%);
          color: var(--gold-ink);
          border-radius: 9999px;
          font-weight: 700;
          font-size: 0.85rem;
          text-decoration: none;
          transition: transform 0.2s;
          flex-shrink: 0;
        }

        .just-pub-cta:hover {
          transform: translateX(2px);
        }

        /* ─── 5. TABS NAVIGATION ─── */
        .tabs-nav-bar {
          display: flex;
          gap: 1.5rem;
          border-bottom: 2px solid var(--border);
          justify-content: center;
          margin-top: 0.5rem;
        }

        .nav-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
          color: var(--muted);
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .nav-tab-btn:hover {
          color: var(--text);
        }

        .nav-tab-btn.active {
          color: var(--gold-ink);
          border-bottom-color: var(--gold);
          font-weight: 700;
        }

        /* ─── 6. STANDINGS TAB ─── */
        .standings-layout {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 1.5rem;
          align-items: flex-start;
        }

        .leaderboard-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
          padding: 1.5rem;
        }

        .card-header-row {
          margin-bottom: 1rem;
        }

        .card-title {
          margin: 0;
          font-size: 1.35rem;
          font-weight: 700;
          color: var(--text);
        }

        .card-subtitle {
          margin: 4px 0 0 0;
          font-size: 0.8rem;
          color: var(--muted);
        }

        .ranked-team-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 1.5rem;
          border-top: 1px solid var(--border);
          padding-top: 1.5rem;
        }

        .ranked-team-row {
          padding: 0.75rem 1rem;
          background: var(--bg);
          border-radius: 12px;
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ranked-team-top {
          background: rgba(200, 151, 63, 0.08);
          border-color: var(--gold-bright);
        }

        .team-row-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .team-rank-pill {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.85rem;
          flex-shrink: 0;
        }

        .team-row-name-col {
          flex: 1;
          min-width: 0;
        }

        .team-row-name {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text);
          margin: 0;
        }

        .team-row-leader {
          font-size: 0.75rem;
          color: var(--muted);
        }

        .team-row-points {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--text);
        }

        .pts-suffix {
          font-size: 0.75rem;
          color: var(--muted);
          font-weight: 600;
        }

        .team-progress-track {
          height: 8px;
          background: rgba(18, 22, 42, 0.06);
          border-radius: 9999px;
          overflow: hidden;
        }

        .team-progress-fill {
          height: 100%;
          border-radius: 9999px;
          transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Standings Sidebar Cards */
        .side-section-title {
          margin: 0 0 1rem 0;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text);
        }

        .team-cards-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .team-detail-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-top: 4px solid var(--primary);
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
          padding: 1.25rem 1rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .team-avatar-wrapper {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          margin-bottom: 0.5rem;
          overflow: hidden;
        }

        .team-leader-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .team-leader-monogram {
          width: 100%;
          height: 100%;
          color: white;
          font-weight: 700;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .team-card-name {
          margin: 0;
          font-size: 1rem;
          font-weight: 700;
          color: var(--text);
        }

        .team-card-leader {
          margin: 2px 0 6px 0;
          font-size: 0.75rem;
          color: var(--muted);
        }

        .team-card-score {
          font-size: 1.15rem;
          font-weight: 800;
        }

        /* ─── 7. HALL OF FAME TAB ─── */
        .hall-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          align-items: flex-start;
        }

        .top-stars-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .featured-star-card {
          background: linear-gradient(135deg, #fffdf8 0%, #fef8eb 100%);
          border: 1.5px solid var(--gold-bright);
          border-radius: var(--radius);
          padding: 1.5rem;
          box-shadow: var(--shadow-md);
        }

        .featured-star-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: var(--gold);
          color: var(--gold-ink);
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          padding: 0.25rem 0.65rem;
          border-radius: 9999px;
          margin-bottom: 1rem;
        }

        .featured-star-body {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .featured-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          border: 3px solid var(--gold);
          overflow: hidden;
          flex-shrink: 0;
          background: var(--surface);
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          color: white;
          font-weight: 800;
          font-size: 1.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .featured-details {
          flex: 1;
          min-width: 0;
        }

        .featured-name {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text);
        }

        .featured-meta {
          font-size: 0.82rem;
          color: var(--muted);
          margin-top: 2px;
        }

        .featured-team {
          font-weight: 700;
        }

        .featured-pts {
          margin-top: 6px;
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--gold-ink);
        }

        .compact-stars-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }

        .compact-star-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0.85rem 1.25rem;
          border-bottom: 1px solid var(--border);
        }

        .compact-star-row:last-child {
          border-bottom: none;
        }

        .compact-rank {
          font-weight: 800;
          font-size: 1rem;
          color: var(--muted);
          width: 24px;
        }

        .compact-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid var(--border);
          overflow: hidden;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 0.95rem;
        }

        .compact-info {
          flex: 1;
          min-width: 0;
        }

        .compact-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .compact-meta {
          font-size: 0.75rem;
          color: var(--muted);
        }

        .compact-pts {
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--text);
        }

        /* Category Champions Selector */
        .category-champs-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
          padding: 1.25rem;
        }

        .category-selector-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 1.25rem;
          padding-bottom: 0.85rem;
          border-bottom: 1px solid var(--border);
          flex-wrap: wrap;
        }

        .cat-selector-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .cat-select-box {
          position: relative;
          display: inline-flex;
          align-items: center;
          min-width: 180px;
        }

        .cat-dropdown-select {
          width: 100%;
          height: 40px;
          padding: 0 36px 0 14px;
          border-radius: 10px;
          border: 1.5px solid var(--border);
          background: var(--bg);
          color: var(--text);
          font-size: 0.88rem;
          font-weight: 700;
          outline: none;
          appearance: none;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .cat-dropdown-select:focus {
          border-color: var(--indigo);
          box-shadow: 0 0 0 3px var(--indigo-soft);
        }

        .cat-dropdown-icon {
          position: absolute;
          right: 12px;
          color: var(--muted);
          pointer-events: none;
        }

        .cat-stars-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .cat-star-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: var(--bg);
          border-radius: 10px;
          border: 1px solid var(--border);
          gap: 10px;
        }

        .cat-star-rank {
          font-size: 0.9rem;
          font-weight: 800;
          color: var(--gold-ink);
          width: 24px;
        }

        .cat-star-info {
          flex: 1;
          min-width: 0;
        }

        .cat-star-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text);
        }

        .cat-star-team {
          font-size: 0.75rem;
          font-weight: 600;
        }

        .cat-star-pts {
          font-size: 1rem;
          font-weight: 800;
          color: var(--text);
        }

        /* ─── 8. LIVE FEED TAB (PROGRAM RESULTS) ─── */
        .live-feed-layout {
          max-width: 800px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }

        .feed-header-row {
          margin-bottom: 1rem;
          display: flex;
          justify-content: center;
        }

        .live-feed-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(214, 69, 69, 0.12);
          border: 1px solid rgba(214, 69, 69, 0.3);
          color: var(--live);
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.05em;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--live);
        }

        .feed-programs-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          box-sizing: border-box;
        }

        .feed-program-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
          padding: 1.15rem 1.25rem;
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
          box-sizing: border-box;
          width: 100%;
        }

        .feed-program-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--gold-bright);
        }

        .feed-program-featured {
          border-left: 4px solid var(--emerald);
        }

        .feed-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 8px;
        }

        .feed-card-title-col {
          min-width: 0;
          flex: 1;
        }

        .feed-program-title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text);
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .feed-program-cat {
          font-size: 0.75rem;
          color: var(--muted);
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.04em;
        }

        .feed-view-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--indigo);
          flex-shrink: 0;
        }

        .feed-winners-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 8px;
          width: 100%;
          box-sizing: border-box;
        }

        .feed-winner-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0.5rem 0.75rem;
          background: var(--bg);
          border-radius: 8px;
          border: 1px solid var(--border);
          min-width: 0;
          box-sizing: border-box;
        }

        .feed-winner-rank-badge {
          font-size: 0.75rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .rank-1 {
          background: rgba(200, 151, 63, 0.2);
          color: var(--gold-ink);
          border: 1px solid var(--gold);
        }

        .rank-2 {
          background: rgba(160, 174, 192, 0.2);
          color: #4a5568;
          border: 1px solid #a0aec0;
        }

        .rank-3 {
          background: rgba(200, 153, 122, 0.2);
          color: #7c4a27;
          border: 1px solid #c8997a;
        }

        .feed-winner-meta {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .feed-winner-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .feed-winner-team {
          font-size: 0.7rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .feed-winner-pts {
          font-size: 0.8rem;
          font-weight: 800;
          color: var(--emerald);
          flex-shrink: 0;
          text-align: right;
        }

        .feed-single-winner {
          font-size: 0.85rem;
          color: var(--text);
        }

        /* ─── JUST PUBLISHED WINNERS STRIP STYLES ─── */
        .just-pub-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 4px;
        }

        .just-pub-cat {
          font-size: 0.72rem;
          color: var(--gold-bright);
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        .just-pub-winners-strip {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 12px;
          margin-top: 4px;
        }

        .just-pub-winner-tag {
          font-size: 0.82rem;
          color: #e2e8f0;
        }

        .rank-tag-lbl {
          color: var(--gold-bright);
        }

        @media (max-width: 540px) {
          .feed-winners-grid {
            grid-template-columns: 1fr;
          }
          .feed-program-card {
            padding: 0.85rem 0.75rem;
          }
          .feed-winner-item {
            padding: 0.4rem 0.5rem;
          }
        }

        /* ─── EMPTY & LOADING STATES ─── */
        .dashboard-empty-card {
          background: var(--surface);
          border: 1px dashed var(--border);
          border-radius: var(--radius);
          padding: 2.5rem 1.5rem;
          text-align: center;
          color: var(--muted);
        }

        .empty-feed-state {
          max-width: 540px;
          margin: 0 auto;
        }

        .empty-icon {
          font-size: 2.5rem;
          margin-bottom: 0.75rem;
        }

        .dashboard-loading-state {
          text-align: center;
          padding: 4rem 1rem;
          color: var(--muted);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .spinner-glow {
          width: 36px;
          height: 36px;
          border: 3px solid var(--border);
          border-top-color: var(--gold);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ─── SEARCH RESULTS OVERLAY ─── */
        .search-results-pane {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.5rem;
          box-shadow: var(--shadow-sm);
        }

        .pane-header {
          margin-bottom: 1rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.75rem;
        }

        .pane-sub {
          margin: 2px 0 0 0;
          font-size: 0.82rem;
          color: var(--muted);
        }

        .search-results-list {
          display: flex;
          flex-direction: column;
        }

        .search-item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 0;
          border-bottom: 1px solid var(--border);
          color: inherit;
          text-decoration: none;
          gap: 10px;
        }

        .search-item-row:last-child {
          border-bottom: none;
        }

        .search-item-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          flex: 1;
        }

        .search-item-badge {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.85rem;
          flex-shrink: 0;
        }

        .search-item-info {
          min-width: 0;
          flex: 1;
        }

        .search-item-name {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .search-item-meta {
          font-size: 0.78rem;
          color: var(--muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .search-item-right {
          text-align: right;
          flex-shrink: 0;
        }

        .search-item-rank {
          font-size: 0.9rem;
          font-weight: 800;
          color: var(--gold-ink);
        }

        .search-item-pts {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--emerald);
        }

        /* ─── CONTAINER QUERY RESPONSIVE BREAKPOINTS ─── */
        @container fest-shell (max-width: 900px) {
          .standings-layout,
          .hall-layout {
            grid-template-columns: 1fr;
          }
          .scoreboard-strip-card {
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }
        }

        /* HIDE COUNT / STATS ON MOBILE / NARROW SCREENS (< 640px) */
        @container fest-shell (max-width: 640px) {
          .hide-on-mobile {
            display: none !important;
          }
          .search-row-container {
            flex-direction: column;
          }
          .advanced-search-btn {
            width: 100%;
            justify-content: center;
          }
          .just-published-banner {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
          .just-pub-cta {
            width: 100%;
            justify-content: center;
          }
        }

        @container fest-shell (max-width: 440px) {
          .tabs-nav-bar {
            gap: 0.5rem;
          }
          .nav-tab-btn {
            padding: 0.6rem 0.5rem;
            font-size: 0.85rem;
          }
          .category-selector-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .cat-select-box {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
