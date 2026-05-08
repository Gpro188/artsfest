"use client";

import { useState } from "react";
import { updateSettings } from "./actions";

export default function SettingsForm({ initialSettings }: { initialSettings: any }) {
  const [festName, setFestName] = useState(initialSettings?.festName || "Arts Fest");
  const [festMoto, setFestMoto] = useState(initialSettings?.festMoto || "Celebrating Creativity");
  const [festLogo, setFestLogo] = useState(initialSettings?.festLogo || "");
  const [candidateRegistrationDeadline, setCandidateRegistrationDeadline] = useState(
    initialSettings?.candidateRegistrationDeadline 
      ? new Date(initialSettings.candidateRegistrationDeadline).toISOString().slice(0, 16) 
      : ""
  );
  const [programAssignmentDeadline, setProgramAssignmentDeadline] = useState(
    initialSettings?.programAssignmentDeadline 
      ? new Date(initialSettings.programAssignmentDeadline).toISOString().slice(0, 16) 
      : ""
  );
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    
    const result = await updateSettings({ 
      festName, 
      festMoto, 
      festLogo,
      candidateRegistrationDeadline: candidateRegistrationDeadline || null,
      programAssignmentDeadline: programAssignmentDeadline || null
    });
    if (result.success) {
      setStatus({ type: 'success', message: 'Settings saved successfully.' });
      window.location.reload();
    } else {
      setStatus({ type: 'error', message: 'Failed to save settings' });
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
        {festLogo && (
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Logo:</span>
            <img src={festLogo} alt="Logo Preview" style={{ height: '40px', objectFit: 'contain' }} />
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
        <div className="form-group">
          <label className="form-label">Registration Deadline</label>
          <input 
            type="datetime-local" 
            className="form-input" 
            value={candidateRegistrationDeadline}
            onChange={(e) => setCandidateRegistrationDeadline(e.target.value)}
          />
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>Managers cannot add candidates after this time.</p>
        </div>

        <div className="form-group">
          <label className="form-label">Assignment Deadline</label>
          <input 
            type="datetime-local" 
            className="form-input" 
            value={programAssignmentDeadline}
            onChange={(e) => setProgramAssignmentDeadline(e.target.value)}
          />
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>Managers cannot assign programs after this time.</p>
        </div>
      </div>
      
      <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--spacing-md)' }} disabled={loading}>
        {loading ? "Saving..." : "Save Configuration"}
      </button>
    </form>
  );
}
