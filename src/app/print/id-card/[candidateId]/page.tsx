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
  const isHeavy = progCount > 8;

  return (
    <div style={{ padding: '40px', backgroundColor: '#f3f4f6', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* ID Card Container */}
      <div id="id-card" style={{ 
        width: '350px', 
        height: '550px', 
        backgroundColor: 'white', 
        borderRadius: '15px', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        border: '1px solid #e5e7eb'
      }}>
        {/* Header Design */}
        <div style={{ 
          minHeight: isHeavy ? '58px' : '70px', 
          backgroundColor: candidate.team.flagColor || '#4F46E5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          color: 'white',
          padding: isHeavy ? '6px 14px' : '10px 16px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {settings.festLogo && (
            <div style={{ width: isHeavy ? '30px' : '36px', height: isHeavy ? '30px' : '36px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.95)', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img src={settings.festLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          )}
          <div>
            <h2 style={{ margin: 0, fontSize: isHeavy ? '1.05rem' : '1.15rem', fontWeight: 800, letterSpacing: '1px' }}>{settings.festName}</h2>
            <p style={{ margin: '1px 0 0 0', fontSize: '0.55rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Official Candidate Card</p>
          </div>
        </div>

        {/* Photo & Chest Number Section */}
        <div style={{ padding: isHeavy ? '14px 20px 6px 20px' : '26px 20px 10px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: isHeavy ? '100px' : '130px', height: isHeavy ? '100px' : '130px' }}>
            {/* Photo */}
            <div style={{ 
              width: '100%', 
              height: '100%', 
              borderRadius: isHeavy ? '12px' : '15px', 
              backgroundColor: '#f3f4f6', 
              border: '3px solid #fff',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              {candidate.photo ? (
                <img src={candidate.photo} alt={candidate.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isHeavy ? '2.2rem' : '3rem' }}>👤</div>
              )}
            </div>

          </div>

          {/* Faint Background Text */}
          <div style={{ 
            position: 'absolute', 
            top: isHeavy ? '90px' : '120px', 
            left: '0', 
            right: '0', 
            textAlign: 'center', 
            zIndex: 1, 
            opacity: 0.05, 
            fontSize: '3rem', 
            fontWeight: 900, 
            pointerEvents: 'none',
            textTransform: 'uppercase'
          }}>
            {candidate.team.name}
          </div>
        </div>

        {/* Candidate Name & Team Badge */}
        <div style={{ textAlign: 'center', padding: isHeavy ? '0 16px 6px 16px' : '0 20px 10px 20px' }}>
          <h3 style={{ margin: '0 0 1px 0', fontSize: isHeavy ? '1.5rem' : '1.8rem', fontWeight: 900, color: '#1e1b4b' }}>
            {candidate.chestNumber || '??'}
          </h3>
          <div style={{ margin: '0 0 6px 0', fontSize: isHeavy ? '0.95rem' : '1.1rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase' }}>
            {candidate.name}
          </div>
          <div style={{ 
            display: 'inline-block', 
            padding: isHeavy ? '2px 12px' : '4px 15px', 
            backgroundColor: `${candidate.team.flagColor}15`, 
            color: candidate.team.flagColor || '#4F46E5',
            borderRadius: '20px',
            fontSize: isHeavy ? '0.75rem' : '0.85rem',
            fontWeight: 800,
            border: `1px solid ${candidate.team.flagColor}30`
          }}>
            {candidate.team.name}
          </div>
        </div>

        {/* Details Section */}
        <div style={{ padding: isHeavy ? '0 16px 12px 16px' : '0 20px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', borderTop: '1px solid #f3f4f6', paddingTop: isHeavy ? '6px' : '10px', marginBottom: isHeavy ? '6px' : '10px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.55rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>Category</div>
              <div style={{ fontSize: isHeavy ? '0.75rem' : '0.85rem', fontWeight: 700, color: '#1e1b4b' }}>{candidate.category.name}</div>
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div style={{ fontSize: '0.55rem', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600 }}>Event</div>
              <div style={{ fontSize: isHeavy ? '0.75rem' : '0.85rem', fontWeight: 700, color: '#1e1b4b' }}>{settings.festName}</div>
            </div>
          </div>

          {(() => {
            const count = candidate.programs.length;
            const isDense = count > 8;
            const isMedium = count > 6 && count <= 8;
            const displayedPrograms = candidate.programs; // show all programs fitted

            return (
              <>
                <div style={{ 
                  fontSize: isDense ? '0.55rem' : '0.6rem', 
                  color: '#9ca3af', 
                  textTransform: 'uppercase', 
                  fontWeight: 700, 
                  marginBottom: isDense ? '4px' : '6px', 
                  textAlign: 'center',
                  letterSpacing: '0.5px'
                }}>
                  Assigned Programs ({count})
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: isDense && count > 12 ? '1fr 1fr 1fr' : '1fr 1fr', 
                  gap: isDense ? '3px 4px' : isMedium ? '4px 6px' : '6px', 
                  maxHeight: isDense ? '210px' : '185px', 
                  overflowY: count > 16 ? 'auto' : 'hidden',
                  alignContent: 'start',
                  flex: 1
                }}>
                  {displayedPrograms.map(p => {
                    const displayTime = p.scheduledTime || p.program.startTime;
                    return (
                      <div key={p.id} style={{ 
                        fontSize: isDense ? '0.54rem' : isMedium ? '0.6rem' : '0.65rem', 
                        backgroundColor: '#f9fafb', 
                        padding: isDense ? '2px 4px' : '4px 6px', 
                        borderRadius: '4px',
                        border: '1px solid #e5e7eb',
                        color: '#4b5563',
                        lineHeight: '1.15',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        minHeight: isDense ? '22px' : 'auto'
                      }}>
                        <div style={{ 
                          fontWeight: 700, 
                          color: '#1e1b4b', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis' 
                        }} title={p.program.name}>
                          {p.program.name}
                        </div>
                        {displayTime && !isDense && (
                          <div style={{ fontSize: '0.52rem', color: '#4F46E5', marginTop: '1px', fontWeight: 600 }}>
                            {new Date(displayTime).toLocaleDateString([], { day: '2-digit', month: 'short' })} {new Date(displayTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {p.program.venue ? ` @ ${p.program.venue}` : ''}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {count === 0 && (
                    <span style={{ fontSize: '0.7rem', color: '#9ca3af', gridColumn: 'span 2', textAlign: 'center', padding: '10px 0' }}>
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
          padding: '15px', 
          backgroundColor: '#f9fafb', 
          borderTop: '1px solid #f3f4f6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '80px', height: '30px', borderBottom: '1px solid #d1d5db', marginBottom: '4px' }}></div>
            <div style={{ fontSize: '0.5rem', color: '#9ca3af' }}>ADMIN SIGN</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.6rem', color: '#9ca3af' }}>
            Generated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

       <div className="no-print" style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
          <PrintButton label="Print ID Card" color="#4F46E5" />
          <BackButton label="← Go Back" />
       </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          #id-card { 
            box-shadow: none !important; 
            border: 1px solid #eee !important;
            margin: 0 auto;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}} />
    </div>
  );
}
