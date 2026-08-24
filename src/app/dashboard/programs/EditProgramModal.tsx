import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { updateProgram } from "./actions";

export default function EditProgramModal({ program, categories, onClose }: { program: any, categories: any[], onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState(program.name);
  const [programCode, setProgramCode] = useState(program.programCode || "");
  const [type, setType] = useState(program.type);
  const [categoryId, setCategoryId] = useState(program.categoryId || "");
  const [candidateLimitPerTeam, setCandidateLimitPerTeam] = useState(program.candidateLimitPerTeam || 1);
  const [teamsAllowed, setTeamsAllowed] = useState(
    program.teamsAllowed || (program.type !== "INDIVIDUAL" && program.candidateLimitPerTeam > 5 && program.candidateLimitPerTeam % 5 === 0 ? program.candidateLimitPerTeam / 5 : 1)
  );
  const [membersPerSquad, setMembersPerSquad] = useState(
    program.membersPerSquad || (program.type !== "INDIVIDUAL" && program.candidateLimitPerTeam > 1 ? Math.max(1, Math.round(program.candidateLimitPerTeam / (program.teamsAllowed || 1))) : 5)
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (newType === "INDIVIDUAL") {
      setCandidateLimitPerTeam(1);
    } else {
      const calculated = teamsAllowed * membersPerSquad;
      setCandidateLimitPerTeam(calculated > 0 ? calculated : 5);
    }
  };

  const handleSquadConfigChange = (newTeams: number, newMembers: number) => {
    const validTeams = Math.max(1, newTeams || 1);
    const validMembers = Math.max(1, newMembers || 1);
    setTeamsAllowed(validTeams);
    setMembersPerSquad(validMembers);
    setCandidateLimitPerTeam(validTeams * validMembers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateProgram(program.id, { 
      programCode,
      name, 
      type, 
      categoryId: type === "GENERAL" ? null : (categoryId || null),
      candidateLimitPerTeam: parseInt(candidateLimitPerTeam.toString()) || 1,
      teamsAllowed: type === "INDIVIDUAL" ? 1 : teamsAllowed,
      membersPerSquad: type === "INDIVIDUAL" ? 1 : membersPerSquad
    });
    if (result.success) {
      onClose();
    } else {
      alert(result.error);
    }
    setLoading(false);
  };

  if (!mounted) return null;

  return createPortal(
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        width: '100vw', 
        height: '100vh', 
        backgroundColor: 'rgba(0,0,0,0.8)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 99999,
        padding: '16px'
      }}
    >
      <div className="glass-panel" style={{ padding: 'var(--spacing-xl)', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', zIndex: 100000, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Edit Program</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--spacing-md)' }}>
            <div className="form-group">
              <label className="form-label">Code</label>
              <input 
                type="text" 
                className="form-input" 
                value={programCode} 
                onChange={(e) => setProgramCode(e.target.value)} 
                placeholder="P101"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Program Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-input" value={type} onChange={(e) => handleTypeChange(e.target.value)} required>
              <option value="INDIVIDUAL">INDIVIDUAL (Solo candidate)</option>
              <option value="GROUP">GROUP (Squads from category)</option>
              <option value="GENERAL">GENERAL (Open across categories)</option>
            </select>
          </div>
          {type !== "GENERAL" && (
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                <option value="">-- Select Category --</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
          )}

          {/* Program Limits & Squad Options */}
          {type === "INDIVIDUAL" ? (
            <div className="form-group">
              <label className="form-label">Candidates Allowed Per Team</label>
              <input 
                type="number" 
                className="form-input" 
                value={candidateLimitPerTeam} 
                onChange={(e) => setCandidateLimitPerTeam(parseInt(e.target.value) || 1)} 
                min="1"
                required 
              />
              <span className="field-helper">Solo candidates a single team can enter (usually 1 or 2).</span>
            </div>
          ) : (
            <div style={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.4)', 
              border: '1px solid var(--border-color)', 
              borderRadius: 'var(--radius-md)', 
              padding: 'var(--spacing-md)',
              marginBottom: 'var(--spacing-md)'
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                👥 Group / Squad Participation Setup
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Teams/Squads Per Group</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={teamsAllowed}
                    onChange={(e) => handleSquadConfigChange(parseInt(e.target.value) || 1, membersPerSquad)}
                    min="1"
                    placeholder="e.g. 2"
                    required
                  />
                  <span className="field-helper" style={{ fontSize: '0.7rem' }}>Entries from 1 team/house</span>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Members Per Squad</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={membersPerSquad}
                    onChange={(e) => handleSquadConfigChange(teamsAllowed, parseInt(e.target.value) || 1)}
                    min="1"
                    placeholder="e.g. 5"
                    required
                  />
                  <span className="field-helper" style={{ fontSize: '0.7rem' }}>Avg members per team</span>
                </div>
              </div>

              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border-color)' }}>
                <div className="form-group" style={{ marginBottom: '6px' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    Total Candidate Assignment Limit:
                  </label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={candidateLimitPerTeam} 
                    onChange={(e) => setCandidateLimitPerTeam(parseInt(e.target.value) || 1)} 
                    min="1"
                    required 
                  />
                </div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--text-secondary)', 
                  background: 'rgba(15, 92, 70, 0.08)', 
                  padding: '6px 10px', 
                  borderRadius: '6px',
                  border: '1px solid rgba(15, 92, 70, 0.2)'
                }}>
                  💡 <strong>Calculation:</strong> {teamsAllowed} Squad(s) × {membersPerSquad} Members = <strong>{candidateLimitPerTeam}</strong> Candidates per team.
                </div>
              </div>
            </div>
          )}

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
    </div>,
    document.body
  );
}
