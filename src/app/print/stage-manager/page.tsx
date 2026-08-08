import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import PrintButton from "@/components/PrintButton";

export default async function PrintStageManagerPage(props: {
  searchParams: Promise<{ eventId?: string; venue?: string }>;
}) {
  const searchParams = await props.searchParams;
  const { eventId, venue } = searchParams;
  const settings = await getSettings(eventId);

  const whereClause: any = {};
  if (eventId) whereClause.eventId = eventId;
  if (venue) whereClause.venue = venue;

  const programs = await prisma.program.findMany({
    where: whereClause,
    orderBy: [
      { venue: 'asc' },
      { startTime: 'asc' }
    ],
    include: {
      category: true,
      assignments: {
        include: {
          candidate: {
            include: { team: true }
          }
        },
        orderBy: [
          { slotNumber: 'asc' },
          { createdAt: 'asc' }
        ]
      }
    }
  });

  // Group by venue
  const venueGroups: Record<string, any[]> = {};
  programs.forEach(p => {
    const v = p.venue?.trim() || "Unassigned Venue";
    if (!venueGroups[v]) venueGroups[v] = [];
    venueGroups[v].push(p);
  });

  return (
    <div style={{ padding: '30px', backgroundColor: 'white', color: 'black', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          .page-break { page-break-after: always; }
          body { background: white !important; color: black !important; }
        }
      `}} />

      <div style={{ textAlign: 'center', marginBottom: '25px', borderBottom: '3px double black', paddingBottom: '15px' }}>
        <h1 style={{ margin: '0 0 5px 0', fontSize: '2rem', textTransform: 'uppercase' }}>{settings.festName}</h1>
        <h2 style={{ margin: 0, fontSize: '1.3rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          STAGE MANAGER MASTER SCHEDULE & PARTICIPANTS SHEET
        </h2>
        {venue && <p style={{ margin: '5px 0 0 0', fontWeight: 'bold', fontSize: '1.1rem' }}>VENUE: {venue}</p>}
      </div>

      {Object.keys(venueGroups).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No scheduled programs found.</div>
      ) : (
        Object.entries(venueGroups).map(([venueName, venuePrograms], vIdx) => (
          <div key={venueName} style={{ marginBottom: '40px' }} className={vIdx < Object.keys(venueGroups).length - 1 ? "page-break" : ""}>
            <div style={{ backgroundColor: '#1e293b', color: 'white', padding: '10px 15px', borderRadius: '4px', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🎪 VENUE: {venueName}</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>{venuePrograms.length} Programs</span>
            </div>

            {venuePrograms.map((prog) => {
              const endTime = prog.startTime ? new Date(new Date(prog.startTime).getTime() + ((prog.duration || 10) * 60000)) : null;

              return (
                <div key={prog.id} style={{ marginBottom: '30px', border: '1px solid #94a3b8', borderRadius: '6px', overflow: 'hidden', pageBreakInside: 'avoid' }}>
                  {/* Program Header */}
                  <div style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #94a3b8', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#0f172a' }}>
                        {prog.programCode ? `[${prog.programCode}] ` : ''}{prog.name}
                      </h3>
                      <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                        Category: <strong>{prog.category?.name || 'General'}</strong> | Type: <strong>{prog.type}</strong> | Stage: <strong>{prog.stageType}</strong>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                      <div><strong>Scheduled Start:</strong> {prog.startTime ? new Date(prog.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}</div>
                      {endTime && <div><strong>Est. End:</strong> {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                    </div>
                  </div>

                  {/* Candidates List Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#e2e8f0', textTransform: 'uppercase' }}>
                        <th style={{ border: '1px solid #cbd5e1', padding: '6px', width: '50px', textAlign: 'center' }}>Slot</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '6px', width: '90px', textAlign: 'center' }}>Chest No</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'left' }}>Candidate Name</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'left' }}>Team</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '6px', width: '110px', textAlign: 'center' }}>Slot Time</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '6px', width: '90px', textAlign: 'center' }}>Reported?</th>
                        <th style={{ border: '1px solid #cbd5e1', padding: '6px', width: '90px', textAlign: 'center' }}>On Stage?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prog.assignments.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ border: '1px solid #cbd5e1', padding: '12px', textAlign: 'center', color: '#64748b' }}>
                            No candidates assigned to this program.
                          </td>
                        </tr>
                      ) : (
                        prog.assignments.map((ast: any, idx: number) => (
                          <tr key={ast.id}>
                            <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                              {ast.slotNumber || idx + 1}
                            </td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.95rem' }}>
                              {ast.candidate?.chestNumber || '-'}
                            </td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '6px', fontWeight: '500' }}>
                              {ast.candidate?.name}
                            </td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '6px', color: '#334155' }}>
                              {ast.candidate?.team?.name}
                            </td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center' }}>
                              {ast.scheduledTime ? new Date(ast.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center' }}>
                              [ &nbsp; ]
                            </td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center' }}>
                              [ &nbsp; ]
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        ))
      )}

      <div className="no-print" style={{ position: 'fixed', bottom: '20px', right: '20px' }}>
        <PrintButton label="Print Stage Manager Sheet" />
      </div>
    </div>
  );
}
