import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import PrintButton from "@/components/PrintButton";

export default async function PrintJudgesSheetPage(props: {
  searchParams: Promise<{ programId?: string; eventId?: string }>;
}) {
  const searchParams = await props.searchParams;
  const { programId, eventId } = searchParams;

  if (!programId) {
    // If no specific programId, fetch all programs for the event
    const programs = await prisma.program.findMany({
      where: eventId ? { eventId } : {},
      include: {
        category: true,
        event: true,
        assignments: {
          include: {
            candidate: { include: { team: true } }
          },
          orderBy: [
            { slotNumber: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      },
      orderBy: { name: 'asc' }
    });

    const settings = await getSettings(eventId);

    return (
      <div style={{ padding: '30px', backgroundColor: 'white', color: 'black', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            .no-print { display: none !important; }
            .page-break { page-break-after: always; }
            body { background: white !important; color: black !important; }
          }
        `}} />

        {programs.map((program, index) => (
          <div key={program.id} className={index < programs.length - 1 ? "page-break" : ""} style={{ marginBottom: '40px' }}>
            <HeaderBlock settings={settings} program={program} title="JUDGES TABULATION SHEET" />
            <TabulationTable assignments={program.assignments} />
            <FooterSignatures />
          </div>
        ))}

        <div className="no-print" style={{ position: 'fixed', bottom: '20px', right: '20px' }}>
          <PrintButton label="Print All Tabulation Sheets" />
        </div>
      </div>
    );
  }

  // Single program view
  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: {
      category: true,
      event: true,
      assignments: {
        include: {
          candidate: { include: { team: true } }
        },
        orderBy: [
          { slotNumber: 'asc' },
          { createdAt: 'asc' }
        ]
      }
    }
  });

  if (!program) return <div>Program not found.</div>;

  const settings = await getSettings(program.eventId);

  return (
    <div style={{ padding: '30px', backgroundColor: 'white', color: 'black', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <HeaderBlock settings={settings} program={program} title="JUDGES TABULATION SHEET" />
      <TabulationTable assignments={program.assignments} />
      <FooterSignatures />

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
        }
      `}} />
      
      <div className="no-print" style={{ position: 'fixed', bottom: '20px', right: '20px' }}>
        <PrintButton label="Print Tabulation Sheet" />
      </div>
    </div>
  );
}

function HeaderBlock({ settings, program, title }: { settings: any; program: any; title: string }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid black', paddingBottom: '15px' }}>
      <h1 style={{ margin: '0 0 4px 0', fontSize: '1.8rem', textTransform: 'uppercase' }}>{settings.festName}</h1>
      <h2 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</h2>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', padding: '10px 15px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.95rem' }}>
        <div><strong>Program:</strong> {program.name} {program.programCode ? `(${program.programCode})` : ''}</div>
        <div><strong>Category:</strong> {program.category?.name || 'General'}</div>
        <div><strong>Venue:</strong> {program.venue || 'TBD'}</div>
        <div><strong>Stage:</strong> {program.stageType}</div>
        <div><strong>Type:</strong> {program.type}</div>
      </div>
    </div>
  );
}

function TabulationTable({ assignments }: { assignments: any[] }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '0.9rem' }}>
      <thead>
        <tr style={{ backgroundColor: '#e2e8f0', textTransform: 'uppercase' }}>
          <th style={{ border: '1px solid black', padding: '8px', width: '50px', textAlign: 'center' }}>Code / Slot</th>
          <th style={{ border: '1px solid black', padding: '8px', width: '100px', textAlign: 'center' }}>Chest No</th>
          <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left' }}>Candidate / Team Name</th>
          <th style={{ border: '1px solid black', padding: '8px', width: '100px', textAlign: 'center' }}>Criterion 1 (30)</th>
          <th style={{ border: '1px solid black', padding: '8px', width: '100px', textAlign: 'center' }}>Criterion 2 (30)</th>
          <th style={{ border: '1px solid black', padding: '8px', width: '100px', textAlign: 'center' }}>Criterion 3 (40)</th>
          <th style={{ border: '1px solid black', padding: '8px', width: '90px', textAlign: 'center' }}>Total (100)</th>
          <th style={{ border: '1px solid black', padding: '8px', width: '80px', textAlign: 'center' }}>Rank</th>
          <th style={{ border: '1px solid black', padding: '8px', width: '120px', textAlign: 'center' }}>Judge's Remarks</th>
        </tr>
      </thead>
      <tbody>
        {assignments.length === 0 ? (
          <tr>
            <td colSpan={9} style={{ border: '1px solid black', padding: '20px', textAlign: 'center', color: '#64748b' }}>
              No candidates assigned to this program yet.
            </td>
          </tr>
        ) : (
          assignments.map((ast, idx) => (
            <tr key={ast.id} style={{ height: '40px' }}>
              <td style={{ border: '1px solid black', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                {ast.slotNumber || idx + 1}
              </td>
              <td style={{ border: '1px solid black', padding: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '1rem' }}>
                {ast.candidate?.chestNumber || '-'}
              </td>
              <td style={{ border: '1px solid black', padding: '6px' }}>
                <div style={{ fontWeight: 'bold' }}>{ast.candidate?.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#475569' }}>{ast.candidate?.team?.name}</div>
              </td>
              <td style={{ border: '1px solid black', padding: '6px' }}></td>
              <td style={{ border: '1px solid black', padding: '6px' }}></td>
              <td style={{ border: '1px solid black', padding: '6px' }}></td>
              <td style={{ border: '1px solid black', padding: '6px' }}></td>
              <td style={{ border: '1px solid black', padding: '6px' }}></td>
              <td style={{ border: '1px solid black', padding: '6px' }}></td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function FooterSignatures() {
  return (
    <div style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
      <div style={{ borderTop: '1px solid black', textAlign: 'center', paddingTop: '8px', fontSize: '0.85rem' }}>
        <strong>Judge 1 Signature & Name</strong>
      </div>
      <div style={{ borderTop: '1px solid black', textAlign: 'center', paddingTop: '8px', fontSize: '0.85rem' }}>
        <strong>Judge 2 Signature & Name</strong>
      </div>
      <div style={{ borderTop: '1px solid black', textAlign: 'center', paddingTop: '8px', fontSize: '0.85rem' }}>
        <strong>Stage Manager / Convener</strong>
      </div>
    </div>
  );
}
