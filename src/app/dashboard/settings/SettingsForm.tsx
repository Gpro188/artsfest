"use client";

import { useState, useEffect } from "react";
import { updateSettings, updateEventDeadlines } from "./actions";

export default function SettingsForm({ initialSettings, events }: { initialSettings: any, events: any[] }) {
  const [festName, setFestName] = useState(initialSettings?.festName || "Arts Fest");
  const [festMoto, setFestMoto] = useState(initialSettings?.festMoto || "Celebrating Creativity");
  const [festLogo, setFestLogo] = useState(initialSettings?.festLogo || "");
  
  // Event Deadline State
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || "");
  
  const [registrationStart, setRegistrationStart] = useState("");
  const [registrationEnd, setRegistrationEnd] = useState("");
  const [assignmentStart, setAssignmentStart] = useState("");
  const [assignmentEnd, setAssignmentEnd] = useState("");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    const selectedEvent = events.find(e => e.id === selectedEventId);
    if (selectedEvent) {
      setRegistrationStart(selectedEvent.registrationStart ? new Date(selectedEvent.registrationStart).toISOString().slice(0, 16) : "");
      setRegistrationEnd(selectedEvent.registrationEnd ? new Date(selectedEvent.registrationEnd).toISOString().slice(0, 16) : "");
      setAssignmentStart(selectedEvent.assignmentStart ? new Date(selectedEvent.assignmentStart).toISOString().slice(0, 16) : "");
      setAssignmentEnd(selectedEvent.assignmentEnd ? new Date(selectedEvent.assignmentEnd).toISOString().slice(0, 16) : "");
    }
  }, [selectedEventId, events]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    
    // Save global settings
    const result = await updateSettings({ 
      festName, 
      festMoto, 
      festLogo
    });

    // Save event deadlines
    const deadlineResult = await updateEventDeadlines(selectedEventId, {
      registrationStart: registrationStart || null,
      registrationEnd: registrationEnd || null,
      assignmentStart: assignmentStart || null,
      assignmentEnd: assignmentEnd || null,
    });

    if (result.success && deadlineResult.success) {
      setStatus({ type: 'success', message: 'Settings saved successfully.' });
    } else {
      setStatus({ type: 'error', message: 'Failed to save some settings' });
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      {status && (
        <div style={{ 
          padding: 'var(--spacing-sm)', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: 'var(--spacing-md)',
          backgroundColor: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
          color: status.type === 'error' ? 'var(--error)' : 'var(--success)',
          border: `1px solid ${status.type === 'error' ? 'var(--error)' : 'var(--success)'}`
        }}>
          {status.message}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Festival Name</label>
        <input 
          type="text" 
          className="form-input" 
          value={festName}
          onChange={(e) => setFestName(e.target.value)}
          placeholder="e.g. Hifz Fest 2024"
          required
        />
        <span className="field-helper">Displayed across the dashboard, login page, and public-facing pages.</span>
      </div>

      <div className="form-group">
        <label className="form-label">Festival Motto / Slogan</label>
        <input 
          type="text" 
          className="form-input" 
          value={festMoto}
          onChange={(e) => setFestMoto(e.target.value)}
          placeholder="e.g. Celebrating Creativity"
          required
        />
        <span className="field-helper">A short tagline shown below the festival name in the sidebar and login.</span>
      </div>
      
      <div className="form-group">
        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
          Festival Logo URL
          <span style={{ fontSize: '0.65rem', fontWeight: 400 }}>
            Free Hosting: <a href="https://imgbb.com" target="_blank" style={{ color: 'var(--primary)' }}>ImgBB</a>
          </span>
        </label>
        <input 
          type="text" 
          className="form-input" 
          value={festLogo}
          onChange={(e) => setFestLogo(e.target.value)}
          placeholder="Direct link (ends in .png/.jpg)"
        />
        <span className="field-helper">Upload your logo to a free image host and paste the direct URL here.</span>
        {festLogo && (
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Logo:</span>
            <img src={festLogo} alt="Logo Preview" style={{ height: '40px', objectFit: 'contain' }} />
          </div>
        )}
      </div>

      <hr style={{ margin: 'var(--spacing-lg) 0', borderColor: 'var(--border-color)' }} />
      <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Event Timelines & Deadlines</h3>

      {events.length > 0 ? (
        <>
          <div className="form-group">
            <label className="form-label">Select Event</label>
            <select 
              className="form-input"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <div className="form-group">
              <label className="form-label">Registration Start Time</label>
              <input 
                type="datetime-local" 
                className="form-input" 
                value={registrationStart}
                onChange={(e) => setRegistrationStart(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Registration Deadline</label>
              <input 
                type="datetime-local" 
                className="form-input" 
                value={registrationEnd}
                onChange={(e) => setRegistrationEnd(e.target.value)}
              />
            </div>
          </div>
          <span className="field-helper" style={{ display: 'block', marginBottom: 'var(--spacing-md)' }}>Managers cannot add new candidates outside this window.</span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
            <div className="form-group">
              <label className="form-label">Assignment Start Time</label>
              <input 
                type="datetime-local" 
                className="form-input" 
                value={assignmentStart}
                onChange={(e) => setAssignmentStart(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Assignment Deadline</label>
              <input 
                type="datetime-local" 
                className="form-input" 
                value={assignmentEnd}
                onChange={(e) => setAssignmentEnd(e.target.value)}
              />
            </div>
          </div>
          <span className="field-helper">Managers cannot assign programs outside this window.</span>
        </>
      ) : (
        <p style={{ color: 'var(--text-muted)' }}>No events created yet.</p>
      )}
      
      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--spacing-md)' }} disabled={loading}>
        {loading ? "Saving..." : "Save Configuration"}
      </button>
    </form>
  );
}
