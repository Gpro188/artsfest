import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import BackButton from "@/components/BackButton";

export default async function CandidateIdCardPage({ params }: { params: Promise<{ candidateId: string }> }) {
  const resolvedParams = await params;
  const candidate = await prisma.candidate.findUnique({
    where: { id: resolvedParams.candidateId },
    include: {
      team: true,
      category: true,
      programs: {
        include: { program: true }
      }
    }
  });

  if (!candidate) notFound();

  const settings = await getSettings(candidate.team.eventId);

  const progCount = candidate.programs.length;
  const isHeavy = progCount > 6;
  const isUltraHeavy = progCount > 12;
  const isMegaHeavy = progCount > 18;

  // Keep photo well-sized: 80px for mega-heavy (never shrink to 50px!), 95px for heavy, 120px default
  const photoSize = isUltraHeavy ? '80px' : isHeavy ? '95px' : '120px';

  return (
    <div style={{ padding: '30px 15px', backgroundColor: '#f3f4f6', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* ID Card Container */}
      <div id="id-card" style={{ 
        width: '350px', 
        minHeight: '550px', 
        height: 'auto', 
        backgroundColor: 'white', 
        borderRadius: '15px', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid #e5e7eb',
        boxSizing: 'border-box'
      }}>
        {/* Header Design */}
        <div style={{ 
          minHeight: isUltraHeavy ? '46px' : isHeavy ? '54px' : '66px', 
          backgroundColor: candidate.team.flagColor || '#4F46E5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: 'white',
          padding: isUltraHeavy ? '5px 10px' : isHeavy ? '7px 14px' : '10px 16px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {settings.festLogo && (
            <div style={{ width: isUltraHeavy ? '24px' : isHeavy ? '28px' : '34px', height: isUltraHeavy ? '24px' : isHeavy ? '28px' : '34px', borderRadius: '5px', backgroundColor: 'rgba(255,255,255,0.95)', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img src={settings.festLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          )}
          <div>
            <h2 style={{ margin: 0, fontSize: isUltraHeavy ? '0.95rem' : isHeavy ? '1.05rem' : '1.15rem', fontWeight: 800, letterSpacing: '0.8px' }}>{settings.festName}</h2>
            <p style={{ margin: '1px 0 0 0', fontSize: isUltraHeavy ? '0.50rem' : '0.55rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 600 }}>Official Candidate Card</p>
          </div>
        </div>

        {/* Photo & Chest Number Section */}
        <div style={{ padding: isUltraHeavy ? '8px 16px 3px 16px' : isHeavy ? '14px 20px 5px 20px' : '22px 20px 8px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          <div style={{ position: 'relative', width: photoSize, height: photoSize, flexShrink: 0, zIndex: 2 }}>
            {/* Photo */}
            <div style={{ 
              width: '100%', 
              height: '100%', 
              borderRadius: isHeavy ? '10px' : '14px', 
              backgroundColor: '#f3f4f6', 
              border: isHeavy ? '2px solid #fff' : '3px solid #fff',
              boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              {candidate.photo ? (
                <img src={candidate.photo} alt={candidate.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isUltraHeavy ? '2.2rem' : '2.8rem' }}>👤</div>
              )}
            </div>
          </div>

          {/* Faint Background Text */}
          <div style={{ 
            position: 'absolute', 
            top: isUltraHeavy ? '65px' : isHeavy ? '80px' : '105px', 
            left: '0', 
            right: '0', 
            textAlign: 'center', 
            zIndex: 1, 
            opacity: 0.05, 
            fontSize: isUltraHeavy ? '2.2rem' : '2.8rem', 
            fontWeight: 900, 
            pointerEvents: 'none',
            textTransform: 'uppercase'
          }}>
            {candidate.team.name}
          </div>
        </div>

        {/* Candidate Name & Team Badge */}
        <div style={{ textAlign: 'center', padding: isUltraHeavy ? '0 10px 3px 10px' : isHeavy ? '0 14px 5px 14px' : '0 20px 8px 20px', position: 'relative', zIndex: 2 }}>
          <h3 style={{ margin: '0 0 1px 0', fontSize: isUltraHeavy ? '1.35rem' : isHeavy ? '1.5rem' : '1.75rem', fontWeight: 900, color: '#1e1b4b', lineHeight: 1.1 }}>
            {candidate.chestNumber || '??'}
          </h3>
          <div style={{ margin: '0 0 2px 0', fontSize: isUltraHeavy ? '0.82rem' : isHeavy ? '0.92rem' : '1.05rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', lineHeight: 1.15 }}>
            {candidate.name}
          </div>
          <div style={{ 
            display: 'inline-block', 
            padding: isUltraHeavy ? '2px 10px' : '3px 12px', 
            backgroundColor: `${candidate.team.flagColor}15`, 
            color: candidate.team.flagColor || '#4F46E5',
            borderRadius: '20px',
            fontSize: isUltraHeavy ? '0.68rem' : isHeavy ? '0.74rem' : '0.82rem',
            fontWeight: 800,
            border: `1px solid ${candidate.team.flagColor}30`,
            lineHeight: 1.1
          }}>
            {candidate.team.name}
          </div>
        </div>

        {/* Details Section */}
        <div style={{ padding: isUltraHeavy ? '0 10px 4px 10px' : isHeavy ? '0 14px 6px 14px' : '0 18px 10px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', borderTop: '1px solid #f3f4f6', paddingTop: isUltraHeavy ? '3px' : '5px', marginBottom: isUltraHeavy ? '3px' : '6px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.50rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>Category</div>
              <div style={{ fontSize: isUltraHeavy ? '0.72rem' : '0.80rem', fontWeight: 700, color: '#1e1b4b' }}>{candidate.category.name}</div>
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div style={{ fontSize: '0.50rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>Event</div>
              <div style={{ fontSize: isUltraHeavy ? '0.72rem' : '0.80rem', fontWeight: 700, color: '#1e1b4b' }}>{settings.festName}</div>
            </div>
          </div>

          {(() => {
            const count = candidate.programs.length;
            const displayedPrograms = candidate.programs; // show all programs fitted

            // Adaptive Multi-tier and 3-column shrink logic
            let baseFontSize = 0.58;
            let padding = '2.5px 5px';
            let gap = '3px 4px';
            let gridCols = '1fr 1fr';
            let showTime = count <= 6;
            let minHeight = '20px';

            if (count > 18) {
              // 3 Columns for 19+ programs: max fit, no cutting
              baseFontSize = 0.38;
              padding = '1.5px 2px';
              gap = '2px 2.5px';
              gridCols = 'repeat(3, 1fr)';
              showTime = false;
              minHeight = '16px';
            } else if (count > 12) {
              // 3 Columns for 13-18 programs
              baseFontSize = 0.44;
              padding = '2px 3px';
              gap = '2.5px 3px';
              gridCols = 'repeat(3, 1fr)';
              showTime = false;
              minHeight = '17px';
            } else if (count > 6) {
              // 2 Columns for 7-12 programs
              baseFontSize = 0.50;
              padding = '2.5px 4px';
              gap = '3px 4px';
              gridCols = '1fr 1fr';
              showTime = false;
              minHeight = '18px';
            } else if (count > 2) {
              baseFontSize = 0.58;
              padding = '3px 6px';
              gap = '3px 5px';
              gridCols = '1fr 1fr';
              showTime = true;
              minHeight = '22px';
            } else {
              baseFontSize = 0.65;
              padding = '4px 8px';
              gap = '4px';
              gridCols = '1fr';
              showTime = true;
              minHeight = '26px';
            }

            return (
              <>
                <div style={{ 
                  fontSize: '0.52rem', 
                  color: '#9ca3af', 
                  textTransform: 'uppercase', 
                  fontWeight: 700, 
                  marginBottom: '3px', 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  letterSpacing: '0.5px'
                }}>
                  <span>Assigned Programs</span>
                  <span style={{ color: '#4F46E5', fontWeight: 800 }}>{count}</span>
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: gridCols, 
                  gap: gap, 
                  alignContent: 'start',
                  flex: 1,
                  paddingBottom: '4px'
                }}>
                  {displayedPrograms.map(p => {
                    const displayTime = p.scheduledTime || p.program.startTime;
                    const rawName = p.program?.name || '';
                    const nameLen = rawName.length;

                    let itemFontSize = baseFontSize;
                    if (count > 12) {
                      if (nameLen > 24) {
                        itemFontSize = Math.min(itemFontSize, 0.32);
                      } else if (nameLen > 16) {
                        itemFontSize = Math.min(itemFontSize, 0.35);
                      }
                    } else {
                      if (nameLen > 25) {
                        itemFontSize = Math.min(itemFontSize, 0.38);
                      } else if (nameLen > 18) {
                        itemFontSize = Math.min(itemFontSize, 0.44);
                      }
                    }

                    return (
                      <div key={p.id} style={{ 
                        fontSize: `${itemFontSize}rem`, 
                        backgroundColor: '#f9fafb', 
                        padding: padding, 
                        borderRadius: '3px',
                        border: '1px solid #e5e7eb',
                        color: '#4b5563',
                        lineHeight: '1.04',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        minHeight: minHeight,
                        textAlign: 'center',
                        boxSizing: 'border-box'
                      }}>
                        <div 
                          style={{ 
                            fontWeight: 700, 
                            color: '#1e1b4b', 
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere',
                            hyphens: 'auto',
                            lineHeight: '1.04',
                            width: '100%'
                          }} 
                          title={rawName}
                        >
                          {rawName}
                        </div>
                        {displayTime && showTime && (
                          <div style={{ fontSize: '0.45rem', color: '#4F46E5', marginTop: '1px', fontWeight: 600 }}>
                            {new Date(displayTime).toLocaleDateString([], { day: '2-digit', month: 'short' })} {new Date(displayTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {p.program.venue ? ` @ ${p.program.venue}` : ''}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {count === 0 && (
                    <span style={{ fontSize: '0.7rem', color: '#9ca3af', gridColumn: count > 12 ? 'span 3' : 'span 2', textAlign: 'center', padding: '10px 0' }}>
                      No programs assigned
                    </span>
                  )}
                </div>
              </>
            );
          })()}
        </div>

        {/* Footer Signature */}
        <div style={{ 
          padding: isUltraHeavy ? '8px 14px' : '12px 16px', 
          backgroundColor: '#f9fafb', 
          borderTop: '1px solid #f3f4f6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'auto'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '70px', height: '18px', borderBottom: '1px solid #d1d5db', marginBottom: '2px' }}></div>
            <div style={{ fontSize: '0.48rem', color: '#9ca3af', fontWeight: 600 }}>ADMIN SIGN</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.55rem', color: '#9ca3af' }}>
            Generated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

       <div className="no-print" style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
          <PrintButton label="Print ID Card" color="#4F46E5" />
          <BackButton label="← Go Back" />
       </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: auto;
          margin: 8mm;
        }
        @media print {
          .no-print { display: none !important; }
          body { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #id-card { 
            box-shadow: none !important; 
            border: 1px solid #d1d5db !important;
            margin: 0 auto !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
    </div>
  );
}
