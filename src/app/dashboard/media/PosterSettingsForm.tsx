"use client";

import { useState, useRef } from "react";
import { updatePosterSettings } from "./actions";
import ImageUpload from "../../components/ImageUpload";
import { AlignLeft, AlignCenter, AlignRight, CheckSquare, Square, Type, Award, Hash, Trophy, Palette, Eye, EyeOff, Download } from "lucide-react";
import { toPng } from "html-to-image";

export default function PosterSettingsForm({ initialSettings, sampleProgram }: { initialSettings: any, sampleProgram?: any }) {
  const [loading, setLoading] = useState(false);
  const [isDownloadingTest, setIsDownloadingTest] = useState(false);
  const [testDownloadSuccess, setTestDownloadSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"program" | "category" | "number" | "winners" | "toggles" | "colors">("program");
  const testPosterRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    posterHeaderUrl: initialSettings?.posterHeaderUrl || "",
    posterFooterUrl: initialSettings?.posterFooterUrl || "",
    posterCongratulationUrl: "",
    posterLogoUrl: "",
    posterBgUrl: initialSettings?.posterBgUrl || "",
    posterPrimaryColor: initialSettings?.posterPrimaryColor || "#ffffff",
    posterSecondaryColor: initialSettings?.posterSecondaryColor || "#f97316",
    posterTextColor: initialSettings?.posterTextColor || "#1e293b",
    posterTextAlignment: initialSettings?.posterTextAlignment || "left",
    posterShowGrade: initialSettings?.posterShowGrade !== undefined ? initialSettings.posterShowGrade : true,
    
    // Program Name
    posterProgramTop: initialSettings?.posterProgramTop !== undefined ? Number(initialSettings.posterProgramTop) : 36,
    posterProgramLeft: initialSettings?.posterProgramLeft !== undefined ? Number(initialSettings.posterProgramLeft) : 30,
    posterProgramWidth: initialSettings?.posterProgramWidth !== undefined ? Number(initialSettings.posterProgramWidth) : 40,
    posterProgramFontSize: initialSettings?.posterProgramFontSize !== undefined ? Number(initialSettings.posterProgramFontSize) : 36,

    // Category (Text only, no bg)
    posterCategoryTop: initialSettings?.posterCategoryTop !== undefined ? Number(initialSettings.posterCategoryTop) : 40,
    posterCategoryLeft: initialSettings?.posterCategoryLeft !== undefined ? Number(initialSettings.posterCategoryLeft) : 43,
    posterCategoryFontSize: initialSettings?.posterCategoryFontSize !== undefined ? Number(initialSettings.posterCategoryFontSize) : 18,
    posterCategoryColor: initialSettings?.posterCategoryColor || "#ffffff",
    posterCategoryShow: initialSettings?.posterCategoryShow !== undefined ? initialSettings.posterCategoryShow : true,

    // Result Number (Text only, no bg)
    posterNumberTop: initialSettings?.posterNumberTop !== undefined ? Number(initialSettings.posterNumberTop) : 40,
    posterNumberLeft: initialSettings?.posterNumberLeft !== undefined ? Number(initialSettings.posterNumberLeft) : 55,
    posterNumberFontSize: initialSettings?.posterNumberFontSize !== undefined ? Number(initialSettings.posterNumberFontSize) : 18,
    posterNumberColor: initialSettings?.posterNumberColor || "#1e293b",
    posterNumberShow: initialSettings?.posterNumberShow !== undefined ? initialSettings.posterNumberShow : true,

    // Winners Box & Granular Text Options
    posterWinnersTop: initialSettings?.posterWinnersTop !== undefined ? Number(initialSettings.posterWinnersTop) : 46,
    posterWinnersLeft: initialSettings?.posterWinnersLeft !== undefined ? Number(initialSettings.posterWinnersLeft) : 18,
    posterWinnersWidth: initialSettings?.posterWinnersWidth !== undefined ? Number(initialSettings.posterWinnersWidth) : 36,
    posterWinnerNameSize: initialSettings?.posterWinnerNameSize !== undefined ? Number(initialSettings.posterWinnerNameSize) : 20,
    posterWinnerTeamSize: initialSettings?.posterWinnerTeamSize !== undefined ? Number(initialSettings.posterWinnerTeamSize) : 13,
    posterWinnerTeamColor: initialSettings?.posterWinnerTeamColor || "#64748b",
    posterWinnerGap: initialSettings?.posterWinnerGap !== undefined ? Number(initialSettings.posterWinnerGap) : 16,

    // Independent Rank Positions (Optional Override)
    posterRank1Top: initialSettings?.posterRank1Top !== undefined && initialSettings?.posterRank1Top !== null ? Number(initialSettings.posterRank1Top) : null,
    posterRank1Left: initialSettings?.posterRank1Left !== undefined && initialSettings?.posterRank1Left !== null ? Number(initialSettings.posterRank1Left) : null,
    posterRank2Top: initialSettings?.posterRank2Top !== undefined && initialSettings?.posterRank2Top !== null ? Number(initialSettings.posterRank2Top) : null,
    posterRank2Left: initialSettings?.posterRank2Left !== undefined && initialSettings?.posterRank2Left !== null ? Number(initialSettings.posterRank2Left) : null,
    posterRank3Top: initialSettings?.posterRank3Top !== undefined && initialSettings?.posterRank3Top !== null ? Number(initialSettings.posterRank3Top) : null,
    posterRank3Left: initialSettings?.posterRank3Left !== undefined && initialSettings?.posterRank3Left !== null ? Number(initialSettings.posterRank3Left) : null,

    // Granular Display Toggles (Rank Badges, Chest Numbers, Team Name)
    posterShowRankBadge: initialSettings?.posterShowRankBadge !== undefined ? initialSettings.posterShowRankBadge : true,
    posterShowChestNumber: initialSettings?.posterShowChestNumber !== undefined ? initialSettings.posterShowChestNumber : true,
    posterShowTeam: initialSettings?.posterShowTeam !== undefined ? initialSettings.posterShowTeam : true,
  });

  // Extract Real Fest Data or Fallbacks
  const previewProgName = sampleProgram?.name || "പോസ്റ്റർ രചന";
  const previewCatName = sampleProgram?.category?.name || "SUPER SENIOR";
  const previewProgCode = sampleProgram?.programCode ? String(sampleProgram.programCode).padStart(2, "0") : "JAG62";

  const previewWinners = (sampleProgram?.results && sampleProgram.results.length > 0)
    ? sampleProgram.results.map((r: any, idx: number) => ({
        rankNum: r.rank ? String(r.rank).padStart(2, "0") : String(idx + 1).padStart(2, "0"),
        rankColor: r.rank === 1 ? "#10b981" : r.rank === 2 ? (formData.posterSecondaryColor || "#f97316") : "#ef4444",
        name: r.candidate?.name || r.team?.name || `Participant ${idx + 1}`,
        chest: r.candidate?.chestNumber || "703",
        team: r.candidate?.team?.name || r.team?.name || "YAQOOTH (G)",
        grade: r.grade || "A"
      }))
    : [
        { rankNum: "01", rankColor: "#10b981", name: "AFREENA", chest: "703", team: "MARJAAN (G)", grade: "A" },
        { rankNum: "02", rankColor: formData.posterSecondaryColor || "#f97316", name: "RAEESA JANNAH", chest: "601", team: "YAQOOTH (G)", grade: "B" },
        { rankNum: "03", rankColor: "#ef4444", name: "FATHIMA RIFA", chest: "603", team: "YAQOOTH (G)", grade: "B" },
      ];

  const handleDownloadTestPoster = async () => {
    if (!testPosterRef.current) return;
    setIsDownloadingTest(true);
    try {
      await new Promise(r => setTimeout(r, 200));
      const dataUrl = await toPng(testPosterRef.current, {
        quality: 0.95,
        pixelRatio: 1.5,
        width: 1080,
        height: 1350,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `Test_Poster_${previewProgName.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTestDownloadSuccess(true);
      setTimeout(() => setTestDownloadSuccess(false), 3000);
    } catch (e) {
      console.error("Test download error:", e);
      alert("Could not generate test download. Ensure background image is loaded.");
    } finally {
      setIsDownloadingTest(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await updatePosterSettings(formData);
    if (res.success) {
      alert("Poster template settings saved successfully!");
    } else {
      alert("Error: " + res.error);
    }
    setLoading(false);
  };

  const align = formData.posterTextAlignment || "left";

  return (
    <div style={{ marginBottom: 'var(--spacing-md)' }}>
      {/* Studio Grid: Preview on Left, Adjustment Controls on Right */}
      <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 480px) 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT SIDE: Sticky Live WYSIWYG Poster Canvas */}
        <div style={{ position: 'sticky', top: '20px' }}>
          <div className="glass-panel" style={{ padding: '16px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <strong style={{ fontSize: '0.95rem' }}>🎨 Live Poster Preview</strong>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Using Real Fest Data</div>
              </div>

              {/* Direct Download Test Poster Button right here on this page */}
              <button
                type="button"
                onClick={handleDownloadTestPoster}
                disabled={isDownloadingTest}
                className="btn btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.78rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  color: 'var(--gold)',
                  border: '1px solid var(--gold)'
                }}
              >
                <Download size={13} />
                <span>{isDownloadingTest ? "Rendering..." : testDownloadSuccess ? "✓ Downloaded!" : "Download Test Poster"}</span>
              </button>
            </div>

            {/* A4 Canvas Simulation */}
            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              boxShadow: '0 12px 35px rgba(0,0,0,0.3)',
              aspectRatio: '4 / 5',
              width: '100%',
              position: 'relative',
              overflow: 'hidden',
              userSelect: 'none',
              fontFamily: "var(--font-poster)",
              containerType: "inline-size"
            }}>
              {/* Background Image Layer */}
              {formData.posterBgUrl && (
                <img
                  src={formData.posterBgUrl.startsWith("data:") || formData.posterBgUrl.startsWith("/")
                    ? formData.posterBgUrl
                    : `/api/proxy-image?url=${encodeURIComponent(formData.posterBgUrl)}`}
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
              )}

              {/* Element 1: Program Name Block */}
              <div 
                onClick={() => setActiveTab("program")}
                style={{
                  position: 'absolute',
                  top: `${formData.posterProgramTop}%`,
                  left: `${formData.posterProgramLeft}%`,
                  width: `${formData.posterProgramWidth}%`,
                  cursor: 'pointer',
                  zIndex: 10,
                  outline: activeTab === "program" ? '2px dashed var(--primary)' : '1px dashed rgba(255,255,255,0.3)',
                  padding: '2px',
                  borderRadius: '4px',
                  textAlign: 'center',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{
                  fontSize: `calc(${formData.posterProgramFontSize || 36} * 0.095cqi)`,
                  fontWeight: 900,
                  color: formData.posterPrimaryColor || '#ffffff',
                  textTransform: 'uppercase',
                  lineHeight: 1.1,
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  letterSpacing: '0.5px'
                }}>
                  {previewProgName}
                </div>
              </div>

              {/* Element 2: Category Text (Pure text, NO bg) */}
              {formData.posterCategoryShow && (
                <div
                  onClick={() => setActiveTab("category")}
                  style={{
                    position: 'absolute',
                    top: `${formData.posterCategoryTop}%`,
                    left: `${formData.posterCategoryLeft}%`,
                    cursor: 'pointer',
                    zIndex: 10,
                    outline: activeTab === "category" ? '2px dashed #ec4899' : '1px dashed rgba(255,255,255,0.3)',
                    padding: '2px',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{
                    fontSize: `calc(${formData.posterCategoryFontSize || 18} * 0.1cqi)`,
                    fontWeight: 900,
                    color: formData.posterCategoryColor || '#ffffff',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    lineHeight: 1
                  }}>
                    {previewCatName}
                  </div>
                </div>
              )}

              {/* Element 3: Result Number Text (Pure text, NO bg) */}
              {formData.posterNumberShow && (
                <div
                  onClick={() => setActiveTab("number")}
                  style={{
                    position: 'absolute',
                    top: `${formData.posterNumberTop}%`,
                    left: `${formData.posterNumberLeft}%`,
                    cursor: 'pointer',
                    zIndex: 10,
                    outline: activeTab === "number" ? '2px dashed #eab308' : '1px dashed rgba(255,255,255,0.3)',
                    padding: '2px',
                    borderRadius: '4px',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{
                    fontSize: `calc(${formData.posterNumberFontSize || 18} * 0.105cqi)`,
                    fontWeight: 900,
                    color: formData.posterNumberColor || '#1e293b',
                    letterSpacing: '0.5px',
                    lineHeight: 1
                  }}>
                    {previewProgCode}
                  </div>
                </div>
              )}

              {/* Element 4: Winners List Box */}
              <div
                onClick={() => setActiveTab("winners")}
                style={{
                  position: 'absolute',
                  top: `${formData.posterWinnersTop}%`,
                  left: `${formData.posterWinnersLeft}%`,
                  width: `${formData.posterWinnersWidth}%`,
                  cursor: 'pointer',
                  zIndex: 10,
                  outline: activeTab === "winners" ? '2px dashed #10b981' : '1px dashed rgba(0,0,0,0.2)',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: `calc(${formData.posterWinnerGap || 16} * 0.11cqi)`,
                  boxSizing: 'border-box'
                }}
              >
                {previewWinners.map((winner: any, idx: number) => {
                  const rankTopOffset = idx === 0 ? (formData.posterRank1Top || 0) : idx === 1 ? (formData.posterRank2Top || 0) : (formData.posterRank3Top || 0);
                  const rankLeftOffset = idx === 0 ? (formData.posterRank1Left || 0) : idx === 1 ? (formData.posterRank2Left || 0) : (formData.posterRank3Left || 0);

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1.8cqi',
                        width: '100%',
                        minHeight: '8cqi',
                        justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
                        transform: (rankTopOffset !== 0 || rankLeftOffset !== 0) ? `translate(${rankLeftOffset}cqi, ${rankTopOffset}cqi)` : undefined,
                        position: 'relative'
                      }}
                    >
                    {/* Rank Circle Badge (Optional toggle) */}
                    {formData.posterShowRankBadge && (
                      <div style={{
                        width: '5.5cqi',
                        height: '5.5cqi',
                        borderRadius: '50%',
                        border: `0.38cqi solid ${winner.rankColor}`,
                        color: winner.rankColor,
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '2.5cqi',
                        flexShrink: 0,
                        order: align === 'right' ? 2 : 1
                      }}>
                        {winner.rankNum}
                      </div>
                    )}

                    {/* Candidate Name & Details with Word Wrap */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      textAlign: align === 'center' ? 'center' : align === 'right' ? 'right' : 'left',
                      order: align === 'right' ? 1 : 2,
                      minWidth: 0,
                      flex: 1
                    }}>
                      <div style={{
                        fontSize: `calc(${formData.posterWinnerNameSize || 20} * 0.1cqi)`,
                        fontWeight: 900,
                        color: formData.posterTextColor || '#1e293b',
                        letterSpacing: '0.2px',
                        lineHeight: 1.15,
                        textTransform: 'uppercase',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word'
                      }}>
                        {winner.name}
                        {formData.posterShowChestNumber && (
                          <span style={{ color: '#64748b', fontWeight: 700, marginLeft: '0.8cqi' }}>({winner.chest})</span>
                        )}
                        {formData.posterShowGrade && (
                          <span style={{
                            marginLeft: '1cqi',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#059669',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            padding: '0.2cqi 0.8cqi',
                            borderRadius: '0.8cqi',
                            fontSize: '2.2cqi',
                            fontWeight: 900
                          }}>
                            {winner.grade}
                          </span>
                        )}
                      </div>

                      {formData.posterShowTeam && (
                        <div style={{
                          fontSize: `calc(${formData.posterWinnerTeamSize || 13} * 0.12cqi)`,
                          fontWeight: 700,
                          color: formData.posterWinnerTeamColor || '#64748b',
                          textTransform: 'uppercase',
                          marginTop: '0.3cqi',
                          lineHeight: 1.1,
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word'
                        }}>
                          {winner.team}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        </div>

        {/* Offscreen high-res canvas for immediate test download from this page */}
        <div style={{ position: "fixed", left: "-9999px", top: "-9999px", pointerEvents: "none", zIndex: -100 }}>
          <div
            ref={testPosterRef}
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
            {formData.posterBgUrl && (
              <img
                src={formData.posterBgUrl.startsWith("data:") || formData.posterBgUrl.startsWith("/")
                  ? formData.posterBgUrl
                  : `/api/proxy-image?url=${encodeURIComponent(formData.posterBgUrl)}`}
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
            )}
            {(() => {
              return (
                <>
                  <div style={{
                    position: "absolute",
                    top: `${formData.posterProgramTop}%`,
                    left: `${formData.posterProgramLeft}%`,
                    width: `${formData.posterProgramWidth}%`,
                    textAlign: "center",
                    zIndex: 10,
                    boxSizing: "border-box"
                  }}>
                    <div style={{
                      fontSize: `calc(${formData.posterProgramFontSize || 36} * 0.095cqi)`,
                      fontWeight: 900,
                      color: formData.posterPrimaryColor || "#ffffff",
                      letterSpacing: "0.5px",
                      lineHeight: 1.1,
                      textTransform: "uppercase",
                      wordBreak: "break-word",
                      overflowWrap: "break-word"
                    }}>
                      {previewProgName}
                    </div>
                  </div>

                  {formData.posterCategoryShow && (
                    <div style={{
                      position: "absolute",
                      top: `${formData.posterCategoryTop}%`,
                      left: `${formData.posterCategoryLeft}%`,
                      zIndex: 10,
                      boxSizing: "border-box"
                    }}>
                      <div style={{
                        fontSize: `calc(${formData.posterCategoryFontSize || 18} * 0.1cqi)`,
                        fontWeight: 900,
                        color: formData.posterCategoryColor || "#ffffff",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        lineHeight: 1
                      }}>
                        {previewCatName}
                      </div>
                    </div>
                  )}

                  {formData.posterNumberShow && (
                    <div style={{
                      position: "absolute",
                      top: `${formData.posterNumberTop}%`,
                      left: `${formData.posterNumberLeft}%`,
                      zIndex: 10,
                      boxSizing: "border-box"
                    }}>
                      <div style={{
                        fontSize: `calc(${formData.posterNumberFontSize || 18} * 0.105cqi)`,
                        fontWeight: 900,
                        color: formData.posterNumberColor || "#1e293b",
                        letterSpacing: "0.5px",
                        lineHeight: 1
                      }}>
                        {previewProgCode}
                      </div>
                    </div>
                  )}

                  <div style={{
                    position: "absolute",
                    top: `${formData.posterWinnersTop}%`,
                    left: `${formData.posterWinnersLeft}%`,
                    width: `${formData.posterWinnersWidth}%`,
                    display: "flex",
                    flexDirection: "column",
                    gap: `calc(${formData.posterWinnerGap || 16} * 0.11cqi)`,
                    zIndex: 10,
                    boxSizing: "border-box"
                  }}>
                    {previewWinners.map((winner: any, idx: number) => {
                      const rankTopOffset = idx === 0 ? (formData.posterRank1Top || 0) : idx === 1 ? (formData.posterRank2Top || 0) : (formData.posterRank3Top || 0);
                      const rankLeftOffset = idx === 0 ? (formData.posterRank1Left || 0) : idx === 1 ? (formData.posterRank2Left || 0) : (formData.posterRank3Left || 0);

                      return (
                        <div
                          key={idx}
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
                        {formData.posterShowRankBadge && (
                          <div style={{
                            width: "5.5cqi",
                            height: "5.5cqi",
                            borderRadius: "50%",
                            border: `0.38cqi solid ${winner.rankColor}`,
                            color: winner.rankColor,
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
                            {winner.rankNum}
                          </div>
                        )}

                        <div style={{
                          display: "flex",
                          flexDirection: "column",
                          textAlign: align === "center" ? "center" : align === "right" ? "right" : "left",
                          order: align === "right" ? 1 : 2,
                          minWidth: 0,
                          flex: 1
                        }}>
                          <div style={{
                            fontSize: `calc(${formData.posterWinnerNameSize || 20} * 0.1cqi)`,
                            fontWeight: 900,
                            color: formData.posterTextColor || "#1e293b",
                            letterSpacing: "0.2px",
                            lineHeight: 1.15,
                            textTransform: "uppercase",
                            wordBreak: "break-word",
                            overflowWrap: "break-word"
                          }}>
                            {winner.name}
                            {formData.posterShowChestNumber && (
                              <span style={{ color: "#64748b", fontWeight: 700, marginLeft: "0.8cqi" }}>({winner.chest})</span>
                            )}
                            {formData.posterShowGrade && (
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
                                {winner.grade}
                              </span>
                            )}
                          </div>

                          {formData.posterShowTeam && (
                            <div style={{
                              fontSize: `calc(${formData.posterWinnerTeamSize || 13} * 0.12cqi)`,
                              fontWeight: 700,
                              color: formData.posterWinnerTeamColor || "#64748b",
                              textTransform: "uppercase",
                              marginTop: "0.3cqi",
                              lineHeight: 1.1,
                              wordBreak: "break-word",
                              overflowWrap: "break-word"
                            }}>
                              {winner.team}
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

        {/* RIGHT SIDE: Position & Granular Adjustments */}
        <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
          {/* Background Upload */}
          <div style={{ marginBottom: '16px' }}>
            <ImageUpload 
              label="Official Poster Background (A4 Portrait Art)" 
              folder="posters" 
              initialUrl={formData.posterBgUrl}
              onUploadComplete={(url) => setFormData({...formData, posterBgUrl: url})} 
            />
          </div>

          {/* Element Selection Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '10px', marginBottom: '16px', overflowX: 'auto' }}>
            {[
              { id: "program", label: "Program Name", icon: Type },
              { id: "category", label: "Category", icon: Award },
              { id: "number", label: "Result No", icon: Hash },
              { id: "winners", label: "Winners Box", icon: Trophy },
              { id: "toggles", label: "Show / Hide", icon: Eye },
              { id: "colors", label: "Colors & Align", icon: Palette },
            ].map(tab => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '8px 6px',
                    borderRadius: '7px',
                    border: 'none',
                    background: isSelected ? 'var(--primary)' : 'transparent',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '0.74rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Icon size={13} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: Program Name Controls */}
          {activeTab === "program" && (
            <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Type size={16} style={{ color: 'var(--primary)' }} />
                <strong style={{ fontSize: '0.9rem' }}>Program Name Position & Size</strong>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '0.8rem' }}>Top Spacing (Y)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.posterProgramTop}
                      onChange={(e) => setFormData({ ...formData, posterProgramTop: parseFloat(e.target.value) || 0 })}
                      style={{ width: '60px', padding: '2px 6px', fontSize: '0.8rem', textAlign: 'right', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--primary)', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="0.1"
                  value={formData.posterProgramTop}
                  onChange={(e) => setFormData({ ...formData, posterProgramTop: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '0.8rem' }}>Left Spacing (X)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.posterProgramLeft}
                      onChange={(e) => setFormData({ ...formData, posterProgramLeft: parseFloat(e.target.value) || 0 })}
                      style={{ width: '60px', padding: '2px 6px', fontSize: '0.8rem', textAlign: 'right', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--primary)', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  step="0.1"
                  value={formData.posterProgramLeft}
                  onChange={(e) => setFormData({ ...formData, posterProgramLeft: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '0.8rem' }}>Box Max Width (Text Wrap)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      step="0.1"
                      min="10"
                      max="100"
                      value={formData.posterProgramWidth}
                      onChange={(e) => setFormData({ ...formData, posterProgramWidth: parseFloat(e.target.value) || 0 })}
                      style={{ width: '60px', padding: '2px 6px', fontSize: '0.8rem', textAlign: 'right', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--primary)', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="15"
                  max="90"
                  step="0.1"
                  value={formData.posterProgramWidth}
                  onChange={(e) => setFormData({ ...formData, posterProgramWidth: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '0.8rem' }}>Font Size</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      step="0.5"
                      min="10"
                      max="100"
                      value={formData.posterProgramFontSize}
                      onChange={(e) => setFormData({ ...formData, posterProgramFontSize: parseFloat(e.target.value) || 0 })}
                      style={{ width: '60px', padding: '2px 6px', fontSize: '0.8rem', textAlign: 'right', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--primary)', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>px</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="18"
                  max="64"
                  step="0.5"
                  value={formData.posterProgramFontSize}
                  onChange={(e) => setFormData({ ...formData, posterProgramFontSize: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Program Name Text Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={formData.posterPrimaryColor || "#ffffff"}
                    onChange={(e) => setFormData({...formData, posterPrimaryColor: e.target.value})}
                    style={{ width: '34px', height: '34px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  />
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.posterPrimaryColor || "#ffffff"}
                    onChange={(e) => setFormData({...formData, posterPrimaryColor: e.target.value})}
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Category Text Controls (No BG) */}
          {activeTab === "category" && (
            <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={16} style={{ color: '#ec4899' }} />
                  <strong style={{ fontSize: '0.9rem' }}>Category Text (No Background)</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, posterCategoryShow: !formData.posterCategoryShow })}
                  style={{ background: 'none', border: 'none', color: formData.posterCategoryShow ? '#10b981' : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700 }}
                >
                  {formData.posterCategoryShow ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span>{formData.posterCategoryShow ? "Visible" : "Hidden"}</span>
                </button>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '0.8rem' }}>Top Spacing (Y)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.posterCategoryTop}
                      onChange={(e) => setFormData({ ...formData, posterCategoryTop: parseFloat(e.target.value) || 0 })}
                      style={{ width: '60px', padding: '2px 6px', fontSize: '0.8rem', textAlign: 'right', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: '#ec4899', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ec4899' }}>%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="0.1"
                  value={formData.posterCategoryTop}
                  onChange={(e) => setFormData({ ...formData, posterCategoryTop: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '0.8rem' }}>Left Spacing (X)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.posterCategoryLeft}
                      onChange={(e) => setFormData({ ...formData, posterCategoryLeft: parseFloat(e.target.value) || 0 })}
                      style={{ width: '60px', padding: '2px 6px', fontSize: '0.8rem', textAlign: 'right', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: '#ec4899', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ec4899' }}>%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="0.1"
                  value={formData.posterCategoryLeft}
                  onChange={(e) => setFormData({ ...formData, posterCategoryLeft: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '0.8rem' }}>Font Size</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      step="0.5"
                      min="6"
                      max="60"
                      value={formData.posterCategoryFontSize}
                      onChange={(e) => setFormData({ ...formData, posterCategoryFontSize: parseFloat(e.target.value) || 0 })}
                      style={{ width: '60px', padding: '2px 6px', fontSize: '0.8rem', textAlign: 'right', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: '#ec4899', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ec4899' }}>px</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  step="0.5"
                  value={formData.posterCategoryFontSize}
                  onChange={(e) => setFormData({ ...formData, posterCategoryFontSize: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Category Text Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={formData.posterCategoryColor || "#ffffff"}
                    onChange={(e) => setFormData({...formData, posterCategoryColor: e.target.value})}
                    style={{ width: '34px', height: '34px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  />
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.posterCategoryColor || "#ffffff"}
                    onChange={(e) => setFormData({...formData, posterCategoryColor: e.target.value})}
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Result Number Controls (No BG) */}
          {activeTab === "number" && (
            <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Hash size={16} style={{ color: '#eab308' }} />
                  <strong style={{ fontSize: '0.9rem' }}>Result Number (No Background)</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, posterNumberShow: !formData.posterNumberShow })}
                  style={{ background: 'none', border: 'none', color: formData.posterNumberShow ? '#10b981' : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700 }}
                >
                  {formData.posterNumberShow ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span>{formData.posterNumberShow ? "Visible" : "Hidden"}</span>
                </button>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '0.8rem' }}>Top Spacing (Y)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.posterNumberTop}
                      onChange={(e) => setFormData({ ...formData, posterNumberTop: parseFloat(e.target.value) || 0 })}
                      style={{ width: '60px', padding: '2px 6px', fontSize: '0.8rem', textAlign: 'right', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: '#eab308', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#eab308' }}>%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="0.1"
                  value={formData.posterNumberTop}
                  onChange={(e) => setFormData({ ...formData, posterNumberTop: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '0.8rem' }}>Left Spacing (X)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.posterNumberLeft}
                      onChange={(e) => setFormData({ ...formData, posterNumberLeft: parseFloat(e.target.value) || 0 })}
                      style={{ width: '60px', padding: '2px 6px', fontSize: '0.8rem', textAlign: 'right', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: '#eab308', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#eab308' }}>%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="0.1"
                  value={formData.posterNumberLeft}
                  onChange={(e) => setFormData({ ...formData, posterNumberLeft: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '0.8rem' }}>Font Size</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      step="0.5"
                      min="6"
                      max="60"
                      value={formData.posterNumberFontSize}
                      onChange={(e) => setFormData({ ...formData, posterNumberFontSize: parseFloat(e.target.value) || 0 })}
                      style={{ width: '60px', padding: '2px 6px', fontSize: '0.8rem', textAlign: 'right', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: '#eab308', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#eab308' }}>px</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  step="0.5"
                  value={formData.posterNumberFontSize}
                  onChange={(e) => setFormData({ ...formData, posterNumberFontSize: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '4px' }}>Result Number Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={formData.posterNumberColor || "#1e293b"}
                    onChange={(e) => setFormData({...formData, posterNumberColor: e.target.value})}
                    style={{ width: '34px', height: '34px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  />
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.posterNumberColor || "#1e293b"}
                    onChange={(e) => setFormData({...formData, posterNumberColor: e.target.value})}
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Winners List Box Controls */}
          {activeTab === "winners" && (
            <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trophy size={16} style={{ color: '#10b981' }} />
                <strong style={{ fontSize: '0.9rem' }}>Winners Box Position, Sizing & Spacing</strong>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '0.8rem' }}>Top Spacing (Y)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.posterWinnersTop}
                      onChange={(e) => setFormData({ ...formData, posterWinnersTop: parseFloat(e.target.value) || 0 })}
                      style={{ width: '60px', padding: '2px 6px', fontSize: '0.8rem', textAlign: 'right', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: '#10b981', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="0.1"
                  value={formData.posterWinnersTop}
                  onChange={(e) => setFormData({ ...formData, posterWinnersTop: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '0.8rem' }}>Left Spacing (X)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.posterWinnersLeft}
                      onChange={(e) => setFormData({ ...formData, posterWinnersLeft: parseFloat(e.target.value) || 0 })}
                      style={{ width: '60px', padding: '2px 6px', fontSize: '0.8rem', textAlign: 'right', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: '#10b981', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  step="0.1"
                  value={formData.posterWinnersLeft}
                  onChange={(e) => setFormData({ ...formData, posterWinnersLeft: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '0.8rem' }}>Box Max Width (Fit & Wrap)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      step="0.1"
                      min="10"
                      max="100"
                      value={formData.posterWinnersWidth}
                      onChange={(e) => setFormData({ ...formData, posterWinnersWidth: parseFloat(e.target.value) || 0 })}
                      style={{ width: '60px', padding: '2px 6px', fontSize: '0.8rem', textAlign: 'right', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: '#10b981', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  step="0.1"
                  value={formData.posterWinnersWidth}
                  onChange={(e) => setFormData({ ...formData, posterWinnersWidth: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '0.8rem' }}>Candidate Name Font Size</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      step="0.5"
                      min="8"
                      max="50"
                      value={formData.posterWinnerNameSize}
                      onChange={(e) => setFormData({ ...formData, posterWinnerNameSize: parseFloat(e.target.value) || 0 })}
                      style={{ width: '60px', padding: '2px 6px', fontSize: '0.8rem', textAlign: 'right', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: '#10b981', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>px</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="12"
                  max="34"
                  step="0.5"
                  value={formData.posterWinnerNameSize}
                  onChange={(e) => setFormData({ ...formData, posterWinnerNameSize: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '0.8rem' }}>Team Name Font Size</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      step="0.5"
                      min="6"
                      max="40"
                      value={formData.posterWinnerTeamSize}
                      onChange={(e) => setFormData({ ...formData, posterWinnerTeamSize: parseFloat(e.target.value) || 0 })}
                      style={{ width: '60px', padding: '2px 6px', fontSize: '0.8rem', textAlign: 'right', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: '#10b981', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>px</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="9"
                  max="24"
                  step="0.5"
                  value={formData.posterWinnerTeamSize}
                  onChange={(e) => setFormData({ ...formData, posterWinnerTeamSize: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0, fontSize: '0.8rem' }}>Row Vertical Spacing</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="60"
                      value={formData.posterWinnerGap}
                      onChange={(e) => setFormData({ ...formData, posterWinnerGap: parseFloat(e.target.value) || 0 })}
                      style={{ width: '60px', padding: '2px 6px', fontSize: '0.8rem', textAlign: 'right', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: '#10b981', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>px</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="4"
                  max="36"
                  step="0.5"
                  value={formData.posterWinnerGap}
                  onChange={(e) => setFormData({ ...formData, posterWinnerGap: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              {/* Granular Individual Place Position Adjustments */}
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🎯 Individual Place Position Fine-Tuning (Optional)</span>
                </div>

                {/* 1st Place Fine Tuning */}
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', marginBottom: '6px' }}>🥇 1st Place Offset</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                        <span>Top (Y)</span>
                        <span style={{ fontWeight: 700, color: '#10b981' }}>{formData.posterRank1Top ?? 0}%</span>
                      </div>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        step="0.2"
                        value={formData.posterRank1Top ?? 0}
                        onChange={(e) => setFormData({ ...formData, posterRank1Top: parseFloat(e.target.value) || 0 })}
                        style={{ width: '100%', cursor: 'pointer' }}
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                        <span>Left (X)</span>
                        <span style={{ fontWeight: 700, color: '#10b981' }}>{formData.posterRank1Left ?? 0}%</span>
                      </div>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        step="0.2"
                        value={formData.posterRank1Left ?? 0}
                        onChange={(e) => setFormData({ ...formData, posterRank1Left: parseFloat(e.target.value) || 0 })}
                        style={{ width: '100%', cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                </div>

                {/* 2nd Place Fine Tuning */}
                <div style={{ background: 'rgba(249, 115, 22, 0.05)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f97316', marginBottom: '6px' }}>🥈 2nd Place Offset</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                        <span>Top (Y)</span>
                        <span style={{ fontWeight: 700, color: '#f97316' }}>{formData.posterRank2Top ?? 0}%</span>
                      </div>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        step="0.2"
                        value={formData.posterRank2Top ?? 0}
                        onChange={(e) => setFormData({ ...formData, posterRank2Top: parseFloat(e.target.value) || 0 })}
                        style={{ width: '100%', cursor: 'pointer' }}
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                        <span>Left (X)</span>
                        <span style={{ fontWeight: 700, color: '#f97316' }}>{formData.posterRank2Left ?? 0}%</span>
                      </div>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        step="0.2"
                        value={formData.posterRank2Left ?? 0}
                        onChange={(e) => setFormData({ ...formData, posterRank2Left: parseFloat(e.target.value) || 0 })}
                        style={{ width: '100%', cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                </div>

                {/* 3rd Place Fine Tuning */}
                <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ef4444', marginBottom: '6px' }}>🥉 3rd Place Offset</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                        <span>Top (Y)</span>
                        <span style={{ fontWeight: 700, color: '#ef4444' }}>{formData.posterRank3Top ?? 0}%</span>
                      </div>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        step="0.2"
                        value={formData.posterRank3Top ?? 0}
                        onChange={(e) => setFormData({ ...formData, posterRank3Top: parseFloat(e.target.value) || 0 })}
                        style={{ width: '100%', cursor: 'pointer' }}
                      />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                        <span>Left (X)</span>
                        <span style={{ fontWeight: 700, color: '#ef4444' }}>{formData.posterRank3Left ?? 0}%</span>
                      </div>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        step="0.2"
                        value={formData.posterRank3Left ?? 0}
                        onChange={(e) => setFormData({ ...formData, posterRank3Left: parseFloat(e.target.value) || 0 })}
                        style={{ width: '100%', cursor: 'pointer' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Show / Hide Granular Toggles */}
          {activeTab === "toggles" && (
            <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Eye size={16} style={{ color: 'var(--primary)' }} />
                <strong style={{ fontSize: '0.9rem' }}>Granular Element Visibility Toggles</strong>
              </div>

              {/* Toggle 1: 1st, 2nd, 3rd Rank Number Badges */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, posterShowRankBadge: !formData.posterShowRankBadge })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1.5px solid ${formData.posterShowRankBadge ? '#10b981' : 'var(--border-color)'}`,
                  background: formData.posterShowRankBadge ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.04)',
                  color: formData.posterShowRankBadge ? '#10b981' : 'var(--text-secondary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  width: '100%'
                }}
              >
                {formData.posterShowRankBadge ? <CheckSquare size={16} /> : <Square size={16} />}
                <span>{formData.posterShowRankBadge ? "✓ Show 1st, 2nd, 3rd (01, 02, 03) Badges" : "✕ Hide Rank Badges (Already in Background)"}</span>
              </button>

              {/* Toggle 2: Chest Number */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, posterShowChestNumber: !formData.posterShowChestNumber })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1.5px solid ${formData.posterShowChestNumber ? '#10b981' : 'var(--border-color)'}`,
                  background: formData.posterShowChestNumber ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.04)',
                  color: formData.posterShowChestNumber ? '#10b981' : 'var(--text-secondary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  width: '100%'
                }}
              >
                {formData.posterShowChestNumber ? <CheckSquare size={16} /> : <Square size={16} />}
                <span>{formData.posterShowChestNumber ? "✓ Show Chest Numbers (286)" : "✕ Hide Chest Numbers"}</span>
              </button>

              {/* Toggle 3: Team / College Name */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, posterShowTeam: !formData.posterShowTeam })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1.5px solid ${formData.posterShowTeam ? '#10b981' : 'var(--border-color)'}`,
                  background: formData.posterShowTeam ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.04)',
                  color: formData.posterShowTeam ? '#10b981' : 'var(--text-secondary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  width: '100%'
                }}
              >
                {formData.posterShowTeam ? <CheckSquare size={16} /> : <Square size={16} />}
                <span>{formData.posterShowTeam ? "✓ Show Team / Institution Names" : "✕ Hide Team Names"}</span>
              </button>

              {/* Toggle 4: Grade Badge */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, posterShowGrade: !formData.posterShowGrade })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1.5px solid ${formData.posterShowGrade ? '#10b981' : 'var(--border-color)'}`,
                  background: formData.posterShowGrade ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.04)',
                  color: formData.posterShowGrade ? '#10b981' : 'var(--text-secondary)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  width: '100%'
                }}
              >
                {formData.posterShowGrade ? <CheckSquare size={16} /> : <Square size={16} />}
                <span>{formData.posterShowGrade ? "✓ Include Grade Badge (A+, A)" : "✕ Hide Grade Badge"}</span>
              </button>
            </div>
          )}

          {/* TAB 6: Colors & Text Alignment */}
          {activeTab === "colors" && (
            <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Palette size={16} style={{ color: 'var(--primary)' }} />
                <strong style={{ fontSize: '0.9rem' }}>Colors & Alignment</strong>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { id: "left", label: "Left Align", icon: AlignLeft },
                  { id: "center", label: "Center Align", icon: AlignCenter },
                  { id: "right", label: "Right Align", icon: AlignRight },
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = align === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setFormData({ ...formData, posterTextAlignment: item.id })}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px',
                        borderRadius: '6px',
                        border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                        background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.04)',
                        color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        fontSize: '0.78rem'
                      }}
                    >
                      <Icon size={14} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Program Title Color</label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input 
                      type="color" 
                      value={formData.posterPrimaryColor || "#ffffff"}
                      onChange={(e) => setFormData({...formData, posterPrimaryColor: e.target.value})}
                      style={{ width: '32px', height: '32px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    />
                    <input 
                      type="text" 
                      className="form-input" 
                      value={formData.posterPrimaryColor || "#ffffff"}
                      onChange={(e) => setFormData({...formData, posterPrimaryColor: e.target.value})}
                      style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Winner Name Color</label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input 
                      type="color" 
                      value={formData.posterTextColor || "#1e293b"}
                      onChange={(e) => setFormData({...formData, posterTextColor: e.target.value})}
                      style={{ width: '32px', height: '32px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    />
                    <input 
                      type="text" 
                      className="form-input" 
                      value={formData.posterTextColor || "#1e293b"}
                      onChange={(e) => setFormData({...formData, posterTextColor: e.target.value})}
                      style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Team Name Color</label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input 
                      type="color" 
                      value={formData.posterWinnerTeamColor || "#64748b"}
                      onChange={(e) => setFormData({...formData, posterWinnerTeamColor: e.target.value})}
                      style={{ width: '32px', height: '32px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    />
                    <input 
                      type="text" 
                      className="form-input" 
                      value={formData.posterWinnerTeamColor || "#64748b"}
                      onChange={(e) => setFormData({...formData, posterWinnerTeamColor: e.target.value})}
                      style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>2nd Rank Accent Color</label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input 
                      type="color" 
                      value={formData.posterSecondaryColor || "#f97316"}
                      onChange={(e) => setFormData({...formData, posterSecondaryColor: e.target.value})}
                      style={{ width: '32px', height: '32px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    />
                    <input 
                      type="text" 
                      className="form-input" 
                      value={formData.posterSecondaryColor || "#f97316"}
                      onChange={(e) => setFormData({...formData, posterSecondaryColor: e.target.value})}
                      style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SINGLE PRIMARY SAVE BUTTON */}
          <div style={{ marginTop: '20px' }}>
            <button
              type="button"
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '14px', fontWeight: 700, fontSize: '1rem', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)' }}
            >
              {loading ? "Saving..." : "💾 Save Poster Settings"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}



