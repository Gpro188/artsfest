"use client";

import { useState } from "react";
import { updateResultDetails } from "./actions";

export default function EditResultModal({ result, onClose }: { result: any, onClose: () => void }) {
  const [marks, setMarks] = useState(result.marks !== undefined && result.marks !== null ? result.marks.toString() : "");
  const [rank, setRank] = useState<string>(result.rank ? result.rank.toString() : "");
  const [grade, setGrade] = useState<string>(result.grade || "");
  const [isPublished, setIsPublished] = useState<boolean>(!!result.isPublished);
  const [status, setStatus] = useState<string>(result.status || "COMPLETED");
  const [penaltyReason, setPenaltyReason] = useState<string>(result.penaltyReason || "");
  const [penaltyMarks, setPenaltyMarks] = useState<string>(result.penaltyMarks ? result.penaltyMarks.toString() : "");
  const [penaltyTarget, setPenaltyTarget] = useState<string>(result.penaltyTarget || "INDIVIDUAL");
  const [penaltyDescription, setPenaltyDescription] = useState<string>(result.penaltyDescription || "");
  const [loading, setLoading] = useState(false);

  const handleSituationChange = (situation: string) => {
    setPenaltyReason(situation);
    if (!situation) {
      setStatus("COMPLETED");
      setPenaltyMarks("");
      setPenaltyTarget("INDIVIDUAL");
      setPenaltyDescription("");
      return;
    }

    if (situation === "ABSENT") {
      setStatus("ABSENT");
      setRank("");
      setGrade("");
      setMarks("0");
      setPenaltyMarks("0");
      setPenaltyTarget("INDIVIDUAL");
    } else if (situation === "IMPERSONATION") {
      setStatus("DISQUALIFIED");
      setRank("");
      setGrade("");
      setMarks("0");
      setPenaltyMarks("20");
      setPenaltyTarget("TEAM_TOTAL");
    } else if (situation === "CHEATING") {
      setStatus("DISQUALIFIED");
      setRank("");
      setGrade("");
      setMarks("0");
      setPenaltyMarks("15");
      setPenaltyTarget("TEAM_TOTAL");
    } else if (situation === "BEYOND_LIMIT") {
      setStatus("PENALIZED");
      setPenaltyMarks("5");
      setPenaltyTarget("INDIVIDUAL");
    } else {
      setStatus("PENALIZED");
      setPenaltyMarks(penaltyMarks || "0");
      setPenaltyTarget("INDIVIDUAL");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const parsedMarks = parseFloat(marks);
    const res = await updateResultDetails({
      id: result.id,
      marks: isNaN(parsedMarks) ? 0 : parsedMarks,
      rank: (status === "ABSENT" || status === "DISQUALIFIED") ? null : (rank ? parseInt(rank, 10) : null),
      grade: (status === "ABSENT" || status === "DISQUALIFIED") ? null : (grade || null),
      isPublished,
      status,
      penaltyMarks: penaltyMarks ? parseFloat(penaltyMarks) : 0,
      penaltyReason: penaltyReason ? penaltyReason : null,
      penaltyTarget: penaltyTarget || "INDIVIDUAL",
      penaltyDescription: penaltyDescription ? penaltyDescription : null
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
                <option value="C">Grade C</option>
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
              disabled={status === "ABSENT" || status === "DISQUALIFIED"}
              placeholder="0.00"
              required={status !== "ABSENT" && status !== "DISQUALIFIED"}
              autoFocus
            />
          </div>

          {/* DISCIPLINARY & NEGATIVE MARK (-MARK) SECTION */}
          <div style={{
            padding: '12px 14px',
            backgroundColor: penaltyReason ? 'rgba(245, 158, 11, 0.06)' : 'rgba(255, 255, 255, 0.02)',
            border: penaltyReason ? '1px solid #f59e0b' : '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--spacing-md)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: penaltyReason ? '#f59e0b' : 'var(--text-secondary)' }}>
                ⚖️ Disciplinary & -Mark Options
              </span>
              {penaltyReason && (
                <button
                  type="button"
                  onClick={() => handleSituationChange("")}
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 700 }}
                >
                  ✕ Clear Penalty
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Situation Type</label>
                <select
                  className="form-input"
                  value={penaltyReason}
                  onChange={(e) => handleSituationChange(e.target.value)}
                  style={{ padding: '6px 8px', fontSize: '0.8rem' }}
                >
                  <option value="">-- None (Normal) --</option>
                  <option value="ABSENT">❌ Absent (No Show)</option>
                  <option value="BEYOND_LIMIT">⏱️ Beyond the Limit</option>
                  <option value="IMPERSONATION">🎭 Impersonation</option>
                  <option value="CHEATING">🚫 Cheating</option>
                  <option value="OTHERS">📝 Others</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Deduction Target</label>
                <select
                  className="form-input"
                  value={penaltyTarget}
                  onChange={(e) => setPenaltyTarget(e.target.value)}
                  disabled={!penaltyReason}
                  style={{ padding: '6px 8px', fontSize: '0.8rem' }}
                >
                  <option value="INDIVIDUAL">🎯 Individual Score</option>
                  <option value="TEAM_TOTAL">🏛️ Team Total Mark</option>
                  <option value="BOTH">⚡ Both (Program + Team)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: 700, display: 'block', marginBottom: '2px' }}>-Mark (Deduction)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--danger, #ef4444)' }}>-</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    className="form-input"
                    value={penaltyMarks}
                    onChange={(e) => setPenaltyMarks(e.target.value)}
                    placeholder="0"
                    disabled={!penaltyReason}
                    style={{ padding: '6px 8px', fontSize: '0.85rem', fontWeight: 800, textAlign: 'center' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.68rem', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Status Override</label>
                <select
                  className="form-input"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    if (e.target.value === "ABSENT" || e.target.value === "DISQUALIFIED") {
                      setRank("");
                      setGrade("");
                      setMarks("0");
                    }
                  }}
                  style={{ padding: '6px 8px', fontSize: '0.8rem', fontWeight: 700 }}
                >
                  <option value="COMPLETED">Completed</option>
                  <option value="PENALIZED">Penalized (-Mark)</option>
                  <option value="DISQUALIFIED">Disqualified</option>
                  <option value="ABSENT">Absent</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Incident / Reason Note</label>
              <input
                type="text"
                className="form-input"
                value={penaltyDescription}
                onChange={(e) => setPenaltyDescription(e.target.value)}
                placeholder="e.g. Exceeded time limit by 45s"
                style={{ padding: '6px 8px', fontSize: '0.8rem' }}
              />
            </div>
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
