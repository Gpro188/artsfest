"use client";

import { useState, useEffect } from "react";
import { updateProgramSchedule, autoCalculateCandidateSlots } from "./actions";
import { importScheduleFromExcel, checkSchedulingConflicts } from "./importActions";

export default function AdminScheduler({ initialPrograms, eventId }: { initialPrograms: any[], eventId: string }) {
  const [programs, setPrograms] = useState(initialPrograms);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchConflicts();
  }, [programs]);

  const fetchConflicts = async () => {
    const result = await checkSchedulingConflicts(eventId);
    if (result.success) {
      setConflicts(result.conflicts || []);
    }
  };

  const handleUpdate = async (id: string, venue: string, startTime: string, duration: number, stageType: string) => {
    setLoadingId(id);
    const result = await updateProgramSchedule(id, { 
      venue: venue || null, 
      startTime: startTime || null,
      duration,
      stageType
    });

    // Also update duration/stageType - I'll modify actions.ts next
    setPrograms(programs.map(p => p.id === id ? { ...p, venue, startTime, duration, stageType } : p));
    setLoadingId(null);
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      const result = await importScheduleFromExcel(eventId, base64);
      if (result.success) {
        alert(`Successfully imported ${result.count} program schedules.`);
        window.location.reload();
      } else {
        alert(result.error);
      }
      setImporting(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      
      <div className="glass-panel" style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', border: '1px dashed var(--primary)' }}>
        <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Bulk Import Schedule (Excel)</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Upload an Excel file with columns: <strong>ProgramName, Venue, StartTime, Duration, StageType</strong>
        </p>
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleExcelImport}
          disabled={importing}
          style={{ fontSize: '0.8rem' }}
        />
        {importing && <span style={{ marginLeft: '10px' }}>Importing...</span>}
      </div>

      {conflicts.length > 0 && (
        <div style={{ 
          padding: 'var(--spacing-md)', 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid var(--error)', 
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--spacing-lg)'
        }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: 'var(--error)' }}>⚠️ Candidate Scheduling Conflicts</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.875rem' }}>
            {conflicts.map((c, i) => (
              <li key={i} style={{ marginBottom: '4px' }}>
                <strong>{c.candidateName}</strong> is scheduled for <strong>{c.programs.join(' & ')}</strong> at the same time ({c.time}).
              </li>
            ))}
          </ul>
        </div>
      )}

      {programs.map((program) => {
        const endTime = program.startTime ? new Date(new Date(program.startTime).getTime() + (program.duration * 60 * 1000)) : null;

        return (
          <div key={program.id} className="glass-panel" style={{ padding: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--primary)' }}>{program.name}</h3>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {program.stageType} • {program.category?.name || 'General'} • {program._count?.assignments || 0} Candidates
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Duration: {program.duration} min</div>
                {endTime && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>
                    Est. End: {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 0.8fr 1fr auto', gap: 'var(--spacing-sm)', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Venue</label>
                <input type="text" className="form-input" defaultValue={program.venue || ""} id={`venue-${program.id}`} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Start Time</label>
                <input type="datetime-local" className="form-input" defaultValue={program.startTime ? new Date(program.startTime).toISOString().slice(0, 16) : ""} id={`time-${program.id}`} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>
                  {program.type === "INDIVIDUAL" ? "Dur/Cand" : "Total Dur"} (Min)
                </label>
                <input type="number" className="form-input" defaultValue={program.duration} id={`dur-${program.id}`} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Stage Type</label>
                <select className="form-input" defaultValue={program.stageType} id={`stage-${program.id}`}>
                  <option value="ON_STAGE">ON STAGE</option>
                  <option value="OFF_STAGE">OFF STAGE</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                <button 
                  className="btn btn-secondary"
                  title="Auto-calculate candidate times"
                  onClick={async () => {
                    if (confirm(`Auto-calculate times for ${program._count?.assignments} candidates?`)) {
                      setLoadingId(program.id);
                      await autoCalculateCandidateSlots(program.id);
                      setLoadingId(null);
                      window.location.reload();
                    }
                  }}
                  disabled={loadingId === program.id || !program.startTime}
                >
                  ⚡ Slot
                </button>
                <button 
                  className="btn btn-primary"
                  disabled={loadingId === program.id}
                  onClick={() => {
                    const venue = (document.getElementById(`venue-${program.id}`) as HTMLInputElement).value;
                    const time = (document.getElementById(`time-${program.id}`) as HTMLInputElement).value;
                    const dur = parseInt((document.getElementById(`dur-${program.id}`) as HTMLInputElement).value) || 10;
                    const stage = (document.getElementById(`stage-${program.id}`) as HTMLSelectElement).value;
                    handleUpdate(program.id, venue, time, dur, stage);
                  }}
                >
                  {loadingId === program.id ? "..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
