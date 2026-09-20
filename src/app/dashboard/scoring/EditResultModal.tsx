"use client";

import { useState } from "react";
import { updateResultDetails } from "./actions";

export default function EditResultModal({ result, onClose }: { result: any, onClose: () => void }) {
  const [marks, setMarks] = useState(result.marks !== undefined && result.marks !== null ? result.marks.toString() : "");
  const [rank, setRank] = useState<string>(result.rank ? result.rank.toString() : "");
  const [grade, setGrade] = useState<string>(result.grade || "");
  const [isPublished, setIsPublished] = useState<boolean>(!!result.isPublished);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const parsedMarks = parseFloat(marks);
    const res = await updateResultDetails({
      id: result.id,
      marks: isNaN(parsedMarks) ? 0 : parsedMarks,
      rank: rank ? parseInt(rank, 10) : null,
      grade: grade || null,
      isPublished
    });

    if (res.success) {
      onClose();
    } else {
      alert(res.error || "Failed to update result");
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel" style={{ width: '440px', maxWidth: '95vw', padding: 'var(--spacing-lg)', position: 'relative' }}>
        <button onClick={onClose} className="modal-close">&times;</button>
        <h3 style={{ marginBottom: 'var(--spacing-xs)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>✏️</span> Edit Result
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
          Update results for <strong>{result.candidate?.name || result.team?.name || 'Unknown'}</strong> in <strong>{result.program.name}</strong>.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Place (Rank)</label>
              <select
                className="form-input"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                style={{
                  fontWeight: rank ? 700 : 500,
                  color: rank === "1" ? '#10b981' : rank === "2" ? '#f97316' : rank === "3" ? '#ef4444' : 'inherit'
                }}
              >
                <option value="">-- No Rank --</option>
                <option value="1">🥇 1st Place</option>
                <option value="2">🥈 2nd Place</option>
                <option value="3">🥉 3rd Place</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Grade</label>
              <select
                className="form-input"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                style={{ fontWeight: grade ? 700 : 500 }}
              >
                <option value="">-- No Grade --</option>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Marks / Score</label>
            <input 
              type="number" 
              step="0.01"
              className="form-input" 
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              placeholder="0.00"
              required
              autoFocus
            />
          </div>

          <div className="form-group" style={{ 
            marginBottom: 'var(--spacing-lg)',
            padding: '10px 14px',
            backgroundColor: isPublished ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            border: `1px solid ${isPublished ? 'var(--success)' : 'var(--warning)'}`,
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
          onClick={() => setIsPublished(!isPublished)}
          >
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isPublished ? 'var(--success)' : 'var(--warning)' }}>
                {isPublished ? "🟢 Published Result" : "🟠 Draft / Unpublished"}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {isPublished ? "Visible on public portals, certificates, & scoreboards" : "Private to judges & tabulators only"}
              </div>
            </div>
            <input 
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
