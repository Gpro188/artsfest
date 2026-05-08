"use client";

import { useState } from "react";
import { updateEvent } from "./actions";

export default function EditEventModal({ event, onClose }: { event: any, onClose: () => void }) {
  const [name, setName] = useState(event.name);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateEvent(event.id, { name });
    if (result.success) {
      onClose();
    } else {
      alert(result.error);
    }
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="glass-panel" style={{ padding: 'var(--spacing-xl)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Edit Event</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Event Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
