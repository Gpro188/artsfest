"use client";

import { useState } from "react";
import { applyTotalPenalty, deleteTotalPenalty } from "./actions";
import { parsePenaltyRules, PenaltySituation } from "@/lib/penaltyRules";
import { ShieldAlert, AlertTriangle, Trash2, Edit3, CheckCircle2, User, Users, Lock, X } from "lucide-react";

export default function TotalPenaltyManager({
  eventId,
  teams,
  candidates,
  penalties,
  committeeRulesJson
}: {
  eventId: string;
  teams: Array<{ id: string; name: string; flagColor?: string | null }>;
  candidates: Array<{ id: string; name: string; chestNumber?: string | null; teamId: string; team?: { name: string; flagColor?: string | null } }>;
  penalties: Array<{
    id: string;
    eventId: string;
    targetType: string;
    teamId: string;
    candidateId?: string | null;
    reason: string;
    pointsDeducted: number;
    description?: string | null;
    createdAt: any;
    team?: { name: string; flagColor?: string | null } | null;
    candidate?: { name: string; chestNumber?: string | null } | null;
  }>;
  committeeRulesJson?: string | null;
}) {
  const committeeRules = parsePenaltyRules(committeeRulesJson);

  const [targetType, setTargetType] = useState<"TEAM" | "INDIVIDUAL">("TEAM");
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || "");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(candidates[0]?.id || "");
  const [candidateSearch, setCandidateSearch] = useState<string>("");
  const [reason, setReason] = useState<PenaltySituation>("BEYOND_LIMIT");
  const [pointsDeducted, setPointsDeducted] = useState<string>(() => {
    return committeeRules.BEYOND_LIMIT.defaultDeduction ? committeeRules.BEYOND_LIMIT.defaultDeduction.toString() : "5";
  });
  const [description, setDescription] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // When reason changes, auto-fill with Committee default
  const handleReasonChange = (newReason: PenaltySituation) => {
    setReason(newReason);
    const rule = committeeRules[newReason];
    if (rule && rule.defaultDeduction !== undefined) {
      setPointsDeducted(rule.defaultDeduction > 0 ? rule.defaultDeduction.toString() : "");
    }
  };

  const startEdit = (pen: any) => {
    setEditingId(pen.id);
    setTargetType(pen.targetType === "INDIVIDUAL" || pen.candidateId ? "INDIVIDUAL" : "TEAM");
    setSelectedTeamId(pen.teamId || teams[0]?.id || "");
    setSelectedCandidateId(pen.candidateId || candidates[0]?.id || "");
    setReason((pen.reason as PenaltySituation) || "BEYOND_LIMIT");
    setPointsDeducted(pen.pointsDeducted ? pen.pointsDeducted.toString() : "0");
    setDescription(pen.description || "");
    setStatus(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDescription("");
    setPointsDeducted(committeeRules.BEYOND_LIMIT.defaultDeduction ? committeeRules.BEYOND_LIMIT.defaultDeduction.toString() : "5");
    setReason("BEYOND_LIMIT");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const deduction = parseFloat(pointsDeducted);
    if (isNaN(deduction) || deduction <= 0) {
      setStatus({ type: 'error', message: "Please enter a valid penalty deduction mark greater than 0." });
      setLoading(false);
      return;
    }

    let teamIdToUse = selectedTeamId;
    let candidateIdToUse: string | null = null;

    if (targetType === "INDIVIDUAL") {
      candidateIdToUse = selectedCandidateId;
      const cand = candidates.find(c => c.id === selectedCandidateId);
      if (cand) {
        teamIdToUse = cand.teamId;
      }
    }

    if (!teamIdToUse) {
      setStatus({ type: 'error', message: "Please select a target team." });
      setLoading(false);
      return;
    }

    const res = await applyTotalPenalty({
      id: editingId || undefined,
      eventId,
      targetType,
      teamId: teamIdToUse,
      candidateId: candidateIdToUse,
      reason,
      pointsDeducted: deduction,
      description: description || null
    });

    if (res.success) {
      setStatus({ 
        type: 'success', 
        message: editingId ? "Total penalty updated successfully!" : "Total penalty applied successfully!" 
      });
      cancelEdit();
    } else {
      setStatus({ type: 'error', message: res.error || "Failed to save penalty" });
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Are you sure you want to remove the penalty for "${label}"? The deducted points will be restored immediately.`)) {
      return;
    }

    setLoading(true);
    setStatus(null);
    const res = await deleteTotalPenalty(id);
    if (res.success) {
      setStatus({ type: 'success', message: "Penalty removed and points restored successfully!" });
    } else {
      setStatus({ type: 'error', message: res.error || "Failed to delete penalty" });
    }
    setLoading(false);
  };

  // Filter candidates for searchable dropdown
  const filteredCandidates = candidates.filter(c => {
    if (!candidateSearch) return true;
    const q = candidateSearch.toLowerCase();
    const nameMatch = c.name?.toLowerCase().includes(q);
    const chestMatch = c.chestNumber?.toLowerCase().includes(q);
    const teamMatch = c.team?.name?.toLowerCase().includes(q);
    return nameMatch || chestMatch || teamMatch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {status && (
        <div style={{ 
          color: status.type === 'error' ? '#dc2626' : '#059669', 
          backgroundColor: status.type === 'error' ? '#fef2f2' : '#f0fdf4',
          padding: '12px 16px', 
          borderRadius: '10px',
          border: `1px solid ${status.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          fontSize: '0.95rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {status.type === 'error' ? '❌' : '✅'} {status.message}
        </div>
      )}

      {/* PENALTY ENTRY CARD */}
      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '24px', borderRadius: '16px', border: editingId ? '2px solid var(--warning)' : '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', color: editingId ? 'var(--warning)' : 'var(--danger, #ef4444)' }}>
              <ShieldAlert size={22} />
              {editingId ? "Edit Total Penalty Mark" : "Apply Total Penalty Mark (-Mark)"}
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Deducts directly from the overall <strong>Team Grand Total</strong> or <strong>Individual Candidate Total</strong> points. Not tied to any single program.
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <X size={15} /> Cancel Edit Mode
            </button>
          )}
        </div>

        {/* 1. Target Type Selector Tabs */}
        <div style={{ marginBottom: '18px' }}>
          <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
            1. Select Penalty Scope
          </label>
          <div style={{ display: 'inline-flex', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => setTargetType("TEAM")}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: targetType === "TEAM" ? 'var(--primary)' : 'transparent',
                color: targetType === "TEAM" ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              <Users size={16} />
              🏛️ Team Grand Total Mark
            </button>
            <button
              type="button"
              onClick={() => setTargetType("INDIVIDUAL")}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: targetType === "INDIVIDUAL" ? 'var(--primary)' : 'transparent',
                color: targetType === "INDIVIDUAL" ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              <User size={16} />
              👤 Individual Candidate Total Mark
            </button>
          </div>
        </div>

        {/* 2. Target Picker Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: targetType === "INDIVIDUAL" ? '1.5fr 1.2fr 1fr 1fr' : '1.5fr 1.2fr 1fr', gap: '14px', alignItems: 'flex-end', marginBottom: '16px' }}>
          {targetType === "TEAM" ? (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>
                2. Select Team / Institution
              </label>
              <select
                className="form-input"
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                required
                style={{ padding: '10px', fontSize: '0.9rem', fontWeight: 700 }}
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>🏛️ {t.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 0 }}>
                  2. Select Candidate
                </label>
                <input
                  type="text"
                  placeholder="Filter name/chest..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  style={{
                    padding: '2px 8px',
                    fontSize: '0.75rem',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--text-primary)',
                    width: '130px'
                  }}
                />
              </div>
              <select
                className="form-input"
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                required
                style={{ padding: '10px', fontSize: '0.88rem', fontWeight: 700 }}
              >
                {filteredCandidates.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.chestNumber ? `[#${c.chestNumber}] ` : ''}{c.name} ({c.team?.name || 'Independent'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 3. Reason Type */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>
              3. Violation Reason Type
            </label>
            <select
              className="form-input"
              value={reason}
              onChange={(e) => handleReasonChange(e.target.value as PenaltySituation)}
              style={{ padding: '10px', fontSize: '0.88rem', fontWeight: 700 }}
            >
              <option value="ABSENT">❌ Absent</option>
              <option value="BEYOND_LIMIT">⏱️ Beyond the Limit</option>
              <option value="IMPERSONATION">🎭 Impersonation</option>
              <option value="CHEATING">🚫 Cheating</option>
              <option value="OTHERS">📝 Others</option>
            </select>
          </div>

          {/* 4. Penalty -Mark */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--danger, #ef4444)' }}>
              4. -Mark (Deduction)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--danger, #ef4444)' }}>-</span>
              <input
                type="number"
                step="0.5"
                min="0.5"
                className="form-input"
                value={pointsDeducted}
                onChange={(e) => setPointsDeducted(e.target.value)}
                placeholder="0"
                required
                style={{
                  padding: '10px',
                  fontSize: '1.1rem',
                  fontWeight: 900,
                  textAlign: 'center',
                  color: 'var(--danger, #ef4444)',
                  border: '2px solid var(--danger, #ef4444)'
                }}
              />
            </div>
          </div>
        </div>

        {/* 5. Internal Reason Note (Private) */}
        <div className="form-group" style={{ marginBottom: '18px' }}>
          <label className="form-label" style={{ fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={13} color="var(--text-muted)" />
            <span>5. Internal Committee Notes (Private - Never Published in Public)</span>
          </label>
          <input
            type="text"
            className="form-input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Caught cheating during essay exam / Proxy candidate impersonation in group event"
            style={{ padding: '10px 14px', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="btn btn-secondary"
              style={{ padding: '10px 20px', fontWeight: 700 }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              padding: '10px 26px',
              fontWeight: 800,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: editingId ? 'var(--warning)' : 'var(--danger, #ef4444)',
              borderColor: editingId ? 'var(--warning)' : 'var(--danger, #ef4444)'
            }}
          >
            <CheckCircle2 size={18} />
            {loading ? "Processing..." : editingId ? "💾 Save Changes to Penalty" : "🚨 Apply -Mark Penalty"}
          </button>
        </div>
      </form>

      {/* ACTIVE PENALTIES TABLE */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h4 style={{ margin: '0 0 2px 0', fontSize: '1.1rem', fontWeight: 800 }}>
              Active Total Penalties Log ({penalties.length})
            </h4>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              These deductions are automatically subtracted from festival grand totals. Reasons are strictly private to administrators.
            </span>
          </div>
        </div>

        {penalties.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '10px' }}>
            🎉 No disciplinary penalties recorded. All teams and candidates are currently at full score!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '10px 12px', width: '140px' }}>Scope</th>
                  <th style={{ padding: '10px 12px' }}>Target Name</th>
                  <th style={{ padding: '10px 12px', width: '110px', textAlign: 'center' }}>-Mark Deducted</th>
                  <th style={{ padding: '10px 12px', width: '160px' }}>Violation Reason</th>
                  <th style={{ padding: '10px 12px' }}>Private Committee Note</th>
                  <th style={{ padding: '10px 12px', width: '100px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {penalties.map((pen, idx) => {
                  const isInd = pen.targetType === "INDIVIDUAL" || !!pen.candidateId;
                  const targetLabel = isInd 
                    ? `${pen.candidate?.name || 'Candidate'} ${pen.candidate?.chestNumber ? `(#${pen.candidate.chestNumber})` : ''} - ${pen.team?.name || 'Team'}`
                    : (pen.team?.name || 'Team');

                  return (
                    <tr 
                      key={pen.id} 
                      style={{ 
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'
                      }}
                    >
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          backgroundColor: isInd ? 'rgba(99, 102, 241, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: isInd ? 'var(--primary)' : 'var(--danger, #ef4444)'
                        }}>
                          {isInd ? "👤 Individual Total" : "🏛️ Team Total"}
                        </span>
                      </td>

                      <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {isInd ? `👤 ${targetLabel}` : `🏛️ ${targetLabel}`}
                      </td>

                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: '0.95rem',
                          fontWeight: 900,
                          color: 'var(--danger, #ef4444)',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          -{pen.pointsDeducted} pts
                        </span>
                      </td>

                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                        {pen.reason === "ABSENT" && "❌ Absent"}
                        {pen.reason === "BEYOND_LIMIT" && "⏱️ Beyond the Limit"}
                        {pen.reason === "IMPERSONATION" && "🎭 Impersonation"}
                        {pen.reason === "CHEATING" && "🚫 Cheating"}
                        {pen.reason === "OTHERS" && "📝 Others"}
                        {!["ABSENT", "BEYOND_LIMIT", "IMPERSONATION", "CHEATING", "OTHERS"].includes(pen.reason) && pen.reason}
                      </td>

                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                        {pen.description || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No notes</span>}
                      </td>

                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => startEdit(pen)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', fontSize: '0.9rem' }}
                            title="Edit Penalty"
                          >
                            <Edit3 size={15} color="var(--primary)" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(pen.id, targetLabel)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', fontSize: '0.9rem' }}
                            title="Delete Penalty & Restore Points"
                          >
                            <Trash2 size={15} color="var(--danger, #ef4444)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
