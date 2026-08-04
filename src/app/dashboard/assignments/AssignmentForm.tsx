"use client";

import { useState } from "react";
import { assignProgram, unassignProgram } from "./actions";

export default function AssignmentForm({ candidates, programs, isAssignmentOpen = true, statusMessage = "" }: { candidates: any[], programs: any[], isAssignmentOpen?: boolean, statusMessage?: string }) {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(candidates[0]?.id || "");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'success', message: string } | null>(null);

  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);
  
  if (!selectedCandidate) return null;

  if (!isAssignmentOpen) {
    return (
      <div style={{ 
        padding: 'var(--spacing-lg)', 
        backgroundColor: 'rgba(239, 68, 68, 0.05)', 
        border: '1px dashed var(--error)', 
        borderRadius: 'var(--radius-md)',
        textAlign: 'center',
        color: 'var(--error)',
        marginBottom: 'var(--spacing-xl)'
      }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🕒</div>
        <strong>Assignment Closed / Not Started</strong>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem' }}>{statusMessage || "The deadline for assigning programs has passed. Please contact the administrator for any urgent changes."}</p>
      </div>
    );
  }

  const assignedProgramIds = selectedCandidate.programs.map((p: any) => p.programId);
  // Get point matrix from the candidate's category
  const categoryPointMatrix = selectedCandidate.category?.pointMatrix;
  const maxIndividualLimit = categoryPointMatrix?.maxIndividualPrograms || 3;
  
  const currentIndividualCount = selectedCandidate.programs.filter(
    (p: any) => p.program.type === "INDIVIDUAL"
  ).length;

  const handleAssign = async (programId: string) => {
    setLoading(true);
    setStatus(null);
    const result = await assignProgram(selectedCandidateId, programId);
    if (result.success) {
      window.location.reload();
    } else {
      setStatus({ type: 'error', message: result.error || 'Failed to assign' });
      setLoading(false);
    }
  };

  const handleUnassign = async (programId: string) => {
    setLoading(true);
    setStatus(null);
    const result = await unassignProgram(selectedCandidateId, programId);
    if (result.success) {
      window.location.reload();
    } else {
      setStatus({ type: 'error', message: result.error || 'Failed to unassign' });
      setLoading(false);
    }
  };

  return (
    <div>
      {status && (
        <div style={{ color: 'var(--error)', marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-xs)', border: '1px solid var(--error)', borderRadius: 'var(--radius-md)' }}>
          {status.message}
        </div>
      )}

      <div className="form-group" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <label className="form-label">Select Candidate</label>
        <select 
          className="form-input" 
          value={selectedCandidateId}
          onChange={(e) => {
            setSelectedCandidateId(e.target.value);
            setStatus(null);
          }}
        >
          {candidates.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.category?.name}) - Chest No: {c.chestNumber}
            </option>
          ))}
        </select>
        <span className="field-helper">Choose a candidate to view and manage their program assignments. Only approved candidates appear in this list.</span>
        <div style={{ marginTop: 'var(--spacing-sm)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Category: <strong>{selectedCandidate.category?.name}</strong> • Individual Limit: <strong style={{ color: currentIndividualCount >= maxIndividualLimit ? 'var(--error)' : 'var(--success)' }}>{currentIndividualCount} / {maxIndividualLimit}</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
        <div>
          <h4 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--primary)' }}>Available Programs</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 var(--spacing-sm) 0' }}>Programs that match the candidate's category. Click "Assign" to register them.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
            {programs.filter(p => !assignedProgramIds.includes(p.id)).map(program => {
              // Validations: match by categoryId or matching category name across sub-events
              const isCategoryMatch = program.type === "GENERAL" || 
                program.categoryId === selectedCandidate.categoryId || 
                (program.category?.name && selectedCandidate.category?.name && 
                 program.category.name.trim().toLowerCase() === selectedCandidate.category.name.trim().toLowerCase());
              
              const isLimitReached = program.type === "INDIVIDUAL" && currentIndividualCount >= maxIndividualLimit;
              const canAssign = isCategoryMatch && !isLimitReached;

              return (
                <div key={program.id} style={{ 
                  padding: 'var(--spacing-sm)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  opacity: canAssign ? 1 : 0.5
                }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{program.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {program.type} {program.category && `• ${program.category.name}`}
                    </div>
                    {!canAssign && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--warning)', marginTop: '2px' }}>
                        {!isCategoryMatch ? "Category mismatch" : "Limit reached"}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => handleAssign(program.id)}
                    className="btn btn-primary" 
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                    disabled={!canAssign || loading}
                  >
                    Assign
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h4 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--success)' }}>Assigned Programs</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 var(--spacing-sm) 0' }}>Programs this candidate is registered for. Click "Remove" to unassign.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {selectedCandidate.programs.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No programs assigned yet.</div>
            ) : (
              selectedCandidate.programs.map((p: any) => (
                <div key={p.programId} style={{ 
                  padding: 'var(--spacing-sm)', 
                  border: '1px solid var(--success)', 
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{p.program.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.program.type}</div>
                  </div>
                  <button 
                    onClick={() => handleUnassign(p.programId)}
                    className="btn btn-secondary" 
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: 'var(--error)' }}
                    disabled={loading}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
