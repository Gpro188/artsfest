"use client";

import { useState } from "react";
import { addCandidate } from "./actions";
import ImageUpload from "../../components/ImageUpload";

export default function CandidateForm({ 
  teamId: initialTeamId = "", 
  teams = [], 
  categories, 
  isRegistrationOpen = true, 
  statusMessage = "",
  isAdmin = false
}: { 
  teamId?: string, 
  teams?: any[], 
  categories: any[], 
  isRegistrationOpen?: boolean, 
  statusMessage?: string,
  isAdmin?: boolean
}) {
  const [name, setName] = useState("");
  const [chestNumber, setChestNumber] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState(initialTeamId || teams[0]?.id || "");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [photo, setPhoto] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isRegistrationOpen && !isAdmin) {
    return (
      <div style={{ 
        padding: 'var(--spacing-lg)', 
        backgroundColor: 'rgba(239, 68, 68, 0.05)', 
        border: '1px dashed var(--error)', 
        borderRadius: 'var(--radius-md)',
        textAlign: 'center',
        color: 'var(--error)'
      }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🕒</div>
        <strong>Registration Closed / Not Started</strong>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem' }}>{statusMessage || "The deadline for adding candidates has passed. Please contact the administrator for any urgent changes."}</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) {
      setError("Please select a team for this candidate.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess(false);
    
    const result = await addCandidate({ 
      name, 
      categoryId, 
      teamId: selectedTeamId, 
      photo, 
      chestNumber: chestNumber.trim() || undefined 
    });
    
    if (result.success) {
      setSuccess(true);
      setName("");
      setChestNumber("");
      setPhoto("");
    } else {
      setError(result.error || "Failed to add candidate");
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
      {success && (
        <div style={{ color: 'var(--success)', marginBottom: 'var(--spacing-sm)', padding: 'var(--spacing-xs)', border: '1px solid var(--success)', borderRadius: 'var(--radius-md)' }}>
          Candidate added successfully!
        </div>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1.5fr 1fr 1.5fr 1.5fr 1.5fr auto' : '2fr 1fr 1.5fr 2fr auto', gap: 'var(--spacing-md)', alignItems: 'end' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Candidate Name</label>
          <input 
            type="text" 
            className="form-input" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
            required
          />
          <span className="field-helper">Enter full name.</span>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Chest Number</label>
          <input 
            type="text" 
            className="form-input" 
            value={chestNumber}
            onChange={(e) => setChestNumber(e.target.value)}
            placeholder="Optional"
          />
          <span className="field-helper">Manual Chest No.</span>
        </div>
        
        {isAdmin && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Team</label>
            <select 
              className="form-input" 
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              required
            >
              <option value="">Select Team...</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <span className="field-helper">Team participant belongs to.</span>
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Category</label>
          <select 
            className="form-input" 
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
          <span className="field-helper">Age-group division.</span>
        </div>

        <ImageUpload 
          label="Photo (Optional)" 
          folder="candidates" 
          initialUrl={photo}
          onUploadComplete={(url) => setPhoto(url)} 
        />
        
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '42px', marginBottom: 'var(--spacing-md)' }}>
          {loading ? "Adding..." : "Add Candidate"}
        </button>
      </div>
    </form>
  );
}
