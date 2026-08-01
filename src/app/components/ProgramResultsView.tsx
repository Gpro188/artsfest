"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { toPng } from "html-to-image";

export default function ProgramResultsView({ program, settings, userRole }: { program: any, settings: any, userRole?: string }) {
  const isAuthorizedMedia = userRole === 'ADMIN' || userRole === 'MEDIA';
  const [isPosterMode, setIsPosterMode] = useState(false);
  const [posterStyle, setPosterStyle] = useState<'photo' | 'nophoto'>('nophoto'); // Default: Without Photo as requested
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDataUrl, setGeneratedDataUrl] = useState<string | null>(null);
  const posterRef = useRef<HTMLDivElement>(null);

  const results = program.results || [];
  const winners = results.filter((r: any) => r.rank && r.rank <= 3).sort((a: any, b: any) => a.rank - b.rank);
  const others = results.filter((r: any) => !r.rank || r.rank > 3);
  const rank1 = winners.filter((w: any) => w.rank === 1);
  const rank2 = winners.filter((w: any) => w.rank === 2);
  const rank3 = winners.filter((w: any) => w.rank === 3);
  
  // Use the uploaded template if it exists
  const finalPosterUrl = program.mediaTemplate?.imageUrl;

  const handleGeneratePoster = async () => {
    if (!posterRef.current) return;
    setIsGenerating(true);
    try {
      // Small delay to ensure all assets are loaded
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const dataUrl = await toPng(posterRef.current, { 
        quality: 1.0,
        pixelRatio: 2, // Higher quality
        cacheBust: true,
        width: 1080,    // Force fixed width for export
        height: 1350,  // Force fixed height for export
        style: {
            transform: 'scale(1)', // Reset any CSS transforms
            margin: '0',
            left: '0',
            top: '0'
        }
      });
      
      setGeneratedDataUrl(dataUrl);
    } catch (err) {
      console.error(err);
      alert('Failed to generate image. Please try again or use Print/PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = () => {
      const urlToDownload = finalPosterUrl || generatedDataUrl;
      if (!urlToDownload) return;
      
      const link = document.createElement('a');
      link.download = `${program.name}_Poster.png`;
      link.href = urlToDownload;
      link.click();
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    // Construct Result Summary
    const winnersSummary = winners.map((w: any) => {
      const name = w.candidate?.name || w.team?.name;
      const rankText = w.rank === 1 ? '1st' : w.rank === 2 ? '2nd' : '3rd';
      return `${rankText}: ${name}`;
    }).join('\n');

    const shareText = `🏆 *${program.event.name}* 🏆\n\n*Category:* ${program.category?.name || 'General'}\n*Program:* ${program.name}\n\n*Results:*\n${winnersSummary}\n\nCongratulations to all winners! 🎉\n\nView full results here:\n${shareUrl}`;

    const urlToShare = finalPosterUrl || generatedDataUrl;

    if (navigator.share && urlToShare) {
        try {
            let filesArray: File[] = [];
            
            // Convert data URL to File object if we generated it
            if (urlToShare.startsWith('data:')) {
                const res = await fetch(urlToShare);
                const blob = await res.blob();
                const file = new File([blob], `${program.name}_Poster.png`, { type: 'image/png' });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    filesArray = [file];
                }
            }
            
            const shareData: any = {
                title: `${program.name} Results`,
                text: shareText,
            };
            
            if (filesArray.length > 0) {
                shareData.files = filesArray;
            } else {
                shareData.url = shareUrl;
            }

            await navigator.share(shareData);
        } catch (err) {
            console.error("Error sharing:", err);
            // Fallback
            const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
            window.open(waUrl, '_blank');
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
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '20px', position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', marginBottom: '20px' }}>
            <button onClick={() => { setIsPosterMode(false); setGeneratedDataUrl(null); }} className="btn btn-secondary no-print">← Back</button>
            
            {/* Style Selector Buttons */}
            {!finalPosterUrl && (
              <div style={{ display: 'flex', gap: '5px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: 'var(--radius-md)' }} className="no-print">
                <button 
                  onClick={() => { setPosterStyle('nophoto'); setGeneratedDataUrl(null); }}
                  className={`btn ${posterStyle === 'nophoto' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: posterStyle === 'nophoto' ? 'var(--primary)' : 'transparent', border: 'none' }}
                >
                  📝 Text-Only (No Photo)
                </button>
                <button 
                  onClick={() => { setPosterStyle('photo'); setGeneratedDataUrl(null); }}
                  className={`btn ${posterStyle === 'photo' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: posterStyle === 'photo' ? 'var(--primary)' : 'transparent', border: 'none' }}
                >
                  🖼️ With Participant Photo
                </button>
              </div>
            )}

            {!finalPosterUrl && !generatedDataUrl && (program.category?.posterBgUrl || settings?.posterBgUrl || isAuthorizedMedia) && (
              <button onClick={handleGeneratePoster} className="btn btn-primary no-print" disabled={isGenerating}>
                  {isGenerating ? '⌛ Generating...' : '✨ Generate Poster'}
              </button>
            )}

            {(finalPosterUrl || generatedDataUrl) && (
              <>
                  <button onClick={handleDownloadImage} className="btn btn-primary no-print">
                      📥 Download Poster
                  </button>
                  <button onClick={handleShare} className="btn btn-secondary no-print" style={{ backgroundColor: '#25D366', color: 'white', borderColor: '#25D366' }}>
                      📲 Share Result
                  </button>
              </>
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
        `}</style>

        {/* The Visible Poster Area */}
        <div className="poster-stage" style={{ padding: '0 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, minHeight: '60vh' }}>
            {generatedDataUrl ? (
                <img 
                    src={generatedDataUrl} 
                    style={{ width: '100%', maxWidth: '500px', height: 'auto', borderRadius: 'var(--radius-md)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }} 
                    alt="Generated Result" 
                />
            ) : finalPosterUrl ? (
                <img 
                    src={finalPosterUrl} 
                    style={{ width: '100%', maxWidth: '500px', height: 'auto', borderRadius: 'var(--radius-md)', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }} 
                    alt="Final Result" 
                    crossOrigin="anonymous" 
                />
            ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '50px 20px', border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🖼️</div>
                    <h3 style={{ marginBottom: '10px', color: 'var(--text-secondary)' }}>Ready to Generate ({posterStyle === 'nophoto' ? 'No Photo Template' : 'With Photo Template'})</h3>
                    <p style={{ fontSize: '0.9rem', maxWidth: '320px', margin: '0 auto' }}>Click the Generate Poster button above to automatically design and create the high-resolution official poster.</p>
                </div>
            )}
        </div>

        {/* Hidden area for HTML-to-Image rendering - ONLY rendered if no finalPosterUrl */}
        {!finalPosterUrl && !generatedDataUrl && (
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <div ref={posterRef} className="printable-poster" style={{
                    width: '1080px',
                    height: '1350px', 
                    margin: '0',
                    backgroundColor: 'white',
                    color: '#1e293b',
                    position: 'relative',
                    overflow: 'hidden',
                    fontFamily: 'var(--font-heading)',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    {/* Branding Assets */}
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
                    <div style={{ position: 'absolute', top: '30px', right: '50px', zIndex: 2 }}>
                        {settings?.posterLogoUrl && <img src={settings.posterLogoUrl} style={{ height: '100px', objectFit: 'contain' }} alt="" crossOrigin="anonymous" />}
                    </div>

                    {/* CENTER BODY CONTENT */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', zIndex: 1, padding: '0', justifyContent: 'center', height: '100%' }}>
                        
                        {/* Top Empty Space (approx 28%) */}
                        <div style={{ height: '28%' }}></div>

                        {/* Content Group - Tightly packed in the middle */}
                        <div style={{ textAlign: 'center' }}>
                            {/* Header Info */}
                            <div style={{ marginBottom: '40px' }}>
                                <div style={{ 
                                    fontSize: '1.4rem', 
                                    fontWeight: 900, 
                                    color: settings?.posterSecondaryColor || '#f97316', 
                                    textTransform: 'uppercase', 
                                    letterSpacing: '3px',
                                    marginBottom: '10px'
                                }}>
                                    {program.category?.name || 'General'}
                                </div>
                                <div style={{ 
                                    fontSize: '6rem', 
                                    fontWeight: 900, 
                                    color: settings?.posterPrimaryColor || '#1e293b', 
                                    letterSpacing: '-2px', 
                                    margin: '0', 
                                    lineHeight: 0.9,
                                    textTransform: 'uppercase'
                                }}>
                                    {program.name}
                                </div>
                            </div>

                            {/* Winners Render based on selected style */}
                            {posterStyle === 'nophoto' ? (
                              /* Clean Without Photo / Typography Style */
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', maxWidth: '850px', margin: '0 auto', width: '100%' }}>
                                  {winners.map((winner: any) => (
                                      <WinnerNoPhotoCard 
                                          key={winner.id} 
                                          result={winner} 
                                          rank={winner.rank} 
                                          secondaryColor={settings?.posterSecondaryColor}
                                          textColor={settings?.posterTextColor}
                                      />
                                  ))}
                              </div>
                            ) : (
                              /* Photo Cards Style */
                              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '0 40px', gap: '30px', flexWrap: 'wrap' }}>
                                  {winners.map((winner: any) => (
                                      <WinnerCard 
                                          key={winner.id} 
                                          result={winner} 
                                          rank={winner.rank} 
                                          secondaryColor={settings?.posterSecondaryColor}
                                          textColor={settings?.posterTextColor}
                                      />
                                  ))}
                              </div>
                            )}
                        </div>

                        {/* Bottom Empty Space (approx 25%) */}
                        <div style={{ height: '25%' }}></div>
                    </div>
                </div>
            </div>
        )}
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

      <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--spacing-xl)' }}>
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
    secondaryColor = "#f97316", 
    textColor = "#1e293b" 
}: { 
    result: any, 
    rank: number, 
    secondaryColor?: string, 
    textColor?: string 
}) {
    const photoSize = '240px'; // Slightly larger for 1080p
    
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

function WinnerNoPhotoCard({ 
    result, 
    rank, 
    secondaryColor = "#f97316", 
    textColor = "#1e293b" 
}: { 
    result: any, 
    rank: number, 
    secondaryColor?: string, 
    textColor?: string 
}) {
    const displayName = result.candidate?.name || result.team?.name || 'Participant';
    const teamName = result.candidate?.team?.name || result.team?.name || '';
    const rankLabel = rank === 1 ? '1ST PRIZE' : rank === 2 ? '2ND PRIZE' : '3RD PRIZE';

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '20px 32px',
            borderLeft: `10px solid ${secondaryColor}`,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)'
        }}>
            <div style={{ textAlign: 'left' }}>
                <div style={{ 
                    fontSize: '2rem', 
                    fontWeight: 900, 
                    color: textColor, 
                    lineHeight: 1.1,
                    textTransform: 'uppercase',
                    marginBottom: '4px'
                }}>
                    {displayName}
                </div>
                <div style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 700, 
                    color: secondaryColor,
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    {teamName}
                </div>
            </div>

            <div style={{
                backgroundColor: secondaryColor,
                color: 'white',
                padding: '10px 24px',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '1.2rem',
                letterSpacing: '1px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}>
                {rankLabel}
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
