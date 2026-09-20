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

  // Dimension presets in mm for screen preview
  const pageWidthMm = paperSize === "A3" 
    ? (orientation === "portrait" ? 297 : 420)
    : (orientation === "portrait" ? 210 : 297);
  const pageHeightMm = paperSize === "A3"
    ? (orientation === "portrait" ? 420 : 297)
    : (orientation === "portrait" ? 297 : 210);

  const festName = settings?.festName || "Arts Fest";
  const festLogo = settings?.festLogo || null;

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
              onChange={e => setOrientation(e.target.value as "portrait" | "landscape")}
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
                  onClick={() => {
                    setCardsPerPage(n);
                    if (n === 2) setColumns(1);
                    else if (n === 4) setColumns(2);
                    else if (n === 6) setColumns(2);
                    else if (n === 8) setColumns(4);
                  }}
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

              {/* The Printable Page */}
              <div 
                className="print-page" 
                style={{ 
                  width: `${pageWidthMm}mm`, 
                  minHeight: `${pageHeightMm}mm`,
                  backgroundColor: '#ffffff',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                  boxSizing: 'border-box',
                  padding: '8mm',
                  display: 'grid',
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                  gridAutoRows: '1fr',
                  gap: '6mm',
                  position: 'relative'
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
                        borderRadius: '12px', 
                        border: '1px solid #d1d5db',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        position: 'relative',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        pageBreakInside: 'avoid',
                        breakInside: 'avoid'
                      }}
                    >
                      {/* Card Header with Fest Logo and Fest Name */}
                      <div style={{ 
                        backgroundColor: flagColor,
                        color: '#ffffff',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        textAlign: 'center',
                        position: 'relative'
                      }}>
                        {showLogo && festLogo && (
                          <div style={{ 
                            width: '28px', 
                            height: '28px', 
                            borderRadius: '4px', 
                            backgroundColor: 'rgba(255,255,255,0.95)', 
                            padding: '2px', 
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
                            fontSize: '0.95rem', 
                            fontWeight: 800, 
                            lineHeight: 1.1, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.5px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {festName}
                          </h2>
                          <p style={{ 
                            margin: '2px 0 0 0', 
                            fontSize: '0.55rem', 
                            opacity: 0.9, 
                            textTransform: 'uppercase', 
                            letterSpacing: '1px', 
                            fontWeight: 600 
                          }}>
                            Official Candidate Card
                          </p>
                        </div>
                      </div>

                      {/* Photo & Watermark Section */}
                      <div style={{ padding: '12px 12px 6px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                        
                        {/* Faint Team Name Watermark */}
                        <div style={{ 
                          position: 'absolute', 
                          top: '50%', 
                          left: '50%', 
                          transform: 'translate(-50%, -50%)',
                          width: '100%',
                          textAlign: 'center', 
                          zIndex: 0, 
                          opacity: 0.06, 
                          fontSize: '2.5rem', 
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
                          width: '85px', 
                          height: '85px', 
                          borderRadius: '10px', 
                          backgroundColor: '#f3f4f6', 
                          border: '3px solid #ffffff',
                          boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
                          overflow: 'hidden',
                          position: 'relative',
                          zIndex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {candidate.photo ? (
                            <img 
                              src={candidate.photo} 
                              alt={candidate.name} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            />
                          ) : (
                            <span style={{ fontSize: '2.5rem', color: '#9ca3af' }}>👤</span>
                          )}
                        </div>
                      </div>

                      {/* Candidate Name, Chest Number & Team Badge */}
                      <div style={{ textAlign: 'center', padding: '0 10px 6px 10px', position: 'relative', zIndex: 1 }}>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e1b4b', lineHeight: 1.1 }}>
                          {candidate.chestNumber || '??'}
                        </div>
                        <div style={{ 
                          fontSize: '0.85rem', 
                          fontWeight: 700, 
                          color: '#374151', 
                          textTransform: 'uppercase', 
                          margin: '2px 0 4px 0',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {candidate.name}
                        </div>
                        <div style={{ 
                          display: 'inline-block', 
                          padding: '2px 10px', 
                          backgroundColor: `${flagColor}15`, 
                          color: flagColor,
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          border: `1px solid ${flagColor}35`,
                          textTransform: 'uppercase'
                        }}>
                          {candidate.team?.name}
                        </div>
                      </div>

                      {/* Category and Event Meta */}
                      <div style={{ padding: '0 12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ 
                          display: 'flex', 
                          borderTop: '1px solid #f3f4f6', 
                          paddingTop: '6px', 
                          marginBottom: '6px',
                          fontSize: '0.65rem'
                        }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600, display: 'block', fontSize: '0.55rem' }}>Category</span>
                            <span style={{ fontWeight: 700, color: '#1e1b4b' }}>{candidate.category?.name}</span>
                          </div>
                          <div style={{ flex: 1, textAlign: 'right' }}>
                            <span style={{ color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600, display: 'block', fontSize: '0.55rem' }}>Fest</span>
                            <span style={{ fontWeight: 700, color: '#1e1b4b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{festName}</span>
                          </div>
                        </div>

                        {/* Assigned Programs */}
                        {(() => {
                          const pList = candidate.programs || [];
                          const pCount = pList.length;
                          const isBulkDense = pCount > 6;
                          const maxToShow = pCount > 10 ? 12 : pCount;

                          return (
                            <>
                              <div style={{ fontSize: '0.52rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 700, marginBottom: '3px' }}>
                                Programs ({pCount})
                              </div>
                              <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: '1fr 1fr', 
                                gap: isBulkDense ? '2px 4px' : '4px', 
                                maxHeight: isBulkDense ? '110px' : '85px', 
                                overflow: 'hidden',
                                flex: 1
                              }}>
                                {pList.slice(0, maxToShow).map((p: any) => {
                                  return (
                                    <div 
                                      key={p.id} 
                                      style={{ 
                                        fontSize: isBulkDense ? '0.52rem' : '0.58rem', 
                                        backgroundColor: '#f9fafb', 
                                        padding: isBulkDense ? '2px 4px' : '3px 5px', 
                                        borderRadius: '3px',
                                        color: '#374151',
                                        border: '1px solid #e5e7eb',
                                        lineHeight: '1.1'
                                      }}
                                    >
                                      <div style={{ fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={p.program?.name}>
                                        {p.program?.name}
                                      </div>
                                    </div>
                                  );
                                })}
                                {pCount === 0 && (
                                  <div style={{ gridColumn: 'span 2', fontSize: '0.6rem', color: '#9ca3af', textAlign: 'center', padding: '6px' }}>
                                    No programs assigned
                                  </div>
                                )}
                              </div>
                              {pCount > maxToShow && (
                                <div style={{ fontSize: '0.48rem', color: '#9ca3af', textAlign: 'center', marginTop: '1px' }}>
                                  + {pCount - maxToShow} more
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      {/* Footer Signature */}
                      <div style={{ 
                        padding: '6px 12px', 
                        backgroundColor: '#f9fafb', 
                        borderTop: '1px solid #f3f4f6',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        marginTop: 'auto'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ width: '45px', height: '12px', borderBottom: '1px solid #9ca3af' }}></div>
                          <div style={{ fontSize: '0.45rem', color: '#9ca3af', fontWeight: 600, marginTop: '1px' }}>OFFICIAL</div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.5rem', color: '#9ca3af' }}>
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

      {/* Print CSS Rules */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: ${paperSize} ${orientation};
          margin: 6mm;
        }
        @media print {
          .no-print { 
            display: none !important; 
          }
          body { 
            background: #ffffff !important; 
            margin: 0 !important; 
            padding: 0 !important; 
          }
          .print-container {
            padding: 0 !important;
            gap: 0 !important;
            display: block !important;
          }
          .print-page {
            box-shadow: none !important; 
            border: none !important;
            margin: 0 !important;
            width: 100% !important;
            min-height: 100vh !important;
            height: 100vh !important;
            page-break-after: always !important;
            break-after: page !important;
            padding: 2mm !important;
            box-sizing: border-box !important;
          }
          .id-card-wrapper {
            box-shadow: none !important;
            border: 1px solid #9ca3af !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
    </div>
  );
}
