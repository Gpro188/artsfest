"use client";

import { useState, useEffect } from "react";
import { updateProgramSchedule, autoCalculateCandidateSlots } from "./actions";
import { importScheduleFromExcel, checkSchedulingConflicts } from "./importActions";

export default function AdminScheduler({ initialPrograms, eventId }: { initialPrograms: any[], eventId: string }) {
  const [programs, setPrograms] = useState(initialPrograms);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);

  // Sync state with props when switching events
  useEffect(() => {
    setPrograms(initialPrograms);
  }, [initialPrograms]);

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

  // Extract all unique venues already created/used across programs
  const existingVenues = Array.from(new Set(programs.map(p => p.venue?.trim()).filter(Boolean)));
  const [newVenueName, setNewVenueName] = useState("");
  const [venuesList, setVenuesList] = useState<string[]>(existingVenues.length > 0 ? existingVenues : ["Stage 1 - Main Auditorium", "Stage 2 - Open Air", "Stage 3 - Mini Hall"]);
  const [activeVenueFilter, setActiveVenueFilter] = useState<string>("ALL");

  const addCustomVenue = () => {
    if (!newVenueName.trim()) return;
    const name = newVenueName.trim();
    if (!venuesList.includes(name)) {
      setVenuesList([...venuesList, name]);
    }
    setNewVenueName("");
  };

  const filteredPrograms = activeVenueFilter === "ALL" 
    ? programs 
    : programs.filter(p => p.venue?.trim() === activeVenueFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      
      {/* 🎪 Venue Manager Bar */}
      <div className="glass-panel" style={{ padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🎪</span> Festival Venues Manager
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Add venue names first, then filter programs by venue or assign venues in 1-click.
            </p>
          </div>

          {/* Quick Add Venue */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Main Auditorium" 
              value={newVenueName}
              onChange={(e) => setNewVenueName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomVenue()}
              style={{ width: '200px', fontSize: '0.85rem', padding: '6px 12px' }}
            />
            <button onClick={addCustomVenue} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
              + Add Venue
            </button>
          </div>
        </div>

        {/* Filter / Quick Assign & Manage Venue Badges */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Filter View:</span>
          <button
            onClick={() => setActiveVenueFilter("ALL")}
            className={`btn ${activeVenueFilter === "ALL" ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '20px' }}
          >
            All Venues ({programs.length})
          </button>

          {venuesList.map(v => {
            const count = programs.filter(p => p.venue?.trim() === v).length;
            const isActive = activeVenueFilter === v;

            return (
              <div 
                key={v}
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  backgroundColor: isActive ? 'var(--primary)' : 'var(--surface-color)', 
                  color: isActive ? 'white' : 'var(--text-primary)',
                  borderRadius: '20px', 
                  border: '1px solid var(--border-color)',
                  padding: '2px 8px 2px 12px',
                  fontSize: '0.75rem',
                  gap: '6px'
                }}
              >
                <span 
                  onClick={() => setActiveVenueFilter(v)}
                  style={{ cursor: 'pointer', fontWeight: 600 }}
                >
                  🎪 {v} ({count})
                </span>

                {/* Edit Venue Name Button */}
                <button
                  title="Rename Venue"
                  onClick={() => {
                    const newName = prompt(`Rename venue "${v}":`, v);
                    if (newName && newName.trim() && newName.trim() !== v) {
                      const updatedName = newName.trim();
                      setVenuesList(venuesList.map(item => item === v ? updatedName : item));
                      if (activeVenueFilter === v) setActiveVenueFilter(updatedName);
                      // Update any programs assigned to this venue locally
                      setPrograms(programs.map(p => p.venue?.trim() === v ? { ...p, venue: updatedName } : p));
                    }
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontSize: '0.7rem', opacity: 0.8 }}
                >
                  ✏️
                </button>

                {/* Delete Venue Badge Button */}
                <button
                  title="Remove Venue Badge"
                  onClick={() => {
                    if (confirm(`Remove venue "${v}" from quick selection?`)) {
                      setVenuesList(venuesList.filter(item => item !== v));
                      if (activeVenueFilter === v) setActiveVenueFilter("ALL");
                    }
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontSize: '0.7rem', opacity: 0.8 }}
                >
                  ❌
                </button>
              </div>
            );
          })}
        </div>
      </div>

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

      {filteredPrograms.map((program) => {
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
                {/* Datalist / Select dropdown connected with venuesList */}
                <input 
                  type="text" 
                  className="form-input" 
                  defaultValue={program.venue || ""} 
                  id={`venue-${program.id}`} 
                  list={`venues-list-${program.id}`}
                  placeholder="Select or type venue..."
                />
                <datalist id={`venues-list-${program.id}`}>
                  {venuesList.map(v => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
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
