"use client";

import { useState } from "react";
import { createProgram } from "./actions";

type EventType = { id: string; name: string; categories: { id: string; name: string }[] };

export default function ProgramForm({ events }: { events: EventType[] }) {
  const [name, setName] = useState("");
  const [programCode, setProgramCode] = useState("");
  const [type, setType] = useState("INDIVIDUAL");
  const [eventId, setEventId] = useState(events[0]?.id || "");
  
  const selectedEvent = events.find(e => e.id === eventId);
  const categories = selectedEvent?.categories || [];
  
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [candidateLimitPerTeam, setCandidateLimitPerTeam] = useState(1);
  const [teamsAllowed, setTeamsAllowed] = useState(1);
  const [membersPerSquad, setMembersPerSquad] = useState(5);
  const [duration, setDuration] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (newType === "INDIVIDUAL") {
      setCandidateLimitPerTeam(1);
    } else {
      const calculated = teamsAllowed * membersPerSquad;
      setCandidateLimitPerTeam(calculated > 0 ? calculated : 5);
    }
  };

  const handleSquadConfigChange = (newTeams: number, newMembers: number) => {
    const validTeams = Math.max(1, newTeams || 1);
    const validMembers = Math.max(1, newMembers || 1);
    setTeamsAllowed(validTeams);
    setMembersPerSquad(validMembers);
    setCandidateLimitPerTeam(validTeams * validMembers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const result = await createProgram({
      programCode,
      name,
      type,
      categoryId: type === "GENERAL" ? null : categoryId,
      eventId,
      candidateLimitPerTeam: parseInt(candidateLimitPerTeam.toString()) || 1,
      duration: parseInt(duration.toString()) || 10,
    });
    
    if (result.success) {
      setName("");
      setProgramCode("");
      if (type === "INDIVIDUAL") {
        setCandidateLimitPerTeam(1);
      } else {
        setCandidateLimitPerTeam(teamsAllowed * membersPerSquad);
      }
    } else {
      setError(result.error || "Failed to create program");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ color: 'var(--error)', marginBottom: 'var(--spacing-sm)', padding: 'var(--spacing-xs)', border: '1px solid var(--error)', borderRadius: 'var(--radius-md)' }}>
          {error}
        </div>
      )}
      
      <div className="form-group">
        <label className="form-label">Event</label>
        <select 
          className="form-input" 
          value={eventId}
          onChange={(e) => {
            setEventId(e.target.value);
            // Reset category when event changes
            const ev = events.find(event => event.id === e.target.value);
            setCategoryId(ev?.categories[0]?.id || "");
          }}
          required
        >
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--spacing-md)' }}>
        <div className="form-group">
          <label className="form-label">Program Code</label>
          <input 
            type="text" 
            className="form-input" 
            value={programCode}
            onChange={(e) => setProgramCode(e.target.value)}
            placeholder="e.g. P101"
          />
          <span className="field-helper">Short reference code (optional). Useful for schedules and reports.</span>
        </div>

        <div className="form-group">
          <label className="form-label">Program Name</label>
          <input 
            type="text" 
            className="form-input" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Quran Recitation"
            required
          />
          <span className="field-helper">Full name displayed on results and schedules.</span>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Program Type</label>
        <select 
          className="form-input" 
          value={type}
          onChange={(e) => handleTypeChange(e.target.value)}
          required
        >
          <option value="INDIVIDUAL">Individual (Solo candidate)</option>
          <option value="GROUP">Group (Squads from category)</option>
          <option value="GENERAL">General (Open across categories)</option>
        </select>
        <span className="field-helper">Individual = scored per candidate. Group / General = scored as team/squads.</span>
      </div>

      {type !== "GENERAL" && (
        <div className="form-group">
          <label className="form-label">Category</label>
          <select 
            className="form-input" 
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            {categories.length === 0 ? (
              <option value="">No categories available</option>
            ) : (
              categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)
            )}
          </select>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">
          {type === "INDIVIDUAL" ? "Duration Per Candidate" : "Total Program Duration"} (Minutes)
        </label>
        <input 
          type="number" 
          className="form-input" 
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          min="1"
          required
        />
        <span className="field-helper">Time allocated in minutes. Used for schedule planning.</span>
      </div>

      {/* Program Limits & Squad Options */}
      {type === "INDIVIDUAL" ? (
        <div className="form-group">
          <label className="form-label">Candidates Allowed Per Team</label>
          <input 
            type="number" 
            className="form-input" 
            value={candidateLimitPerTeam}
            onChange={(e) => setCandidateLimitPerTeam(parseInt(e.target.value) || 1)}
            min="1"
            required
          />
          <span className="field-helper">Number of solo candidates a single team can enter (usually 1 or 2).</span>
        </div>
      ) : (
        <div style={{ 
          backgroundColor: 'rgba(15, 23, 42, 0.4)', 
          border: '1px solid var(--border-color)', 
          borderRadius: 'var(--radius-md)', 
          padding: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-md)'
        }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            👥 Group / Squad Participation Setup
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Teams/Squads Per Group</label>
              <input 
                type="number" 
                className="form-input" 
                value={teamsAllowed}
                onChange={(e) => handleSquadConfigChange(parseInt(e.target.value) || 1, membersPerSquad)}
                min="1"
                placeholder="e.g. 2"
                required
              />
              <span className="field-helper" style={{ fontSize: '0.7rem' }}>Entries from 1 group (e.g. 2 for 2 teams)</span>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem' }}>Members Per Squad</label>
              <input 
                type="number" 
                className="form-input" 
                value={membersPerSquad}
                onChange={(e) => handleSquadConfigChange(teamsAllowed, parseInt(e.target.value) || 1)}
                min="1"
                placeholder="e.g. 5"
                required
              />
              <span className="field-helper" style={{ fontSize: '0.7rem' }}>Avg members per team (e.g. 5 for song)</span>
            </div>
          </div>

          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--border-color)' }}>
            <div className="form-group" style={{ marginBottom: '6px' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Total Candidate Assignment Limit:
              </label>
              <input 
                type="number" 
                className="form-input" 
                value={candidateLimitPerTeam}
                onChange={(e) => setCandidateLimitPerTeam(parseInt(e.target.value) || 1)}
                min="1"
                required
              />
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-secondary)', 
              background: 'rgba(15, 92, 70, 0.08)', 
              padding: '6px 10px', 
              borderRadius: '6px',
              border: '1px solid rgba(15, 92, 70, 0.2)'
            }}>
              💡 <strong>Calculation:</strong> {teamsAllowed} Squad(s) × {membersPerSquad} Members = <strong>{candidateLimitPerTeam}</strong> Candidates allowed per team.
            </div>
          </div>
        </div>
      )}
      
      <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
        {loading ? "Creating..." : "Create Program"}
      </button>
    </form>
  );
}
