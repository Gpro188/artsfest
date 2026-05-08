"use client";

import { useState } from "react";
import { updateResultMark } from "./actions";

export default function EditResultModal({ result, onClose }: { result: any, onClose: () => void }) {
  const [marks, setMarks] = useState(result.marks.toString());
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await updateResultMark(result.id, parseFloat(marks));
    if (res.success) {
      onClose();
    } else {
      alert(res.error);
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel" style={{ width: '400px', padding: 'var(--spacing-lg)', position: 'relative' }}>
        <button onClick={onClose} className="modal-close">&times;</button>
        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Edit Marks</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
          Update marks for <strong>{result.candidate?.name || result.team?.name || 'Unknown'}</strong> in <strong>{result.program.name}</strong>.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Marks</label>
            <input 
              type="number" 
              step="0.01"
              className="form-input" 
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-xl)' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
