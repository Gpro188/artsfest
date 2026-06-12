"use client";

import { useState, useEffect } from "react";
import { updateSettings, updateEventDeadlines, resetSystem } from "./actions";
import ImageUpload from "../../components/ImageUpload";

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
      
      <ImageUpload 
        label="Festival Logo" 
        folder="logos" 
        initialUrl={festLogo}
        onUploadComplete={(url) => setFestLogo(url)} 
      />

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
      <hr style={{ margin: 'var(--spacing-lg) 0', borderColor: 'var(--border-color)' }} />
      <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Storage Management</h3>
      <div className="form-group" style={{ 
        padding: 'var(--spacing-md)', 
        border: '1px solid rgba(239, 68, 68, 0.3)', 
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'rgba(239, 68, 68, 0.05)'
      }}>
        <h4 style={{ color: 'var(--error)', margin: '0 0 10px 0' }}>Clear Image Storage</h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
          Warning: This will permanently delete ALL images currently uploaded for candidates, teams, and posters across the entire app. Use this ONLY after a fest ends and you are preparing the system for a new one.
        </p>
        <button 
          type="button" 
          onClick={async () => {
            if (confirm("Are you absolutely sure you want to permanently delete ALL images in the Cloudflare R2 bucket? This cannot be undone!")) {
              try {
                const res = await fetch("/api/storage/clear", { method: "POST" });
                const data = await res.json();
                if (res.ok) {
                  alert(data.message || "Storage cleared successfully.");
                } else {
                  alert(data.error || "Failed to clear storage.");
                }
              } catch (e) {
                alert("An error occurred while clearing storage.");
              }
            }
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            color: 'var(--error)',
            border: '1px solid var(--error)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.85rem'
          }}
        >
          🗑️ Permanently Delete All Images
        </button>

        <h4 style={{ color: 'var(--error)', margin: '20px 0 10px 0' }}>Wipe Database (Text Data)</h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
          Warning: This will permanently delete ALL events, teams, candidates, programs, results, and managers. Your global settings and admin account will be kept.
        </p>
        <button 
          type="button" 
          onClick={async () => {
            const code = Math.floor(1000 + Math.random() * 9000).toString();
            const input = prompt(`To confirm wiping the entire database, please type this code: ${code}`);
            if (input === code) {
              setLoading(true);
              try {
                const res = await resetSystem();
                if (res.success) {
                  alert("Database completely wiped successfully.");
                  window.location.reload();
                } else {
                  alert("Error: " + res.error);
                }
              } catch (e) {
                alert("An error occurred while wiping database.");
              }
              setLoading(false);
            } else if (input !== null) {
              alert("Incorrect confirmation code. Database wipe cancelled.");
            }
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            color: 'var(--error)',
            border: '1px solid var(--error)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.85rem'
          }}
          disabled={loading}
        >
          🚨 Permanently Wipe Database
        </button>
      </div>

      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--spacing-md)' }} disabled={loading}>
        {loading ? "Saving..." : "Save Configuration"}
      </button>
    </form>
  );
}
