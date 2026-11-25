"use client";

import { useState } from "react";
import { updateResultDetails } from "./actions";

export default function EditResultModal({ result, onClose }: { result: any, onClose: () => void }) {
  const [marks, setMarks] = useState(
    result.points !== undefined && result.points !== null 
      ? result.points.toString() 
      : (result.marks !== undefined && result.marks !== null ? result.marks.toString() : "")
  );
  const [rank, setRank] = useState<string>(result.rank ? result.rank.toString() : "");
  const [grade, setGrade] = useState<string>(result.grade || "");
  const [isPublished, setIsPublished] = useState<boolean>(!!result.isPublished);
  const [status, setStatus] = useState<string>(result.status || "COMPLETED");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const parsedMarks = parseFloat(marks);
    const isAbsent = status === "ABSENT";
    const res = await updateResultDetails({
      id: result.id,
      marks: isAbsent ? 0 : (isNaN(parsedMarks) ? 0 : parsedMarks),
      rank: isAbsent ? null : (rank ? parseInt(rank, 10) : null),
      grade: isAbsent ? null : (grade || null),
      isPublished,
      status
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
          Update results for <strong>{result.candidate?.name || (result.team ? `${result.team.name}${result.slotNumber ? ` (Squad ${String.fromCharCode(64 + result.slotNumber)})` : ''}` : 'Unknown')}</strong> in <strong>{result.program.name}</strong>.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Place (Rank)</label>
              <select
                className="form-input"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                disabled={status === "ABSENT"}
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
                disabled={status === "ABSENT"}
                style={{ fontWeight: grade ? 700 : 500 }}
              >
                <option value="">-- No Grade --</option>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Total Points / Marks</label>
              <input 
                type="number" 
                step="0.01"
                className="form-input" 
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                disabled={status === "ABSENT"}
                placeholder="0.00"
                required={status !== "ABSENT"}
                autoFocus
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Status</label>
              <select
                className="form-input"
                value={status}
                onChange={(e) => {
                  const val = e.target.value;
                  setStatus(val);
                  if (val === "ABSENT") {
                    setMarks("0");
                    setRank("");
                    setGrade("");
                  }
                }}
              >
                <option value="COMPLETED">✅ Completed</option>
                <option value="ABSENT">❌ Absent</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input 
                type="checkbox" 
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontWeight: 600 }}>Publish to Live Standings immediately</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
