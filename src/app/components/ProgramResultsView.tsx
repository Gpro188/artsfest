"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";

export default function ProgramResultsView({ program, settings, userRole }: { program: any, settings: any, userRole?: string }) {
  const isAuthorizedMedia = userRole === 'ADMIN' || userRole === 'MEDIA';
  const [isPosterMode, setIsPosterMode] = useState(false);
  const [isBodyOnly, setIsBodyOnly] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  const results = program.results || [];
  const winners = results.filter((r: any) => r.rank && r.rank <= 3).sort((a: any, b: any) => a.rank - b.rank);
  const others = results.filter((r: any) => !r.rank || r.rank > 3);
  const rank1 = winners.filter((w: any) => w.rank === 1);
  const rank2 = winners.filter((w: any) => w.rank === 2);
  const rank3 = winners.filter((w: any) => w.rank === 3);
  
  // Use the uploaded template if it exists
  const finalPosterUrl = program.mediaTemplate?.imageUrl;

  const handleDownloadImage = async () => {
    if (!posterRef.current) return;
    setIsGenerating(true);
    try {
      // Small delay to ensure all assets are loaded
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const dataUrl = await toPng(posterRef.current, { 
        quality: 1.0,
        pixelRatio: 2, // Higher quality
        cacheBust: true,
        width: 800,    // Force fixed width for export
        height: 1128,  // Force fixed height for export
        style: {
            transform: 'scale(1)', // Reset any CSS transforms
            margin: '0',
            left: '0',
            top: '0'
        }
      });
      
      const link = document.createElement('a');
      link.download = `${program.name}_${isBodyOnly ? 'Raw_Body' : 'Poster'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert('Failed to generate image. Please try again or use Print/PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `🏆 *ArtsFest Results Update!* 🏆\n\n*Program:* ${program.name}\n*Category:* ${program.category?.name || 'General'}\n\nCheck out the winners and download the official poster here:\n${shareUrl}\n\nCongratulations to all winners! 🎉`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: `${program.name} Results`,
                text: shareText,
                url: shareUrl,
            });
        } catch (err) {
            console.error("Error sharing:", err);
        }
    } else {
        // Fallback to WhatsApp direct link
        const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(waUrl, '_blank');
    }
  };

  if (isPosterMode) {
    return (
      <div className="poster-container" style={{ minHeight: '100vh', backgroundColor: '#0f172a', padding: '40px 0' }}>
        <div style={{ padding: '20px', textAlign: 'center', position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', marginBottom: '20px' }}>
            <button onClick={() => { setIsPosterMode(false); setIsBodyOnly(false); }} className="btn btn-secondary no-print">← Back</button>
            <button onClick={handleDownloadImage} className="btn btn-primary no-print" style={{ marginLeft: '10px' }} disabled={isGenerating}>
                {isGenerating ? '⌛ Generating...' : finalPosterUrl ? '📥 Download Final Poster' : isBodyOnly ? '🖼️ Download Clean Body' : '🖼️ Download Branded PNG'}
            </button>
            <button onClick={handleShare} className="btn btn-secondary no-print" style={{ marginLeft: '10px', backgroundColor: '#25D366', color: 'white', borderColor: '#25D366' }}>
                📲 Share Result
            </button>
            {isAuthorizedMedia && !finalPosterUrl && (
                <button 
                    onClick={() => setIsBodyOnly(!isBodyOnly)} 
                    className="btn btn-secondary no-print" 
                    style={{ marginLeft: '10px' }}
                >
                    {isBodyOnly ? '✨ Show Branding' : '🧊 Clean Body Only'}
                </button>
            )}
        </div>

        <style jsx global>{`
            .poster-stage {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 20px;
                overflow-x: hidden;
            }
            @media (max-width: 800px) {
                .printable-poster {
                    transform: scale(calc((100vw - 40px) / 800)) !important;
                    transform-origin: top center !important;
                }
                /* Compensate for the space taken by scaled element */
                .poster-stage {
                    height: calc(1128px * (100vw - 40px) / 800 + 100px) !important;
                }
            }
            @media print {
                body * { visibility: hidden; }
                .printable-poster, .printable-poster * { visibility: visible; }
                .printable-poster { 
                    position: absolute; 
                    left: 0; 
                    top: 0; 
                    width: 100% !important;
                    height: 100% !important;
                    max-width: none !important;
                    box-shadow: none !important;
                    transform: scale(1) !important;
                    margin: 0 !important;
                }
                .no-print { display: none !important; }
            }
        `}</style>

        {/* The Poster Area */}
        <div className="poster-stage">
            <div ref={posterRef} className="printable-poster" style={{
                width: '800px',
                height: '1128px', 
                margin: '0 auto',
                backgroundColor: 'white',
                color: '#1e293b',
                position: 'relative',
                overflow: 'hidden',
                fontFamily: 'var(--font-heading)',
                boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                transformOrigin: 'top center'
            }}>
            {/* OPTION A: Show Final Uploaded Poster */}
            {finalPosterUrl ? (
                <img src={finalPosterUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Final Result" crossOrigin="anonymous" />
            ) : (
                /* OPTION B: Auto-Generated Poster */
                <>
                    {/* Branding Assets (Hidden in BodyOnly mode) */}
                    {!isBodyOnly && (
                        <>
                            {(program.category?.posterBgUrl || settings?.posterBgUrl) && (
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
                                    <img 
                                        src={program.category?.posterBgUrl || settings.posterBgUrl} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        alt="" 
                                        crossOrigin="anonymous" 
                                    />
                                </div>
                            )}
                            <div style={{ position: 'absolute', top: '20px', right: '40px', zIndex: 2 }}>
                                {settings?.posterLogoUrl && <img src={settings.posterLogoUrl} style={{ height: '80px', objectFit: 'contain' }} alt="" crossOrigin="anonymous" />}
                            </div>
                        </>
                    )}

                    {/* CENTER BODY CONTENT (Reference Image Style) */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', zIndex: 1, padding: '0', justifyContent: 'center', height: '100%' }}>
                        
                        {/* Top Empty Space (approx 30%) */}
                        <div style={{ height: '28%' }}></div>

                        {/* Content Group - Tightly packed in the middle */}
                        <div style={{ textAlign: 'center' }}>
                            {/* Header Info */}
                            <div style={{ marginBottom: '40px' }}>
                                <div style={{ 
                                    fontSize: '1.2rem', 
                                    fontWeight: 900, 
                                    color: (!isBodyOnly && settings?.posterBgUrl) ? 'white' : (settings?.posterSecondaryColor || '#f97316'), 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '3px',
                                    marginBottom: '5px'
                                }}>
                                    {program.category?.name || 'General'}
                                </div>
                                <div style={{ 
                                    fontSize: '5rem', 
                                    fontWeight: 900, 
                                    color: (!isBodyOnly && settings?.posterBgUrl) ? 'white' : (settings?.posterPrimaryColor || '#1e293b'), 
                                    letterSpacing: '-2px', 
                                    margin: '0', 
                                    lineHeight: 0.9,
                                    textTransform: 'uppercase'
                                }}>
                                    {program.name}
                                </div>
                            </div>

                            {/* Winners Horizontal Line */}
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 20px', gap: '15px' }}>
                                {winners.map((winner: any) => (
                                    <WinnerCard 
                                        key={winner.id} 
                                        result={winner} 
                                        rank={winner.rank} 
                                        isBodyOnly={isBodyOnly} 
                                        secondaryColor={settings?.posterSecondaryColor}
                                        textColor={settings?.posterTextColor}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Bottom Empty Space (approx 30%) */}
                        <div style={{ height: '25%' }}></div>
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <div style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Link href="/" style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
            ← Back to Dashboard
          </Link>
          <h1 style={{ marginTop: 'var(--spacing-sm)' }}>{program.name} Results</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{program.event.name} • {program.category?.name || 'General'}</p>
        </div>
        
        {/* Conditional Poster Button */}
        {(finalPosterUrl || program.category?.posterBgUrl || settings?.posterBgUrl || isAuthorizedMedia) ? (
            <button 
                onClick={() => setIsPosterMode(true)} 
                className="btn btn-primary"
                style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-lg)' }}
            >
                🎴 {(finalPosterUrl || program.category?.posterBgUrl || settings?.posterBgUrl) ? 'Download Result Poster' : 'Manage Poster Branding'}
            </button>
        ) : (
            <div style={{ 
                padding: '0.75rem 1.5rem', 
                backgroundColor: 'rgba(255,255,255,0.05)', 
                borderRadius: 'var(--radius-lg)',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                border: '1px dashed var(--border-color)'
            }}>
                ⏳ Poster being designed by Media Team
            </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--spacing-xl)' }}>
        {/* Winners Board */}
        <div>
          <h2 style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#FCD34D' }}>🏆</span> Winner Board
          </h2>
          <div className="glass-panel" style={{ padding: 'var(--spacing-xl)', display: 'flex', justifyContent: 'center', gap: 'var(--spacing-xl)', flexWrap: 'wrap' }}>
             {rank2[0] && <WinnerDisplay result={rank2[0]} rank={2} />}
             {rank1[0] && <WinnerDisplay result={rank1[0]} rank={1} isMain />}
             {rank3[0] && <WinnerDisplay result={rank3[0]} rank={3} />}
             
             {winners.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                    No ranked winners recorded for this program yet.
                </div>
             )}
          </div>

          {/* All Results Table */}
          <div className="glass-panel" style={{ marginTop: 'var(--spacing-xl)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <tr>
                  <th style={{ padding: '15px' }}>Rank/Grade</th>
                  <th style={{ padding: '15px' }}>Participant</th>
                  <th style={{ padding: '15px' }}>Team</th>
                  <th style={{ padding: '15px', textAlign: 'right' }}>Points</th>
                </tr>
              </thead>
              <tbody>
                {[...winners, ...others].map((res: any, idx: number) => (
                  <tr key={res.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '15px' }}>
                        {res.rank ? (
                            <span style={{ 
                                backgroundColor: res.rank === 1 ? '#FCD34D' : res.rank === 2 ? '#E2E8F0' : '#CD7F32',
                                color: 'black',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                fontSize: '0.8rem'
                            }}>
                                {res.rank === 1 ? '1ST' : res.rank === 2 ? '2ND' : '3RD'}
                            </span>
                        ) : res.grade ? (
                            <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>Grade {res.grade}</span>
                        ) : '-'}
                    </td>
                    <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                             {res.candidate?.photo && (
                                <img src={res.candidate.photo} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                             )}
                             <strong>{res.candidate?.name || res.team?.name}</strong>
                        </div>
                    </td>
                    <td style={{ padding: '15px', color: 'var(--text-secondary)' }}>
                        {res.candidate?.team?.name || res.team?.name}
                    </td>
                    <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {res.points} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Sidebar */}
        <div>
           <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Program Info</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                <InfoRow label="Program Type" value={program.type} />
                <InfoRow label="Venue" value={program.venue || 'Not Set'} />
                <InfoRow label="Stage" value={program.stageType} />
                <InfoRow label="Category" value={program.category?.name || 'General'} />
              </div>
           </div>

           <div className="glass-panel" style={{ padding: 'var(--spacing-lg)', marginTop: 'var(--spacing-lg)', border: '1px dashed var(--border-color)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                This is a public result page. You can share this page link with participants and teams. Use the "Download Result Poster" button to generate a beautiful winner announcement.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}

function WinnerDisplay({ result, rank, isMain = false }: { result: any, rank: number, isMain?: boolean }) {
    const medalColor = rank === 1 ? '#FCD34D' : rank === 2 ? '#E2E8F0' : '#CD7F32';
    const photo = result.candidate?.photo || result.team?.leaderPhoto;
    
    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            transform: isMain ? 'scale(1.15)' : 'scale(1)',
            zIndex: isMain ? 10 : 1,
            transition: 'transform 0.3s'
        }}>
            <div style={{ position: 'relative', marginBottom: '15px' }}>
                <div style={{ 
                    width: isMain ? '120px' : '90px', 
                    height: isMain ? '120px' : '90px', 
                    borderRadius: '50%', 
                    overflow: 'hidden', 
                    border: `4px solid ${medalColor}`,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    boxShadow: isMain ? '0 0 30px rgba(252, 211, 77, 0.3)' : 'none'
                }}>
                    {photo ? (
                        <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>👤</div>
                    )}
                </div>
                <div style={{ 
                    position: 'absolute', 
                    bottom: '-10px', 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    backgroundColor: medalColor,
                    color: 'black',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                }}>
                    {rank}
                </div>
            </div>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: isMain ? '1.2rem' : '1rem' }}>{result.candidate?.name || result.team?.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{result.candidate?.team?.name || result.team?.name}</div>
            </div>
        </div>
    );
}

function WinnerCard({ 
    result, 
    rank, 
    isBodyOnly = false, 
    secondaryColor = "#f97316", 
    textColor = "#1e293b" 
}: { 
    result: any, 
    rank: number, 
    isBodyOnly?: boolean, 
    secondaryColor?: string, 
    textColor?: string 
}) {
    const photoSize = '200px';
    
    const displayName = result.candidate?.name || result.team?.name || 'Participant';
    const teamName = result.candidate?.team?.name || result.team?.name || '';
    const photoUrl = result.candidate?.photoUrl || result.team?.logoUrl || result.candidate?.photo || '';

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            width: photoSize,
            position: 'relative',
            marginBottom: '40px'
        }}>
            {/* Photo Container */}
            <div style={{ 
                width: photoSize, 
                height: photoSize, 
                borderRadius: '50%', 
                border: `8px solid ${secondaryColor}`,
                overflow: 'hidden',
                backgroundColor: '#f1f5f9',
                boxShadow: '0 15px 35px rgba(0,0,0,0.15)',
                position: 'relative',
                zIndex: 2
            }}>
                {photoUrl ? (
                    <img src={photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={displayName} crossOrigin="anonymous" />
                ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', color: '#cbd5e1' }}>
                        👤
                    </div>
                )}
            </div>

            {/* Rank Badge - OVERLAYING BOTTOM OF PHOTO */}
            <div style={{
                marginTop: '-30px',
                backgroundColor: secondaryColor,
                color: 'white', // High contrast for prize badges
                padding: '6px 20px',
                borderRadius: '8px',
                fontWeight: 900,
                fontSize: '0.85rem',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                textTransform: 'uppercase',
                border: '2px solid white'
            }}>
                {rank === 1 ? '1st Prize' : rank === 2 ? '2nd Prize' : '3rd Prize'}
            </div>

            {/* Name & Team Area */}
            <div style={{ 
                marginTop: '15px', 
                textAlign: 'center',
                width: '100%'
            }}>
                <div style={{ 
                    fontSize: '1.4rem', 
                    fontWeight: 900, 
                    color: textColor,
                    lineHeight: 1.1,
                    marginBottom: '4px',
                    textTransform: 'uppercase'
                }}>
                    {displayName}
                </div>
                <div style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 700, 
                    color: textColor,
                    opacity: 0.7,
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    {teamName}
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
