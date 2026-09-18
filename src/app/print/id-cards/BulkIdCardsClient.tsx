"use client";

import PrintButton from "@/components/PrintButton";
import { useState, useMemo } from "react";

export default function BulkIdCardsClient({ candidates, settings }: { candidates: any[], settings: any }) {
  const [paperSize, setPaperSize] = useState("A4");
  const [cardsPerPage, setCardsPerPage] = useState(4);
  const [columns, setColumns] = useState(2);

  const pages = useMemo(() => {
    const p = [];
    for (let i = 0; i < candidates.length; i += cardsPerPage) {
      p.push(candidates.slice(i, i + cardsPerPage));
    }
    return p;
  }, [candidates, cardsPerPage]);

  return (
    <div style={{ padding: '20px', backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
      <div className="no-print" style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Bulk ID Card Printing</h1>
          <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>Found {candidates.length} approved candidates</p>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '0.8rem', marginRight: '5px', fontWeight: 'bold' }}>Paper Size:</label>
            <select 
              value={paperSize} 
              onChange={e => setPaperSize(e.target.value)}
              style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="A4">A4</option>
              <option value="A3">A3</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', marginRight: '5px', fontWeight: 'bold' }}>Cards per page:</label>
            <input 
              type="number" 
              min="1" 
              value={cardsPerPage} 
              onChange={e => setCardsPerPage(parseInt(e.target.value) || 1)}
              style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', width: '60px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', marginRight: '5px', fontWeight: 'bold' }}>Columns:</label>
            <input 
              type="number" 
              min="1" 
              value={columns} 
              onChange={e => setColumns(parseInt(e.target.value) || 1)}
              style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', width: '60px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <PrintButton label="Print All Cards" color="#4F46E5" />
          <button onClick={() => window.history.back()} style={{ padding: '8px 16px', backgroundColor: '#9ca3af', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '0.875rem' }}>
            ← Back
          </button>
        </div>
      </div>

      <div className="print-container">
        {pages.map((pageCandidates, pageIndex) => (
          <div key={pageIndex} className="print-page" style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gridAutoRows: '1fr',
            gap: '10mm', 
            padding: '10mm',
            boxSizing: 'border-box',
            backgroundColor: 'white',
            margin: '0 auto 20px',
            boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
          }}>
            {pageCandidates.map(candidate => (
              <div key={candidate.id} className="id-card-wrapper" style={{ 
                backgroundColor: 'white', 
                borderRadius: '15px', 
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid #e5e7eb',
                height: '100%'
              }}>
                {/* Header Design */}
                <div style={{ 
                  backgroundColor: candidate.team.flagColor || '#4F46E5',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  padding: '10px',
                  textAlign: 'center'
                }}>
                  <h2 style={{ margin: 0, fontSize: '1.2vw', fontWeight: 800 }}>{settings.festName}</h2>
                  <p style={{ margin: 0, fontSize: '0.6vw', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>Official Candidate Card</p>
                </div>

                {/* Photo & Chest Number Section */}
                <div style={{ padding: '5% 5% 2%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: '30%', aspectRatio: '1/1' }}>
                    {/* Photo */}
                    <div style={{ 
                      width: '100%', 
                      height: '100%', 
                      borderRadius: '10px', 
                      backgroundColor: '#f3f4f6', 
                      border: '3px solid #fff',
                      boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
                      overflow: 'hidden'
                    }}>
                      {candidate.photo ? (
                        <img src={candidate.photo} alt={candidate.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2vw' }}>👤</div>
                      )}
                    </div>
                  </div>

                  {/* Faint Background Text */}
                  <div style={{ 
                    position: 'absolute', 
                    top: '25%', 
                    left: '0', 
                    right: '0', 
                    textAlign: 'center', 
                    zIndex: 1, 
                    opacity: 0.05, 
                    fontSize: '3vw', 
                    fontWeight: 900, 
                    pointerEvents: 'none',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                  }}>
                    {candidate.team.name}
                  </div>
                </div>

                {/* Candidate Name & Team Badge */}
                <div style={{ textAlign: 'center', padding: '0 5% 2%' }}>
                  <h3 style={{ margin: '0 0 1%', fontSize: '1.8vw', fontWeight: 900, color: '#1e1b4b' }}>
                    {candidate.chestNumber || '??'}
                  </h3>
                  <div style={{ margin: '0 0 2%', fontSize: '1.1vw', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' }}>
                    {candidate.name}
                  </div>
                  <div style={{ 
                    display: 'inline-block', 
                    padding: '1% 3%', 
                    backgroundColor: `${candidate.team.flagColor}10`, 
                    color: candidate.team.flagColor || '#4F46E5',
                    borderRadius: '15px',
                    fontSize: '0.8vw',
                    fontWeight: 800,
                    border: `1px solid ${candidate.team.flagColor}20`
                  }}>
                    {candidate.team.name}
                  </div>
                </div>

                {/* Details Section */}
                <div style={{ padding: '0 5% 5%', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', borderTop: '1px solid #f3f4f6', paddingTop: '3%', marginBottom: '3%' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.7vw', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>Category</div>
                      <div style={{ fontSize: '1vw', fontWeight: 700, color: '#1e1b4b' }}>{candidate.category.name}</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7vw', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>Event</div>
                      <div style={{ fontSize: '1vw', fontWeight: 700, color: '#1e1b4b' }}>ARTS FEST 2026</div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.7vw', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2%' }}>Programs</div>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '2%', 
                    maxHeight: '30%', 
                    overflow: 'hidden' 
                  }}>
                    {candidate.programs.slice(0, 10).map((p: any) => (
                      <div key={p.id} style={{ 
                        fontSize: '0.7vw', 
                        backgroundColor: '#f9fafb', 
                        padding: '2% 4%', 
                        borderRadius: '4px',
                        color: '#4b5563',
                        border: '1px solid #e5e7eb',
                        lineHeight: '1.1'
                      }}>
                        <div style={{ fontWeight: 700, color: '#1e1b4b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.program.name}
                        </div>
                        {(p.scheduledTime || p.program.startTime) && (
                          <div style={{ fontSize: '0.6vw', color: '#6b7280' }}>
                            {new Date(p.scheduledTime || p.program.startTime).toLocaleDateString([], { day: '2-digit', month: 'short' })} {new Date(p.scheduledTime || p.program.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div style={{ 
                  padding: '3% 5%', 
                  backgroundColor: '#f9fafb', 
                  borderTop: '1px solid #f3f4f6',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '10px', borderBottom: '1px solid #d1d5db' }}></div>
                    <div style={{ fontSize: '0.5vw', color: '#9ca3af' }}>ADMIN</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.6vw', color: '#9ca3af' }}>
                    {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .print-page {
          width: ${paperSize === 'A3' ? '297mm' : '210mm'};
          height: ${paperSize === 'A3' ? '420mm' : '297mm'};
        }
        @media print {
          @page {
            size: ${paperSize};
            margin: 0;
          }
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          .print-container {
            display: block;
          }
          .print-page {
            box-shadow: none !important; 
            margin: 0 !important;
            page-break-after: always;
            width: 100vw;
            height: 100vh;
          }
          .id-card-wrapper {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Override vw sizes to mm or relative to page for print */
          .print-page h2 { font-size: calc(12mm / var(--columns)) !important; }
          .print-page p, .print-page .category, .print-page .footer-text { font-size: calc(6mm / var(--columns)) !important; }
          .print-page h3 { font-size: calc(18mm / var(--columns)) !important; }
        }
      `}} />
    </div>
  );
}
