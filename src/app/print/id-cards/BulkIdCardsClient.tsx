"use client";

import { useState, useMemo } from "react";

interface BulkIdCardsProps {
  candidates: any[];
  settings: any;
  teams?: { id: string; name: string; flagColor?: string | null; prefixCode?: string | null }[];
  initialTeamId?: string;
}

export default function BulkIdCardsClient({ candidates, settings, teams = [], initialTeamId }: BulkIdCardsProps) {
  const [paperSize, setPaperSize] = useState<"A4" | "A3">("A4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [cardsPerPage, setCardsPerPage] = useState<number>(4);
  const [columns, setColumns] = useState<number>(2);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(initialTeamId || "ALL");
  const [separateByTeam, setSeparateByTeam] = useState<boolean>(true);
  const [showLogo, setShowLogo] = useState<boolean>(true);

  // Filter candidates by selected team
  const filteredCandidates = useMemo(() => {
    if (selectedTeamId === "ALL") return candidates;
    return candidates.filter(c => c.teamId === selectedTeamId || c.team?.id === selectedTeamId);
  }, [candidates, selectedTeamId]);

  // Generate pages: either grouped strictly by team (page break between teams) or continuous
  const pages = useMemo(() => {
    if (filteredCandidates.length === 0) return [];

    if (separateByTeam && selectedTeamId === "ALL") {
      // Group candidates by team first
      const teamMap = new Map<string, any[]>();
      filteredCandidates.forEach(c => {
        const tId = c.teamId || c.team?.id || "other";
        if (!teamMap.has(tId)) teamMap.set(tId, []);
        teamMap.get(tId)!.push(c);
      });

      const p: { teamName: string; cards: any[] }[] = [];
      teamMap.forEach((teamCandidates) => {
        const teamName = teamCandidates[0]?.team?.name || "Team";
        for (let i = 0; i < teamCandidates.length; i += cardsPerPage) {
          p.push({
            teamName,
            cards: teamCandidates.slice(i, i + cardsPerPage)
          });
        }
      });
      return p;
    } else {
      // Continuous chunking
      const p: { teamName?: string; cards: any[] }[] = [];
      for (let i = 0; i < filteredCandidates.length; i += cardsPerPage) {
        p.push({
          cards: filteredCandidates.slice(i, i + cardsPerPage)
        });
      }
      return p;
    }
  }, [filteredCandidates, cardsPerPage, separateByTeam, selectedTeamId]);

  // Dimension presets in mm for screen preview and print
  const pageWidthMm = paperSize === "A3" 
    ? (orientation === "portrait" ? 297 : 420)
    : (orientation === "portrait" ? 210 : 297);
  const pageHeightMm = paperSize === "A3"
    ? (orientation === "portrait" ? 420 : 297)
    : (orientation === "portrait" ? 297 : 210);

  // Calculated rows based on cards per page and columns
  const calculatedRows = Math.max(1, Math.ceil(cardsPerPage / columns));

  // Density tier to ensure 8 cards (or multi-row layouts) scale down compactly
  // to fit strictly on ONE single printed A4 page without spilling into 2 pages
  const isMini = cardsPerPage >= 8 || calculatedRows >= 4 || columns >= 4;
  const isCompact = !isMini && (cardsPerPage >= 6 || calculatedRows >= 3 || columns >= 3);

  const pageMarginMm = isMini ? 4 : isCompact ? 5 : 6;
  const pagePadMm = isMini ? 2 : isCompact ? 3 : 5;
  const gridGapMm = isMini ? 2 : isCompact ? 3 : 5;

  const printableWidthMm = pageWidthMm - (pageMarginMm * 2);
  const printableHeightMm = pageHeightMm - (pageMarginMm * 2);

  const festName = settings?.festName || "Arts Fest";
  const festLogo = settings?.festLogo || null;

  // Handle Preset selection
  const handlePresetClick = (n: number) => {
    setCardsPerPage(n);
    if (n === 2) {
      setColumns(orientation === "landscape" ? 2 : 1);
    } else if (n === 4) {
      setColumns(2);
    } else if (n === 6) {
      setColumns(orientation === "landscape" ? 3 : 2);
    } else if (n === 8) {
      // 8 cards fits perfectly as 4 columns x 2 rows (in landscape or portrait)
      // or 2 columns x 4 rows in portrait
      setColumns(4);
    }
  };

  const handleOrientationChange = (newOrientation: "portrait" | "landscape") => {
    setOrientation(newOrientation);
    if (cardsPerPage === 8) {
      setColumns(4);
    } else if (cardsPerPage === 6) {
      setColumns(newOrientation === "landscape" ? 3 : 2);
    } else if (cardsPerPage === 2) {
      setColumns(newOrientation === "landscape" ? 2 : 1);
    }
  };

  return (
    <div style={{ backgroundColor: '#e5e7eb', minHeight: '100vh', paddingBottom: '50px' }}>
      {/* Top Toolbar (Excluded from Print) */}
      <div className="no-print" style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 50, 
        backgroundColor: '#ffffff', 
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        padding: '12px 24px',
        borderBottom: '1px solid #d1d5db'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          
          {/* Header Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {festLogo && (
              <img 
                src={festLogo} 
                alt="Logo" 
                style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #e5e7eb' }} 
              />
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#111827' }}>
                  {festName}
                </h1>
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#e0e7ff', color: '#3730a3', fontWeight: 600 }}>
                  Bulk ID Cards
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '2px 0 0 0' }}>
                Showing <strong>{filteredCandidates.length}</strong> candidates • <strong>{pages.length}</strong> page{pages.length === 1 ? '' : 's'} ({cardsPerPage} cards/page)
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => window.print()} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '9px 20px', 
                backgroundColor: '#4338ca', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '8px', 
                fontWeight: 700, 
                fontSize: '0.9rem', 
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)'
              }}
            >
              🖨️ Print ID Cards
            </button>
            <button 
              onClick={() => window.history.back()} 
              style={{ 
                padding: '9px 16px', 
                backgroundColor: '#f3f4f6', 
                color: '#374151', 
                border: '1px solid #d1d5db', 
                borderRadius: '8px', 
                fontWeight: 600, 
                fontSize: '0.85rem', 
                cursor: 'pointer' 
              }}
            >
              ← Back
            </button>
          </div>
        </div>

        {/* Controls Grid */}
        <div style={{ 
          marginTop: '12px', 
          paddingTop: '12px', 
          borderTop: '1px solid #f3f4f6', 
          display: 'flex', 
          flexWrap: 'wrap', 
          alignItems: 'center', 
          gap: '14px',
          fontSize: '0.85rem'
        }}>
          {/* Team Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontWeight: 600, color: '#374151' }}>Filter Team:</label>
            <select 
              value={selectedTeamId} 
              onChange={e => setSelectedTeamId(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', fontWeight: 600, minWidth: '150px' }}
            >
              <option value="ALL">All Teams ({candidates.length})</option>
              {teams.map(t => {
                const count = candidates.filter(c => c.teamId === t.id || c.team?.id === t.id).length;
                return (
                  <option key={t.id} value={t.id}>
                    {t.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Paper Size */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontWeight: 600, color: '#374151' }}>Paper Size:</label>
            <select 
              value={paperSize} 
              onChange={e => setPaperSize(e.target.value as "A4" | "A3")}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', fontWeight: 600 }}
            >
              <option value="A4">A4 (210 × 297 mm)</option>
              <option value="A3">A3 (297 × 420 mm)</option>
            </select>
          </div>

          {/* Orientation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontWeight: 600, color: '#374151' }}>Orientation:</label>
            <select 
              value={orientation} 
              onChange={e => handleOrientationChange(e.target.value as "portrait" | "landscape")}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb' }}
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>

          {/* Cards per Page (Typed count) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontWeight: 600, color: '#374151' }}>Cards / Page:</label>
            <input 
              type="number" 
              min="1" 
              max="20"
              value={cardsPerPage} 
              onChange={e => setCardsPerPage(Math.max(1, parseInt(e.target.value) || 1))}
              style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #d1d5db', width: '65px', textAlign: 'center', fontWeight: 700 }}
            />
            {/* Quick presets */}
            <div style={{ display: 'flex', gap: '3px' }}>
              {[2, 4, 6, 8].map(n => (
                <button
                  key={n}
                  onClick={() => handlePresetClick(n)}
                  style={{
                    padding: '4px 7px',
                    fontSize: '0.75rem',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                    backgroundColor: cardsPerPage === n ? '#4f46e5' : '#f3f4f6',
                    color: cardsPerPage === n ? '#ffffff' : '#374151',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Columns */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label style={{ fontWeight: 600, color: '#374151' }}>Columns:</label>
            <input 
              type="number" 
              min="1" 
              max="6"
              value={columns} 
              onChange={e => setColumns(Math.max(1, parseInt(e.target.value) || 1))}
              style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #d1d5db', width: '55px', textAlign: 'center', fontWeight: 700 }}
            />
            {cardsPerPage === 8 && (
              <div style={{ display: 'flex', gap: '3px' }}>
                <button
                  type="button"
                  onClick={() => setColumns(4)}
                  style={{
                    padding: '3px 6px',
                    fontSize: '0.72rem',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                    backgroundColor: columns === 4 ? '#4f46e5' : '#f3f4f6',
                    color: columns === 4 ? '#ffffff' : '#374151',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="4 columns × 2 rows (fits 8 per A4)"
                >
                  4×2
                </button>
                <button
                  type="button"
                  onClick={() => setColumns(2)}
                  style={{
                    padding: '3px 6px',
                    fontSize: '0.72rem',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                    backgroundColor: columns === 2 ? '#4f46e5' : '#f3f4f6',
                    color: columns === 2 ? '#ffffff' : '#374151',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="2 columns × 4 rows (fits 8 per A4)"
                >
                  2×4
                </button>
              </div>
            )}
          </div>

          {/* Checkboxes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginLeft: 'auto' }}>
            {selectedTeamId === "ALL" && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontWeight: 500, color: '#374151' }}>
                <input 
                  type="checkbox" 
                  checked={separateByTeam} 
                  onChange={e => setSeparateByTeam(e.target.checked)} 
                />
                Page break per team
              </label>
            )}

            {festLogo && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontWeight: 500, color: '#374151' }}>
                <input 
                  type="checkbox" 
                  checked={showLogo} 
                  onChange={e => setShowLogo(e.target.checked)} 
                />
                Show Logo
              </label>
            )}
          </div>

        </div>
      </div>

      {/* Pages Container */}
      <div className="print-container" style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>
        {pages.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', maxWidth: '500px', width: '90%' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 600, color: '#4b5563', margin: '0 0 8px 0' }}>No candidates found</p>
            <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0 }}>There are no approved candidates matching the selected team or festival criteria.</p>
          </div>
        ) : (
          pages.map((page, pageIndex) => (
            <div key={pageIndex} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              
              {/* Page Indicator (Screen only) */}
              <div className="no-print" style={{ 
                width: `${pageWidthMm * 0.9}mm`, 
                maxWidth: '96vw', 
                marginBottom: '6px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '0.75rem', 
                color: '#6b7280',
                fontWeight: 600 
              }}>
                <span>Page {pageIndex + 1} of {pages.length} {page.teamName ? `• Team: ${page.teamName}` : ''}</span>
                <span>{paperSize} ({orientation}) • {page.cards.length} card{page.cards.length === 1 ? '' : 's'}</span>
              </div>

              {/* The Printable Page - Strictly sized to exact sheet dimensions */}
              <div 
                className="print-page" 
                style={{ 
                  width: `${pageWidthMm}mm`, 
                  height: `${pageHeightMm}mm`,
                  maxHeight: `${pageHeightMm}mm`,
                  backgroundColor: '#ffffff',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  boxSizing: 'border-box',
                  padding: `${pagePadMm}mm`,
                  display: 'grid',
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                  gridTemplateRows: `repeat(${calculatedRows}, minmax(0, 1fr))`,
                  gap: `${gridGapMm}mm`,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {page.cards.map((candidate: any) => {
                  const flagColor = candidate.team?.flagColor || '#4F46E5';
                  return (
                    <div 
                      key={candidate.id} 
                      className="id-card-wrapper" 
                      style={{ 
                        backgroundColor: '#ffffff', 
                        borderRadius: isMini ? '6px' : isCompact ? '8px' : '12px', 
                        border: '1px solid #d1d5db',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        position: 'relative',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        pageBreakInside: 'avoid',
                        breakInside: 'avoid',
                        height: '100%',
                        maxHeight: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      {/* Card Header with Fest Logo and Fest Name */}
                      <div style={{ 
                        backgroundColor: flagColor,
                        color: '#ffffff',
                        padding: isMini ? '3px 6px' : isCompact ? '5px 8px' : '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: isMini ? '4px' : '8px',
                        textAlign: 'center',
                        position: 'relative',
                        flexShrink: 0
                      }}>
                        {showLogo && festLogo && (
                          <div style={{ 
                            width: isMini ? '18px' : isCompact ? '22px' : '28px', 
                            height: isMini ? '18px' : isCompact ? '22px' : '28px', 
                            borderRadius: '3px', 
                            backgroundColor: 'rgba(255,255,255,0.95)', 
                            padding: '1.5px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            flexShrink: 0 
                          }}>
                            <img 
                              src={festLogo} 
                              alt="Logo" 
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                            />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h2 style={{ 
                            margin: 0, 
                            fontSize: isMini ? '0.70rem' : isCompact ? '0.80rem' : '0.95rem', 
                            fontWeight: 800, 
                            lineHeight: 1.1, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.4px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {festName}
                          </h2>
                          <p style={{ 
                            margin: '1px 0 0 0', 
                            fontSize: isMini ? '0.40rem' : isCompact ? '0.48rem' : '0.55rem', 
                            opacity: 0.9, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.8px', 
                            fontWeight: 600,
                            lineHeight: 1.0
                          }}>
                            Official Candidate Card
                          </p>
                        </div>
                      </div>

                      {/* Photo & Watermark Section */}
                      {(() => {
                        const pCount = (candidate.programs || []).length;
                        
                        // Adaptive photo size to fit strictly within 8-card grid
                        let photoSize = '90px';
                        if (isMini) {
                          photoSize = pCount > 12 ? '42px' : pCount > 6 ? '46px' : '50px';
                        } else if (isCompact) {
                          photoSize = pCount > 12 ? '54px' : pCount > 6 ? '60px' : '65px';
                        } else {
                          photoSize = pCount > 12 ? '75px' : pCount > 6 ? '82px' : '90px';
                        }

                        return (
                          <>
                            <div style={{ 
                              padding: isMini ? '2px 4px 1px 4px' : isCompact ? '4px 6px 2px 6px' : '8px 10px 4px 10px', 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center', 
                              position: 'relative',
                              flexShrink: 0
                            }}>
                              
                              {/* Faint Team Name Watermark */}
                              <div style={{ 
                                position: 'absolute', 
                                top: '50%', 
                                left: '50%', 
                                transform: 'translate(-50%, -50%)',
                                width: '100%',
                                textAlign: 'center', 
                                zIndex: 0, 
                                opacity: 0.05, 
                                fontSize: isMini ? '1.1rem' : isCompact ? '1.5rem' : '2.2rem', 
                                fontWeight: 900, 
                                pointerEvents: 'none',
                                textTransform: 'uppercase',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden'
                              }}>
                                {candidate.team?.name}
                              </div>

                              {/* Candidate Photo */}
                              <div style={{ 
                                width: photoSize, 
                                height: photoSize, 
                                borderRadius: isMini ? '6px' : '8px', 
                                backgroundColor: '#f3f4f6', 
                                border: isMini ? '1.5px solid #ffffff' : '2.5px solid #ffffff',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                overflow: 'hidden',
                                position: 'relative',
                                zIndex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                {candidate.photo ? (
                                  <img 
                                    src={candidate.photo} 
                                    alt={candidate.name} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                  />
                                ) : (
                                  <span style={{ fontSize: isMini ? '1.1rem' : isCompact ? '1.5rem' : '2.2rem', color: '#9ca3af' }}>👤</span>
                                )}
                              </div>
                            </div>

                            {/* Candidate Name, Chest Number & Team Badge */}
                            <div style={{ 
                              textAlign: 'center', 
                              padding: isMini ? '0 4px 1px 4px' : isCompact ? '0 6px 2px 6px' : '0 10px 4px 10px', 
                              position: 'relative', 
                              zIndex: 1,
                              flexShrink: 0 
                            }}>
                              <div style={{ 
                                fontSize: isMini ? '1.05rem' : isCompact ? '1.2rem' : '1.45rem', 
                                fontWeight: 900, 
                                color: '#1e1b4b', 
                                lineHeight: 1.05 
                              }}>
                                {candidate.chestNumber || '??'}
                              </div>
                              <div style={{ 
                                fontSize: isMini ? '0.68rem' : isCompact ? '0.78rem' : '0.88rem', 
                                fontWeight: 700, 
                                color: '#374151', 
                                textTransform: 'uppercase', 
                                margin: '0 0 1px 0',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}>
                                {candidate.name}
                              </div>
                              <div style={{ 
                                display: 'inline-block', 
                                padding: isMini ? '1px 5px' : isCompact ? '1.5px 7px' : '2px 10px', 
                                backgroundColor: `${flagColor}15`, 
                                color: flagColor,
                                borderRadius: '8px',
                                fontSize: isMini ? '0.54rem' : isCompact ? '0.62rem' : '0.72rem', 
                                fontWeight: 800,
                                border: `1px solid ${flagColor}35`,
                                textTransform: 'uppercase',
                                lineHeight: 1.1
                              }}>
                                {candidate.team?.name}
                              </div>
                            </div>
                          </>
                        );
                      })()}

                      {/* Category and Event Meta */}
                      <div style={{ padding: isMini ? '0 4px' : isCompact ? '0 6px' : '0 8px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ 
                          display: 'flex', 
                          borderTop: '1px solid #f3f4f6', 
                          paddingTop: '2px', 
                          marginBottom: '2px',
                          fontSize: isMini ? '0.50rem' : isCompact ? '0.56rem' : '0.62rem',
                          flexShrink: 0
                        }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600, display: 'block', fontSize: isMini ? '0.40rem' : '0.50rem' }}>Category</span>
                            <span style={{ fontWeight: 700, color: '#1e1b4b' }}>{candidate.category?.name}</span>
                          </div>
                          <div style={{ flex: 1, textAlign: 'right' }}>
                            <span style={{ color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600, display: 'block', fontSize: isMini ? '0.40rem' : '0.50rem' }}>Fest</span>
                            <span style={{ fontWeight: 700, color: '#1e1b4b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{festName}</span>
                          </div>
                        </div>

                        {/* Assigned Programs */}
                        {(() => {
                          const pList = candidate.programs || [];
                          const pCount = pList.length;
                          
                          // Dynamic layout parameters based on page density and program count
                          let baseFontSize = 0.58; // in rem
                          let padding = '2px 4px';
                          let gap = '2px 3px';
                          let gridCols = '1fr 1fr';
                          let lineHeight = 1.05;
                          let minHeight = '16px';

                          if (isMini) {
                            // High density for 8 cards per page
                            padding = '1px 2px';
                            gap = '1.5px 2px';
                            minHeight = '12px';
                            lineHeight = 1.0;
                            if (columns >= 4) {
                              gridCols = pCount > 8 ? 'repeat(2, 1fr)' : '1fr';
                            } else {
                              gridCols = pCount > 10 ? 'repeat(3, 1fr)' : pCount > 4 ? '1fr 1fr' : '1fr';
                            }
                            if (pCount > 12) {
                              baseFontSize = 0.32;
                            } else if (pCount > 6) {
                              baseFontSize = 0.36;
                            } else {
                              baseFontSize = 0.40;
                            }
                          } else if (isCompact) {
                            padding = '1.5px 3px';
                            gap = '2px 2.5px';
                            minHeight = '14px';
                            if (pCount > 12) {
                              baseFontSize = 0.40;
                              gridCols = 'repeat(3, 1fr)';
                            } else if (pCount > 6) {
                              baseFontSize = 0.46;
                              gridCols = '1fr 1fr';
                            } else {
                              baseFontSize = 0.52;
                              gridCols = pCount <= 2 ? '1fr' : '1fr 1fr';
                            }
                          } else {
                            // Standard 1-4 cards
                            if (pCount > 18) {
                              baseFontSize = 0.38;
                              padding = '1.5px 2px';
                              gap = '2px 2px';
                              gridCols = 'repeat(3, 1fr)';
                              minHeight = '15px';
                            } else if (pCount > 12) {
                              baseFontSize = 0.42;
                              padding = '2px 2.5px';
                              gap = '2px 3px';
                              gridCols = 'repeat(3, 1fr)';
                              minHeight = '16px';
                            } else if (pCount > 8) {
                              baseFontSize = 0.48;
                              padding = '2px 3px';
                              gap = '2px 3px';
                              gridCols = '1fr 1fr';
                              minHeight = '18px';
                            } else if (pCount > 4) {
                              baseFontSize = 0.54;
                              padding = '2px 4px';
                              gap = '3px 3px';
                              gridCols = '1fr 1fr';
                              minHeight = '18px';
                            } else {
                              baseFontSize = 0.60;
                              padding = '3px 6px';
                              gap = '4px';
                              gridCols = pCount <= 2 ? '1fr' : '1fr 1fr';
                              minHeight = '20px';
                            }
                          }

                          return (
                            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                              <div style={{ 
                                fontSize: isMini ? '0.40rem' : '0.48rem', 
                                color: '#9ca3af', 
                                textTransform: 'uppercase', 
                                fontWeight: 700, 
                                marginBottom: '2px', 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                flexShrink: 0 
                              }}>
                                <span>Assigned Programs</span>
                                <span style={{ fontWeight: 800, color: '#4F46E5' }}>{pCount}</span>
                              </div>
                              <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: gridCols, 
                                gap: gap, 
                                flex: 1,
                                minHeight: 0,
                                alignContent: 'start',
                                overflow: 'hidden',
                                paddingBottom: '2px'
                              }}>
                                {pList.map((p: any) => {
                                  const rawName = p.program?.name || '';
                                  const nameLen = rawName.length;
                                  
                                  // Granular shrinking based on individual program name length
                                  let itemFont = baseFontSize;
                                  if (nameLen > 24) {
                                    itemFont = Math.min(itemFont, baseFontSize * 0.85);
                                  } else if (nameLen > 16) {
                                    itemFont = Math.min(itemFont, baseFontSize * 0.92);
                                  }

                                  return (
                                    <div 
                                      key={p.id} 
                                      style={{ 
                                        fontSize: `${itemFont}rem`, 
                                        backgroundColor: '#f9fafb', 
                                        padding: padding, 
                                        borderRadius: '3px', 
                                        color: '#1f2937', 
                                        border: '1px solid #e5e7eb', 
                                        lineHeight: lineHeight, 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        textAlign: 'center', 
                                        minHeight: minHeight, 
                                        boxSizing: 'border-box' 
                                      }}
                                    >
                                      <div 
                                        style={{ 
                                          fontWeight: 700, 
                                          color: '#111827', 
                                          wordBreak: 'break-word', 
                                          overflowWrap: 'anywhere', 
                                          hyphens: 'auto', 
                                          lineHeight: '1.02', 
                                          width: '100%' 
                                        }} 
                                        title={rawName}
                                      >
                                        {rawName}
                                      </div>
                                    </div>
                                  );
                                })}
                                {pCount === 0 && (
                                  <div style={{ gridColumn: 'span 2', fontSize: isMini ? '0.45rem' : '0.6rem', color: '#9ca3af', textAlign: 'center', padding: '4px' }}>
                                    No programs assigned
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Footer Signature */}
                      <div style={{ 
                        padding: isMini ? '2px 6px' : isCompact ? '3px 8px' : '6px 12px', 
                        backgroundColor: '#f9fafb', 
                        borderTop: '1px solid #f3f4f6',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        marginTop: 'auto',
                        flexShrink: 0
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ width: isMini ? '28px' : isCompact ? '36px' : '45px', height: isMini ? '8px' : '12px', borderBottom: '1px solid #9ca3af' }}></div>
                          <div style={{ fontSize: isMini ? '0.36rem' : '0.45rem', color: '#9ca3af', fontWeight: 600, marginTop: '1px' }}>OFFICIAL</div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: isMini ? '0.40rem' : '0.50rem', color: '#9ca3af' }}>
                          {new Date().toLocaleDateString()}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          ))
        )}
      </div>

      {/* Print CSS Rules - Guaranteed 1-page fit per sheet */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: ${paperSize} ${orientation};
          margin: ${pageMarginMm}mm;
        }
        @media print {
          html, body { 
            background: #ffffff !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            width: 100% !important;
            height: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { 
            display: none !important; 
          }
          .print-container {
            padding: 0 !important;
            margin: 0 !important;
            gap: 0 !important;
            display: block !important;
            width: 100% !important;
          }
          .print-page {
            box-shadow: none !important; 
            border: none !important;
            margin: 0 !important;
            width: ${printableWidthMm}mm !important;
            max-width: 100% !important;
            height: ${printableHeightMm}mm !important;
            max-height: ${printableHeightMm}mm !important;
            min-height: ${printableHeightMm}mm !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            padding: ${pagePadMm}mm !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            display: grid !important;
            grid-template-columns: repeat(${columns}, 1fr) !important;
            grid-template-rows: repeat(${calculatedRows}, minmax(0, 1fr)) !important;
            gap: ${gridGapMm}mm !important;
          }
          .id-card-wrapper {
            box-shadow: none !important;
            border: 1px solid #9ca3af !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            height: 100% !important;
            max-height: 100% !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
    </div>
  );
}
