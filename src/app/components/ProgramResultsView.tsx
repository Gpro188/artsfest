"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";
import Podium, { PodiumItem } from "./Podium";
import { getTeamColor } from "@/lib/teamTheme";
import {
  ArrowLeft,
  Hourglass,
  Download,
  Share2,
  Calendar,
  MapPin,
  Layers,
  Award,
  Sparkles,
  Info,
  ChevronRight,
} from "lucide-react";

import { useSession } from "next-auth/react";

export default function ProgramResultsView({
  program,
  settings,
}: {
  program: any;
  settings: any;
}) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isAuthorizedMedia = userRole === "ADMIN" || userRole === "MEDIA";
  const [isPosterMode, setIsPosterMode] = useState(false);
  const [posterStyle, setPosterStyle] = useState<"photo" | "nophoto">("nophoto");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDataUrl, setGeneratedDataUrl] = useState<string | null>(null);
  const [isDirectDownloading, setIsDirectDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  const results = program.results || [];
  const winners = results
    .filter((r: any) => r.rank && r.rank <= 3)
    .sort((a: any, b: any) => a.rank - b.rank);
  const others = results.filter((r: any) => !r.rank || r.rank > 3);

  // Top 3 Podium Items
  const winnerPodiumItems: PodiumItem[] = winners.map((w: any) => ({
    id: w.id,
    name: w.candidate?.name || w.team?.name || "Participant",
    subName: w.candidate?.team?.name || w.team?.name || undefined,
    points: w.points,
    rank: w.rank as 1 | 2 | 3,
    photoUrl: w.candidate?.photo || w.team?.leaderPhoto,
    teamName: w.candidate?.team?.name || w.team?.name,
    teamFlagColor: w.candidate?.team?.flagColor || w.team?.flagColor,
  }));

  const finalPosterUrl = program.mediaTemplate?.imageUrl;
  // If final uploaded poster or background template exists, poster is ready
  const isPosterReady = !!(finalPosterUrl || program.category?.posterBgUrl || settings?.posterBgUrl || true);

  // In-page direct download without navigating away
  const handleDirectDownload = async () => {
    if (finalPosterUrl) {
      // If admin uploaded a finalized customized poster image, download directly
      const link = document.createElement("a");
      link.download = `${program.name}_Poster.png`;
      link.href = finalPosterUrl;
      link.target = "_blank";
      link.click();
      return;
    }

    if (!posterRef.current) return;
    setIsDirectDownloading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const dataUrl = await toPng(posterRef.current, {
        quality: 0.95,
        pixelRatio: 1.5,
        cacheBust: true,
        width: 1080,
        height: 1350,
        backgroundColor: "#ffffff",
        filter: (node: any) => {
          // Avoid trying to fetch unsupported extensions or broken external tags
          return true;
        }
      });
      const link = document.createElement("a");
      link.download = `${program.name}_Result_Poster.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error("Poster download failed, retrying without cachebust:", err);
      try {
        const fallbackUrl = await toPng(posterRef.current, {
          quality: 0.9,
          pixelRatio: 1,
          width: 1080,
          height: 1350,
          backgroundColor: "#ffffff",
        });
        const link = document.createElement("a");
        link.download = `${program.name}_Result_Poster.png`;
        link.href = fallbackUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      } catch (retryErr) {
        console.error("Fallback poster download failed:", retryErr);
        alert("Poster download failed due to browser security restrictions on background image. Please make sure the background image is uploaded via the Media Center.");
      }
    } finally {
      setIsDirectDownloading(false);
    }
  };

  const handleGeneratePoster = async () => {
    if (!posterRef.current) return;
    setIsGenerating(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const dataUrl = await toPng(posterRef.current, {
        quality: 0.95,
        pixelRatio: 1.5,
        cacheBust: true,
        width: 1080,
        height: 1350,
        backgroundColor: "#ffffff",
      });
      setGeneratedDataUrl(dataUrl);
    } catch (err) {
      console.error("Poster generation failed, attempting fallback:", err);
      try {
        const fallbackUrl = await toPng(posterRef.current, {
          quality: 0.9,
          pixelRatio: 1,
          width: 1080,
          height: 1350,
          backgroundColor: "#ffffff",
        });
        setGeneratedDataUrl(fallbackUrl);
      } catch (retryErr) {
        console.error("Fallback generation failed:", retryErr);
        alert("Could not generate poster preview. Please check console or try direct download.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = () => {
    const urlToDownload = finalPosterUrl || generatedDataUrl;
    if (!urlToDownload) return;
    const link = document.createElement("a");
    link.download = `${program.name}_Poster.png`;
    link.href = urlToDownload;
    link.click();
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const winnersSummary = winners
      .map((w: any) => {
        const name = w.candidate?.name || w.team?.name;
        const rankText = w.rank === 1 ? "1st" : w.rank === 2 ? "2nd" : "3rd";
        return `${rankText}: ${name}`;
      })
      .join("\n");

    const shareText = `🏆 *${program.event?.name || 'Arts Fest'}* 🏆\n\n*Category:* ${program.category?.name || "General"}\n*Program:* ${program.name}\n\n*Results:*\n${winnersSummary}\n\nCongratulations to all winners! 🎉\n\nView full results here:\n${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${program.name} Results`,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(waUrl, "_blank");
      }
    } else {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, "_blank");
    }
  };

  // Back link URL fallback
  const dashboardUrl = program.event?.parentId
    ? `/fest/${program.event.parentId}/results`
    : `/fest/${program.eventId}/results`;

  if (isPosterMode) {
    return (
      <div className="poster-container-modal">
        <div className="poster-toolbar">
          <button
            onClick={() => {
              setIsPosterMode(false);
              setGeneratedDataUrl(null);
            }}
            className="btn-toolbar-back"
          >
            ← Back to Results
          </button>

          {!finalPosterUrl && (
            <div className="poster-style-toggle">
              <button
                onClick={() => {
                  setPosterStyle("nophoto");
                  setGeneratedDataUrl(null);
                }}
                className={`style-btn ${posterStyle === "nophoto" ? "active" : ""}`}
              >
                📝 Text-Only
              </button>
              <button
                onClick={() => {
                  setPosterStyle("photo");
                  setGeneratedDataUrl(null);
                }}
                className={`style-btn ${posterStyle === "photo" ? "active" : ""}`}
              >
                🖼️ With Photo
              </button>
            </div>
          )}

          {!finalPosterUrl && !generatedDataUrl && isPosterReady && (
            <button
              onClick={handleGeneratePoster}
              className="btn-generate-action"
              disabled={isGenerating}
            >
              {isGenerating ? "⌛ Rendering..." : "✨ Generate Official Poster"}
            </button>
          )}

          {(finalPosterUrl || generatedDataUrl) && (
            <div className="poster-actions-group">
              <button onClick={handleDownloadImage} className="btn-download-action">
                <Download size={16} /> Download
              </button>
              <button onClick={handleShare} className="btn-share-action">
                <Share2 size={16} /> Share
              </button>
            </div>
          )}
        </div>

        <div className="poster-stage-area">
          {generatedDataUrl ? (
            <img src={generatedDataUrl} alt="Generated Poster" className="poster-preview-img" />
          ) : finalPosterUrl ? (
            <img
              src={finalPosterUrl}
              alt="Final Result Poster"
              className="poster-preview-img"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="poster-placeholder-card">
              <div className="placeholder-icon">🎨</div>
              <h3 className="font-display">Ready to Generate Result Poster</h3>
              <p>
                Click &ldquo;Generate Official Poster&rdquo; to create a high-resolution 1080x1350 announcement banner.
              </p>
            </div>
          )}
        </div>

        {/* Hidden Printable Area for html-to-image (Customized Text & Independent Layout) */}
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
          <div
            ref={posterRef}
            style={{
              width: "1080px",
              height: "1350px",
              backgroundColor: "#ffffff",
              backgroundImage: (program.category?.posterBgUrl || settings?.posterBgUrl) ? `url(${program.category?.posterBgUrl || settings?.posterBgUrl})` : "none",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              color: "#1e293b",
              position: "relative",
              overflow: "hidden",
              fontFamily: "var(--font-display)",
              boxSizing: "border-box"
            }}
          >
            {(() => {
              const align = settings?.posterTextAlignment || "left";
              const primaryColor = settings?.posterPrimaryColor || "#ffffff";
              const secondaryColor = settings?.posterSecondaryColor || "#f97316";
              const textColor = settings?.posterTextColor || "#1e293b";
              const teamColor = settings?.posterWinnerTeamColor || "#64748b";

              const showGrade = settings?.posterShowGrade !== undefined ? settings.posterShowGrade : true;
              const showRankBadge = settings?.posterShowRankBadge !== undefined ? settings.posterShowRankBadge : true;
              const showChestNumber = settings?.posterShowChestNumber !== undefined ? settings.posterShowChestNumber : true;
              const showTeam = settings?.posterShowTeam !== undefined ? settings.posterShowTeam : true;

              const progTop = settings?.posterProgramTop !== undefined && settings?.posterProgramTop !== null ? Number(settings.posterProgramTop) : 36;
              const progLeft = settings?.posterProgramLeft !== undefined && settings?.posterProgramLeft !== null ? Number(settings.posterProgramLeft) : 30;
              const progWidth = settings?.posterProgramWidth !== undefined && settings?.posterProgramWidth !== null ? Number(settings.posterProgramWidth) : 40;
              const progFontSize = settings?.posterProgramFontSize !== undefined && settings?.posterProgramFontSize !== null ? Number(settings.posterProgramFontSize) : 36;

              const catTop = settings?.posterCategoryTop !== undefined && settings?.posterCategoryTop !== null ? Number(settings.posterCategoryTop) : 40;
              const catLeft = settings?.posterCategoryLeft !== undefined && settings?.posterCategoryLeft !== null ? Number(settings.posterCategoryLeft) : 43;
              const catFontSize = settings?.posterCategoryFontSize !== undefined && settings?.posterCategoryFontSize !== null ? Number(settings.posterCategoryFontSize) : 18;
              const catColor = settings?.posterCategoryColor || "#ffffff";
              const catShow = settings?.posterCategoryShow !== undefined ? settings.posterCategoryShow : true;

              const numTop = settings?.posterNumberTop !== undefined && settings?.posterNumberTop !== null ? Number(settings.posterNumberTop) : 40;
              const numLeft = settings?.posterNumberLeft !== undefined && settings?.posterNumberLeft !== null ? Number(settings.posterNumberLeft) : 55;
              const numFontSize = settings?.posterNumberFontSize !== undefined && settings?.posterNumberFontSize !== null ? Number(settings.posterNumberFontSize) : 18;
              const numColor = settings?.posterNumberColor || "#1e293b";
              const numShow = settings?.posterNumberShow !== undefined ? settings.posterNumberShow : true;

              const winTop = settings?.posterWinnersTop !== undefined && settings?.posterWinnersTop !== null ? Number(settings.posterWinnersTop) : 46;
              const winLeft = settings?.posterWinnersLeft !== undefined && settings?.posterWinnersLeft !== null ? Number(settings.posterWinnersLeft) : 18;
              const winWidth = settings?.posterWinnersWidth !== undefined && settings?.posterWinnersWidth !== null ? Number(settings.posterWinnersWidth) : 36;
              const winNameSize = settings?.posterWinnerNameSize !== undefined && settings?.posterWinnerNameSize !== null ? Number(settings.posterWinnerNameSize) : 20;
              const winTeamSize = settings?.posterWinnerTeamSize !== undefined && settings?.posterWinnerTeamSize !== null ? Number(settings.posterWinnerTeamSize) : 13;
              const winGap = settings?.posterWinnerGap !== undefined && settings?.posterWinnerGap !== null ? Number(settings.posterWinnerGap) : 18;

              const programCode = program.programCode ? String(program.programCode).padStart(2, "0") : "01";

              return (
                <>
                  {/* Element 1: Program Name */}
                  <div style={{
                    position: "absolute",
                    top: `${progTop}%`,
                    left: `${progLeft}%`,
                    width: `${progWidth}%`,
                    textAlign: "center",
                    zIndex: 10,
                    boxSizing: "border-box"
                  }}>
                    <div style={{
                      fontSize: `${(progFontSize / 36) * 2.4}rem`,
                      fontWeight: 900,
                      color: primaryColor,
                      letterSpacing: "0.5px",
                      lineHeight: 1.15,
                      textTransform: "uppercase",
                      wordBreak: "break-word",
                      overflowWrap: "break-word"
                    }}>
                      {program.name}
                    </div>
                  </div>

                  {/* Element 2: Category Text (Pure text, NO bg) */}
                  {catShow && (
                    <div style={{
                      position: "absolute",
                      top: `${catTop}%`,
                      left: `${catLeft}%`,
                      zIndex: 10,
                      boxSizing: "border-box"
                    }}>
                      <div style={{
                        fontSize: `${(catFontSize / 18) * 1.3}rem`,
                        fontWeight: 900,
                        color: catColor,
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        lineHeight: 1
                      }}>
                        {program.category?.name || "General"}
                      </div>
                    </div>
                  )}

                  {/* Element 3: Result Number Text (Pure text, NO bg) */}
                  {numShow && (
                    <div style={{
                      position: "absolute",
                      top: `${numTop}%`,
                      left: `${numLeft}%`,
                      zIndex: 10,
                      boxSizing: "border-box"
                    }}>
                      <div style={{
                        fontSize: `${(numFontSize / 18) * 1.35}rem`,
                        fontWeight: 900,
                        color: numColor,
                        letterSpacing: "0.5px",
                        lineHeight: 1
                      }}>
                        {programCode}
                      </div>
                    </div>
                  )}

                  {/* Element 4: Winners List Box */}
                  <div style={{
                    position: "absolute",
                    top: `${winTop}%`,
                    left: `${winLeft}%`,
                    width: `${winWidth}%`,
                    display: "flex",
                    flexDirection: "column",
                    gap: `${(winGap / 16) * 18}px`,
                    zIndex: 10,
                    boxSizing: "border-box"
                  }}>
                    {winners.map((winner: any, idx: number) => {
                      const name = winner.candidate?.name || winner.team?.name || "Participant";
                      const team = winner.candidate?.team?.name || winner.team?.name || "";
                      const chest = winner.candidate?.chestNumber;
                      const grade = winner.grade;
                      const rankNum = winner.rank ? String(winner.rank).padStart(2, "0") : String(idx + 1).padStart(2, "0");
                      const rankColor = winner.rank === 1
                        ? "#10b981"
                        : winner.rank === 2
                        ? (secondaryColor || "#f97316")
                        : "#ef4444";

                      return (
                        <div
                          key={winner.id || idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "14px",
                            width: "100%",
                            justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start"
                          }}
                        >
                          {/* Circular Rank Badge (Optional) */}
                          {showRankBadge && (
                            <div style={{
                              width: "52px",
                              height: "52px",
                              borderRadius: "50%",
                              border: `3px solid ${rankColor}`,
                              color: rankColor,
                              backgroundColor: "rgba(255, 255, 255, 0.95)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 900,
                              fontSize: "1.35rem",
                              flexShrink: 0,
                              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                              order: align === "right" ? 2 : 1
                            }}>
                              {rankNum}
                            </div>
                          )}

                          {/* Candidate Name, Chest Number, Team, and Grade */}
                          <div style={{
                            display: "flex",
                            flexDirection: "column",
                            textAlign: align === "center" ? "center" : align === "right" ? "right" : "left",
                            order: align === "right" ? 1 : 2,
                            minWidth: 0,
                            flex: 1
                          }}>
                            <div style={{
                              fontSize: `${(winNameSize / 20) * 1.55}rem`,
                              fontWeight: 900,
                              color: textColor,
                              letterSpacing: "0.2px",
                              lineHeight: 1.15,
                              textTransform: "uppercase",
                              wordBreak: "break-word",
                              overflowWrap: "break-word"
                            }}>
                              {name}
                              {showChestNumber && chest && (
                                <span style={{ color: "#64748b", fontWeight: 700, marginLeft: "6px" }}>({chest})</span>
                              )}
                              {showGrade && grade && (
                                <span style={{
                                  marginLeft: "8px",
                                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                                  color: "#059669",
                                  border: "1px solid rgba(16, 185, 129, 0.4)",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  fontSize: "0.95rem",
                                  fontWeight: 900
                                }}>
                                  {grade}
                                </span>
                              )}
                            </div>

                            {showTeam && (
                              <div style={{
                                fontSize: `${(winTeamSize / 13) * 1.05}rem`,
                                fontWeight: 700,
                                color: teamColor,
                                textTransform: "uppercase",
                                marginTop: "2px",
                                lineHeight: 1.15,
                                wordBreak: "break-word",
                                overflowWrap: "break-word"
                              }}>
                                {team}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        <style jsx>{`
          .poster-container-modal {
            min-height: 100vh;
            background: #0d111e;
            color: #ffffff;
            display: flex;
            flex-direction: column;
          }
          .poster-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 1rem 1.5rem;
            background: rgba(18, 22, 42, 0.95);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            position: sticky;
            top: 0;
            z-index: 50;
            flex-wrap: wrap;
          }
          .btn-toolbar-back {
            padding: 0.5rem 1rem;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 9999px;
            color: #ffffff;
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 600;
          }
          .poster-action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(200, 151, 63, 0.4);
          }

          .poster-customize-btn {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 0.65rem 1.25rem;
            background: rgba(75, 79, 158, 0.1);
            color: var(--indigo);
            border: 1px solid var(--indigo);
            border-radius: 9999px;
            font-size: 0.85rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
          }

          .poster-customize-btn:hover {
            background: var(--indigo);
            color: #ffffff;
            transform: translateY(-1px);
          }

          .btn-disabled {
            opacity: 0.6;
            cursor: not-allowed;
            filter: grayscale(0.5);
          }
          .poster-style-toggle {
            display: flex;
            background: rgba(255, 255, 255, 0.08);
            border-radius: 9999px;
            padding: 3px;
            gap: 4px;
          }
          .style-btn {
            padding: 0.4rem 0.85rem;
            border-radius: 9999px;
            border: none;
            background: transparent;
            color: #a0aec0;
            font-size: 0.8rem;
            font-weight: 600;
            cursor: pointer;
          }
          .style-btn.active {
            background: var(--gold);
            color: var(--gold-ink);
          }
          .btn-generate-action {
            padding: 0.55rem 1.25rem;
            background: linear-gradient(135deg, var(--gold-bright) 0%, var(--gold) 100%);
            color: var(--gold-ink);
            border: none;
            border-radius: 9999px;
            font-weight: 700;
            cursor: pointer;
          }
          .poster-actions-group {
            display: flex;
            gap: 8px;
          }
          .btn-download-action {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 0.55rem 1.1rem;
            background: var(--gold);
            color: var(--gold-ink);
            border: none;
            border-radius: 9999px;
            font-weight: 700;
            cursor: pointer;
          }
          .btn-share-action {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 0.55rem 1.1rem;
            background: #25d366;
            color: #ffffff;
            border: none;
            border-radius: 9999px;
            font-weight: 700;
            cursor: pointer;
          }
          .poster-stage-area {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem 1rem;
          }
          .poster-preview-img {
            max-width: 480px;
            width: 100%;
            border-radius: 16px;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
          }
          .poster-placeholder-card {
            text-align: center;
            padding: 3rem 1.5rem;
            border: 2px dashed rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            max-width: 420px;
          }
          .placeholder-icon {
            font-size: 3rem;
            margin-bottom: 0.75rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="program-result-shell">
      {/* ─── 1. BREADCRUMB & HEADER SECTION ─── */}
      <div className="result-header-block">
        <div className="breadcrumb-row">
          <Link href={dashboardUrl} className="breadcrumb-pill-btn font-body">
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </Link>
          <span className="breadcrumb-sep font-body">/</span>
          <span className="breadcrumb-current font-body">{program.name}</span>
        </div>

        <div className="program-title-row">
          <div className="program-title-meta">
            <h1 className="program-main-title font-display">{program.name}</h1>
            <div className="program-meta-chips">
              <span className="meta-chip font-body">
                {program.event?.name || "Fest"}
              </span>
              <span className="meta-chip-dot">•</span>
              <span className="meta-chip font-body">
                {program.category?.name || "General"}
              </span>
              <span className="meta-chip-dot">•</span>
              <span className="meta-chip font-mono-num">
                {program.programCode || "PROG"}
              </span>
            </div>
          </div>

          {/* Top Share Button on Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleShare}
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '9999px',
                fontWeight: 600,
                fontSize: '0.85rem'
              }}
            >
              <Share2 size={15} />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. TWO-COLUMN RESPONSIVE LAYOUT ─── */}
      <div className="result-two-col-layout">
        {/* Main Column: Winners Podium + Full Results Table */}
        <div className="result-main-column">
          {/* WINNER PODIUM FOR TOP 3 */}
          <div className="podium-card-wrapper">
            <div className="section-head-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <h3 className="section-title font-display" style={{ margin: 0 }}>
                <Award size={20} className="icon-gold" />
                <span>Winner Board</span>
              </h3>

              {/* ONLY Single Download Poster Button in the Winner Board */}
              <button
                onClick={handleDirectDownload}
                disabled={isDirectDownloading}
                className="poster-action-btn font-body"
                style={{
                  padding: '9px 18px',
                  fontSize: '0.86rem',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: 0,
                  boxShadow: '0 4px 12px rgba(200, 151, 63, 0.35)',
                  cursor: isDirectDownloading ? 'wait' : 'pointer'
                }}
              >
                <Download size={16} />
                <span>
                  {isDirectDownloading
                    ? "Generating Poster..."
                    : downloadSuccess
                    ? "✓ Poster Downloaded!"
                    : "Download Poster"}
                </span>
              </button>
            </div>

            <Podium items={winnerPodiumItems} variant="individual" />
          </div>

          {/* FULL RESULTS TABLE */}
          <div className="full-results-card">
            <div className="section-head-row">
              <h3 className="section-title font-display">📋 All Participants & Results</h3>
            </div>

            <div className="results-table-wrap">
              <div className="results-table-header">
                <div className="col-rank">Rank / Grade</div>
                <div className="col-participant">Participant & Team</div>
                <div className="col-points">Points</div>
              </div>

              <div className="results-table-body">
                {[...winners, ...others].map((res: any, idx: number) => {
                  const teamColor = getTeamColor(
                    res.candidate?.team?.name || res.team?.name,
                    res.candidate?.team?.flagColor || res.team?.flagColor
                  );
                  const isTopRank = res.rank && res.rank <= 3;
                  const rankBadgeClass =
                    res.rank === 1
                      ? "rank-gold"
                      : res.rank === 2
                      ? "rank-silver"
                      : res.rank === 3
                      ? "rank-bronze"
                      : "rank-plain";

                  return (
                    <div
                      key={res.id || idx}
                      className={`result-entry-row ${isTopRank ? "result-entry-winner" : ""}`}
                    >
                      {/* Rank / Grade Column */}
                      <div className="col-rank">
                        {res.rank ? (
                          <span className={`rank-chip font-mono-num ${rankBadgeClass}`}>
                            {res.rank === 1
                              ? "1ST"
                              : res.rank === 2
                              ? "2ND"
                              : res.rank === 3
                              ? "3RD"
                              : `#${res.rank}`}
                          </span>
                        ) : res.grade ? (
                          <span className="grade-chip font-body">Grade {res.grade}</span>
                        ) : (
                          <span className="rank-none font-mono-num">-</span>
                        )}
                      </div>

                      {/* Participant & Team Column */}
                      <div className="col-participant">
                        <div className="participant-avatar-box">
                          {res.candidate?.photo ? (
                            <img
                              src={res.candidate.photo}
                              alt=""
                              className="participant-avatar-img"
                            />
                          ) : (
                            <div
                              className="participant-monogram font-display"
                              style={{ backgroundColor: teamColor }}
                            >
                              {(res.candidate?.name || res.team?.name || "P").charAt(0)}
                            </div>
                          )}
                        </div>

                        <div className="participant-info-block">
                          <span className="participant-name font-display">
                            {res.candidate?.name || res.team?.name}
                          </span>
                          <span className="participant-team-name font-body" style={{ color: teamColor }}>
                            {res.candidate?.team?.name || res.team?.name}
                            {res.candidate?.chestNumber && (
                              <span className="chest-badge font-mono-num">
                                #{res.candidate.chestNumber}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Points Column */}
                      <div className="col-points font-mono-num">
                        <span className="points-val">+{res.points}</span>
                        <span className="pts-lbl"> pts</span>
                      </div>
                    </div>
                  );
                })}

                {[...winners, ...others].length === 0 && (
                  <div className="no-results-box font-body">
                    <div className="no-results-icon">⏳</div>
                    <h4 className="no-results-title font-display">Result Not Published Yet</h4>
                    <p className="no-results-desc">
                      The official evaluations for this programme have not been published by the tabulators yet. Please check back shortly.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column: Program Info */}
        <div className="result-side-column">
          {/* Program Info Card */}
          <div className="program-info-card">
            <h3 className="side-card-title font-display">Program Info</h3>
            <div className="info-rows-list">
              <div className="info-data-row">
                <span className="info-label font-body">Type</span>
                <span className="info-val font-body">{program.type || "INDIVIDUAL"}</span>
              </div>
              <div className="info-data-row">
                <span className="info-label font-body">Stage</span>
                <span className="info-val font-body">{program.stageType || "ON_STAGE"}</span>
              </div>
              <div className="info-data-row">
                <span className="info-label font-body">Venue</span>
                <span className="info-val font-body">{program.venue || "Main Auditorium"}</span>
              </div>
              <div className="info-data-row">
                <span className="info-label font-body">Category</span>
                <span className="info-val font-body">{program.category?.name || "General"}</span>
              </div>
              {program.startTime && (
                <div className="info-data-row">
                  <span className="info-label font-body">Schedule</span>
                  <span className="info-val font-mono-num">
                    {new Date(program.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Share Action Card */}
          <div className="share-action-card">
            <div className="share-icon-bubble">
              <Sparkles size={20} className="icon-gold" />
            </div>
            <h4 className="share-card-heading font-display">Share Program Results</h4>
            <p className="share-card-text font-body">
              This is a verified live result page. Share direct links with teams and followers.
            </p>

            <div className="share-buttons-stack">
              <button onClick={handleShare} className="share-action-btn font-body" style={{ width: '100%' }}>
                <Share2 size={16} />
                <span>Share Results Link</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Off-screen Printable Area for html-to-image (always mounted in normal view) */}
      <div style={{ position: "fixed", left: "-9999px", top: "-9999px", pointerEvents: "none", zIndex: -100 }}>
        <div
          ref={posterRef}
          style={{
            width: "1080px",
            height: "1350px",
            backgroundColor: "#ffffff",
            color: "#1e293b",
            position: "relative",
            overflow: "hidden",
            fontFamily: "var(--font-poster)",
            boxSizing: "border-box",
            containerType: "inline-size"
          }}
        >
          {(() => {
            const rawBg = program.category?.posterBgUrl || settings?.posterBgUrl;
            if (!rawBg) return null;
            const proxiedBg = rawBg.startsWith("data:") || rawBg.startsWith("/")
              ? rawBg
              : `/api/proxy-image?url=${encodeURIComponent(rawBg)}`;
            return (
              <img
                src={proxiedBg}
                alt=""
                crossOrigin="anonymous"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "fill",
                  zIndex: 0,
                  pointerEvents: "none"
                }}
              />
            );
          })()}
          {(() => {
            const align = settings?.posterTextAlignment || "left";
            const primaryColor = settings?.posterPrimaryColor || "#ffffff";
            const secondaryColor = settings?.posterSecondaryColor || "#f97316";
            const textColor = settings?.posterTextColor || "#1e293b";
            const teamColor = settings?.posterWinnerTeamColor || "#64748b";

            const showGrade = settings?.posterShowGrade !== undefined ? settings.posterShowGrade : true;
            const showRankBadge = settings?.posterShowRankBadge !== undefined ? settings.posterShowRankBadge : true;
            const showChestNumber = settings?.posterShowChestNumber !== undefined ? settings.posterShowChestNumber : true;
            const showTeam = settings?.posterShowTeam !== undefined ? settings.posterShowTeam : true;

            const progTop = settings?.posterProgramTop !== undefined && settings?.posterProgramTop !== null ? Number(settings.posterProgramTop) : 36;
            const progLeft = settings?.posterProgramLeft !== undefined && settings?.posterProgramLeft !== null ? Number(settings.posterProgramLeft) : 30;
            const progWidth = settings?.posterProgramWidth !== undefined && settings?.posterProgramWidth !== null ? Number(settings.posterProgramWidth) : 40;
            const progFontSize = settings?.posterProgramFontSize !== undefined && settings?.posterProgramFontSize !== null ? Number(settings.posterProgramFontSize) : 36;

            const catTop = settings?.posterCategoryTop !== undefined && settings?.posterCategoryTop !== null ? Number(settings.posterCategoryTop) : 40;
            const catLeft = settings?.posterCategoryLeft !== undefined && settings?.posterCategoryLeft !== null ? Number(settings.posterCategoryLeft) : 43;
            const catFontSize = settings?.posterCategoryFontSize !== undefined && settings?.posterCategoryFontSize !== null ? Number(settings.posterCategoryFontSize) : 18;
            const catColor = settings?.posterCategoryColor || "#ffffff";
            const catShow = settings?.posterCategoryShow !== undefined ? settings.posterCategoryShow : true;

            const numTop = settings?.posterNumberTop !== undefined && settings?.posterNumberTop !== null ? Number(settings.posterNumberTop) : 40;
            const numLeft = settings?.posterNumberLeft !== undefined && settings?.posterNumberLeft !== null ? Number(settings.posterNumberLeft) : 55;
            const numFontSize = settings?.posterNumberFontSize !== undefined && settings?.posterNumberFontSize !== null ? Number(settings.posterNumberFontSize) : 18;
            const numColor = settings?.posterNumberColor || "#1e293b";
            const numShow = settings?.posterNumberShow !== undefined ? settings.posterNumberShow : true;

            const winTop = settings?.posterWinnersTop !== undefined && settings?.posterWinnersTop !== null ? Number(settings.posterWinnersTop) : 46;
            const winLeft = settings?.posterWinnersLeft !== undefined && settings?.posterWinnersLeft !== null ? Number(settings.posterWinnersLeft) : 18;
            const winWidth = settings?.posterWinnersWidth !== undefined && settings?.posterWinnersWidth !== null ? Number(settings.posterWinnersWidth) : 36;
            const winNameSize = settings?.posterWinnerNameSize !== undefined && settings?.posterWinnerNameSize !== null ? Number(settings.posterWinnerNameSize) : 20;
            const winTeamSize = settings?.posterWinnerTeamSize !== undefined && settings?.posterWinnerTeamSize !== null ? Number(settings.posterWinnerTeamSize) : 13;
            const winGap = settings?.posterWinnerGap !== undefined && settings?.posterWinnerGap !== null ? Number(settings.posterWinnerGap) : 16;

            const programCode = program.programCode ? String(program.programCode).padStart(2, "0") : "01";

            return (
              <>
                {/* Element 1: Program Name */}
                <div style={{
                  position: "absolute",
                  top: `${progTop}%`,
                  left: `${progLeft}%`,
                  width: `${progWidth}%`,
                  textAlign: "center",
                  zIndex: 10,
                  boxSizing: "border-box"
                }}>
                  <div style={{
                    fontSize: `calc(${progFontSize} * 0.095cqi)`,
                    fontWeight: 900,
                    color: primaryColor,
                    letterSpacing: "0.5px",
                    lineHeight: 1.1,
                    textTransform: "uppercase",
                    wordBreak: "break-word",
                    overflowWrap: "break-word"
                  }}>
                    {program.name}
                  </div>
                </div>

                {/* Element 2: Category Text (Pure text, NO bg) */}
                {catShow && (
                  <div style={{
                    position: "absolute",
                    top: `${catTop}%`,
                    left: `${catLeft}%`,
                    zIndex: 10,
                    boxSizing: "border-box"
                  }}>
                    <div style={{
                      fontSize: `calc(${catFontSize} * 0.1cqi)`,
                      fontWeight: 900,
                      color: catColor,
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      lineHeight: 1
                    }}>
                      {program.category?.name || "General"}
                    </div>
                  </div>
                )}

                {/* Element 3: Result Number Text (Pure text, NO bg) */}
                {numShow && (
                  <div style={{
                    position: "absolute",
                    top: `${numTop}%`,
                    left: `${numLeft}%`,
                    zIndex: 10,
                    boxSizing: "border-box"
                  }}>
                    <div style={{
                      fontSize: `calc(${numFontSize} * 0.105cqi)`,
                      fontWeight: 900,
                      color: numColor,
                      letterSpacing: "0.5px",
                      lineHeight: 1
                    }}>
                      {programCode}
                    </div>
                  </div>
                )}

                {/* Element 4: Winners List Box */}
                <div style={{
                  position: "absolute",
                  top: `${winTop}%`,
                  left: `${winLeft}%`,
                  width: `${winWidth}%`,
                  display: "flex",
                  flexDirection: "column",
                  gap: `calc(${winGap} * 0.11cqi)`,
                  zIndex: 10,
                  boxSizing: "border-box"
                }}>
                  {winners.map((winner: any, idx: number) => {
                    const name = winner.candidate?.name || winner.team?.name || "Participant";
                    const team = winner.candidate?.team?.name || winner.team?.name || "";
                    const chest = winner.candidate?.chestNumber;
                    const grade = winner.grade;
                    const rankNum = winner.rank ? String(winner.rank).padStart(2, "0") : String(idx + 1).padStart(2, "0");
                    const rankColor = winner.rank === 1
                      ? "#10b981"
                      : winner.rank === 2
                      ? (secondaryColor || "#f97316")
                      : "#ef4444";

                    const rankTopOffset = idx === 0 ? (settings?.posterRank1Top || 0) : idx === 1 ? (settings?.posterRank2Top || 0) : (settings?.posterRank3Top || 0);
                    const rankLeftOffset = idx === 0 ? (settings?.posterRank1Left || 0) : idx === 1 ? (settings?.posterRank2Left || 0) : (settings?.posterRank3Left || 0);

                    return (
                      <div
                        key={winner.id || idx}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "1.8cqi",
                          width: "100%",
                          minHeight: "8cqi",
                          justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
                          transform: (rankTopOffset !== 0 || rankLeftOffset !== 0) ? `translate(${rankLeftOffset}cqi, ${rankTopOffset}cqi)` : undefined,
                          position: "relative"
                        }}
                      >
                        {/* Circular Rank Badge (Optional) */}
                        {showRankBadge && (
                          <div style={{
                            width: "5.5cqi",
                            height: "5.5cqi",
                            borderRadius: "50%",
                            border: `0.38cqi solid ${rankColor}`,
                            color: rankColor,
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 900,
                            fontSize: "2.5cqi",
                            flexShrink: 0,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                            order: align === "right" ? 2 : 1
                          }}>
                            {rankNum}
                          </div>
                        )}

                        {/* Candidate Name, Chest Number, Team, and Grade */}
                        <div style={{
                          display: "flex",
                          flexDirection: "column",
                          textAlign: align === "center" ? "center" : align === "right" ? "right" : "left",
                          order: align === "right" ? 1 : 2,
                          minWidth: 0,
                          flex: 1
                        }}>
                          <div style={{
                            fontSize: `calc(${winNameSize} * 0.1cqi)`,
                            fontWeight: 900,
                            color: textColor,
                            letterSpacing: "0.2px",
                            lineHeight: 1.15,
                            textTransform: "uppercase",
                            wordBreak: "break-word",
                            overflowWrap: "break-word"
                          }}>
                            {name}
                            {showChestNumber && chest && (
                              <span style={{ color: "#64748b", fontWeight: 700, marginLeft: "0.8cqi" }}>({chest})</span>
                            )}
                            {showGrade && grade && (
                              <span style={{
                                marginLeft: "1cqi",
                                backgroundColor: "rgba(16, 185, 129, 0.15)",
                                color: "#059669",
                                border: "1px solid rgba(16, 185, 129, 0.4)",
                                padding: "0.2cqi 0.8cqi",
                                borderRadius: "0.8cqi",
                                fontSize: "2.2cqi",
                                fontWeight: 900
                              }}>
                                {grade}
                              </span>
                            )}
                          </div>

                          {showTeam && (
                            <div style={{
                              fontSize: `calc(${winTeamSize} * 0.12cqi)`,
                              fontWeight: 700,
                              color: teamColor,
                              textTransform: "uppercase",
                              marginTop: "0.3cqi",
                              lineHeight: 1.1,
                              wordBreak: "break-word",
                              overflowWrap: "break-word"
                            }}>
                              {team}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>
      </div>

      <style jsx>{`
        .program-result-shell {
          container-type: inline-size;
          container-name: fest-shell;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          overflow-x: hidden;
        }

        /* ─── 1. BREADCRUMB & HEADER BLOCK ─── */
        .result-header-block {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.5rem;
          box-shadow: var(--shadow-sm);
        }

        .breadcrumb-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .breadcrumb-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0.4rem 0.85rem;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 9999px;
          color: var(--text);
          font-size: 0.82rem;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s;
          box-shadow: var(--shadow-sm);
        }

        .breadcrumb-pill-btn:hover {
          background: var(--surface);
          border-color: var(--indigo);
          color: var(--indigo);
          transform: translateX(-2px);
        }

        .breadcrumb-sep {
          color: var(--muted);
          opacity: 0.5;
        }

        .breadcrumb-current {
          color: var(--muted);
          font-size: 0.82rem;
          font-weight: 600;
        }

        .program-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .program-main-title {
          margin: 0 0 6px 0;
          font-size: 2rem;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.02em;
        }

        .program-meta-chips {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--muted);
          font-size: 0.85rem;
          flex-wrap: wrap;
        }

        .meta-chip {
          font-weight: 600;
        }

        .meta-chip-dot {
          opacity: 0.5;
        }

        .poster-status-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0.5rem 1rem;
          background: #fffbeb;
          border: 1px solid #fde68a;
          color: #92400e;
          border-radius: 9999px;
          font-size: 0.82rem;
          font-weight: 600;
        }

        .spin-slow {
          animation: spinHourglass 4s ease-in-out infinite;
        }

        @keyframes spinHourglass {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(180deg); }
        }

        /* ─── 2. TWO-COLUMN LAYOUT ─── */
        .result-two-col-layout {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 1.5rem;
          align-items: flex-start;
        }

        .result-main-column {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .podium-card-wrapper,
        .full-results-card,
        .program-info-card,
        .share-action-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.5rem;
          box-shadow: var(--shadow-sm);
        }

        .section-head-row {
          margin-bottom: 1.25rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.75rem;
        }

        .section-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .icon-gold {
          color: var(--gold);
        }

        /* ─── REFLOWING RESULTS TABLE ─── */
        .results-table-wrap {
          display: flex;
          flex-direction: column;
        }

        .results-table-header {
          display: grid;
          grid-template-columns: 120px 1fr 100px;
          padding: 0.75rem 1rem;
          background: var(--bg);
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted);
          margin-bottom: 0.5rem;
        }

        .results-table-body {
          display: flex;
          flex-direction: column;
        }

        .result-entry-row {
          display: grid;
          grid-template-columns: 120px 1fr 100px;
          align-items: center;
          padding: 0.85rem 1rem;
          border-bottom: 1px solid var(--border);
          transition: background-color 0.2s;
        }

        .result-entry-row:last-child {
          border-bottom: none;
        }

        .result-entry-row:hover {
          background-color: var(--bg);
        }

        .result-entry-winner {
          background-color: rgba(200, 151, 63, 0.03);
        }

        /* Rank Chips */
        .rank-chip {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 800;
        }

        .rank-gold {
          background: linear-gradient(135deg, var(--gold-bright) 0%, var(--gold) 100%);
          color: var(--gold-ink);
        }

        .rank-silver {
          background: #e2e8f0;
          color: #334155;
        }

        .rank-bronze {
          background: #ebd4bf;
          color: #4e2e17;
        }

        .rank-plain {
          background: var(--bg);
          color: var(--muted);
          border: 1px solid var(--border);
        }

        .grade-chip {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--emerald);
        }

        .rank-none {
          color: var(--muted);
          font-weight: 600;
        }

        /* Participant column layout */
        .col-participant {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .participant-avatar-box {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }

        .participant-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .participant-monogram {
          width: 100%;
          height: 100%;
          color: #ffffff;
          font-weight: 700;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .participant-info-block {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .participant-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .participant-team-name {
          font-size: 0.78rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .chest-badge {
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--muted);
          padding: 1px 5px;
          border-radius: 4px;
          font-size: 0.7rem;
        }

        /* Points Column */
        .col-points {
          text-align: right;
          font-size: 1.05rem;
          font-weight: 800;
          color: var(--text);
        }

        .points-val {
          color: var(--emerald);
        }

        .pts-lbl {
          font-size: 0.72rem;
          color: var(--muted);
          font-weight: 600;
        }

        .no-results-msg {
          text-align: center;
          padding: 2rem;
          color: var(--muted);
        }

        /* ─── SIDEBAR COMPONENTS ─── */
        .result-side-column {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .side-card-title {
          margin: 0 0 1rem 0;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text);
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.5rem;
        }

        .info-rows-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .info-data-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--border);
        }

        .info-data-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .info-label {
          color: var(--muted);
          font-size: 0.85rem;
        }

        .info-val {
          font-weight: 700;
          font-size: 0.88rem;
          color: var(--text);
        }

        .share-action-card {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .share-icon-bubble {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(200, 151, 63, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.75rem;
        }

        .share-card-heading {
          margin: 0 0 6px 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text);
        }

        .share-card-text {
          font-size: 0.82rem;
          color: var(--muted);
          margin: 0 0 1.25rem 0;
          line-height: 1.5;
        }

        .share-buttons-stack {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .poster-action-btn {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0.75rem 1rem;
          background: linear-gradient(135deg, var(--gold-bright) 0%, var(--gold) 100%);
          color: var(--gold-ink);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
        }

        .poster-action-btn:hover:not(.btn-disabled) {
          opacity: 0.95;
          transform: translateY(-1px);
        }

        .btn-disabled {
          background: var(--bg) !important;
          color: var(--muted) !important;
          border: 1px dashed var(--border) !important;
          cursor: not-allowed !important;
          box-shadow: none !important;
        }

        .share-action-btn {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0.75rem 1rem;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          color: var(--text);
          font-weight: 600;
          font-size: 0.88rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .share-action-btn:hover {
          background: var(--surface);
          border-color: var(--muted);
        }

        /* ─── CONTAINER QUERY RESPONSIVE BREAKPOINTS ─── */
        @container fest-shell (max-width: 900px) {
          .result-two-col-layout {
            grid-template-columns: 1fr;
          }
        }

        /* Narrow viewports reflow table using CSS grid template areas */
        @container fest-shell (max-width: 580px) {
          .results-table-header {
            display: none;
          }

          .result-entry-row {
            display: grid;
            grid-template-columns: 60px 1fr 70px;
            grid-template-areas:
              "rank name points"
              "rank team points";
            gap: 2px 8px;
            padding: 0.75rem 0.5rem;
          }

          .col-rank {
            grid-area: rank;
            align-self: center;
          }

          .col-participant {
            grid-area: name;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
          }

          .participant-avatar-box {
            display: none;
          }

          .participant-name {
            font-size: 0.9rem;
          }

          .participant-team-name {
            grid-area: team;
            font-size: 0.72rem;
          }

          .col-points {
            grid-area: points;
            align-self: center;
            font-size: 0.95rem;
          }

          .program-main-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
