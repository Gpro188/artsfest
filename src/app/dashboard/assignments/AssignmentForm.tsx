"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignProgram, unassignProgram } from "./actions";

export default function AssignmentForm({ candidates, programs, isAssignmentOpen = true, statusMessage = "" }: { candidates: any[], programs: any[], isAssignmentOpen?: boolean, statusMessage?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<'search' | 'manage'>('search');
  const [candidateQuery, setCandidateQuery] = useState("");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [programQuery, setProgramQuery] = useState("");
  const [programFilter, setProgramFilter] = useState<'ALL' | 'INDIVIDUAL' | 'GROUP'>('ALL');
  const [loadingId, setLoadingId] = useState<string | null>(null);

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

  // --- Step 1: SEARCH ---
  if (step === 'search') {
    const q = candidateQuery.toLowerCase().trim();
    const filteredCandidates = q === "" 
      ? candidates.slice(0, 10) 
      : candidates.filter(c => 
          c.name.toLowerCase().includes(q) || 
          (c.chestNumber && c.chestNumber.toLowerCase().includes(q)) ||
          (c.team?.name && c.team.name.toLowerCase().includes(q))
        ).slice(0, 50);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
        <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-md)', fontSize: '1.1rem' }}>Search Student</h3>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Type student name, chest number or team..." 
                value={candidateQuery}
                onChange={(e) => setCandidateQuery(e.target.value)}
                style={{ paddingLeft: '36px', margin: 0 }}
                autoFocus
              />
            </div>
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
            Search Results ({q === "" ? "Recent" : filteredCandidates.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {filteredCandidates.map(c => {
              const assignedCount = c.programs?.length || 0;
              const individualCount = c.programs?.filter((p: any) => p.program?.type === "INDIVIDUAL").length || 0;
              const maxIndividual = c.category?.pointMatrix?.maxIndividualPrograms || 3;
              
              return (
                <div key={c.id} className="glass-panel" style={{ 
                  padding: '16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  gap: '16px',
                  borderLeft: `4px solid ${individualCount >= maxIndividual ? 'var(--warning)' : 'var(--primary)'}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    <div style={{ 
                      width: '40px', height: '40px', 
                      borderRadius: '50%', 
                      background: 'rgba(15, 92, 70, 0.1)', 
                      color: 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 'bold', fontSize: '1.2rem'
                    }}>
                      👤
                    </div>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                        {c.name} {c.chestNumber && <span style={{ color: 'var(--primary)', fontSize: '0.8rem', marginLeft: '6px', padding: '2px 6px', background: 'rgba(15, 92, 70, 0.1)', borderRadius: '4px' }}>{c.chestNumber}</span>}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {c.team?.name || 'No Team'} • {c.category?.name}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'center', padding: '0 24px', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{individualCount} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ {maxIndividual}</span></div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginTop: '2px' }}>Individual</div>
                  </div>

                  <button 
                    className="btn btn-primary"
                    style={{ padding: '8px 24px' }}
                    onClick={() => {
                      setSelectedCandidateId(c.id);
                      setStep('manage');
                      setProgramQuery("");
                    }}
                  >
                    Select →
                  </button>
                </div>
              );
            })}
            
            {filteredCandidates.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                No students found matching your search.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Step 2: MANAGE ---
  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);
  if (!selectedCandidate) {
    setStep('search');
    return null;
  }

  const assignedProgramIds = selectedCandidate.programs.map((p: any) => p.programId);
  const categoryPointMatrix = selectedCandidate.category?.pointMatrix;
  const maxIndividualLimit = categoryPointMatrix?.maxIndividualPrograms || 3;
  const currentIndividualCount = selectedCandidate.programs.filter((p: any) => p.program.type === "INDIVIDUAL").length;

  const handleAssign = async (programId: string) => {
    setLoadingId(programId);
    await assignProgram(selectedCandidateId, programId);
    router.refresh();
    setLoadingId(null);
  };

  const handleUnassign = async (programId: string) => {
    setLoadingId(programId);
    await unassignProgram(selectedCandidateId, programId);
    router.refresh();
    setLoadingId(null);
  };

  const availableFiltered = programs
    .filter(p => !assignedProgramIds.includes(p.id))
    .filter(p => {
      // 1. Event Match (Matches candidate's team event, parent festival event, or program belongs to festival hierarchy)
      const teamEventId = selectedCandidate.team?.eventId;
      const teamParentEventId = selectedCandidate.team?.event?.parentId;
      
      let isEventMatch = true;
      if (teamEventId || teamParentEventId) {
        isEventMatch = (
          p.eventId === teamEventId ||
          (teamParentEventId && p.eventId === teamParentEventId) ||
          (teamEventId && p.event?.parentId === teamEventId) ||
          (teamParentEventId && p.event?.parentId === teamParentEventId)
        );
      }
      if (!isEventMatch) return false;

      // 2. Strict Category Match (Matches category ID, name, or General programs)
      const candCatName = selectedCandidate.category?.name?.trim().toLowerCase();
      const progCatName = p.category?.name?.trim().toLowerCase();

      const categoryMatch = (
        p.type === "GENERAL" || 
        p.categoryId === selectedCandidate.categoryId || 
        (candCatName && progCatName && candCatName === progCatName)
      );
      
      if (!categoryMatch) return false;

      // 3. Search Query Match
      if (programQuery && !p.name.toLowerCase().includes(programQuery.toLowerCase().trim())) return false;

      // 4. Filter Match (Individual / Group / All)
      if (programFilter !== 'ALL' && p.type !== programFilter) return false;

      return true;
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {/* Header Card */}
      <div className="glass-panel" style={{ 
        padding: '20px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '48px', height: '48px', 
            borderRadius: '50%', 
            background: 'rgba(15, 92, 70, 0.1)', 
            color: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: '1.5rem'
          }}>
            👤
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {selectedCandidate.name}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {selectedCandidate.team?.name || 'No Team'} • {selectedCandidate.category?.name} • Chest No: {selectedCandidate.chestNumber || 'Pending'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Individual Limit</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{maxIndividualLimit} Programs</div>
          </div>
          <div style={{ width: '1px', height: '32px', background: 'var(--border-color)' }}></div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Assigned Ind.</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{currentIndividualCount} Programs</div>
          </div>
          <div style={{ width: '1px', height: '32px', background: 'var(--border-color)' }}></div>
          <div style={{ textAlign: 'center', color: currentIndividualCount >= maxIndividualLimit ? 'var(--error)' : 'var(--success)' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.8 }}>Remaining Ind.</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{Math.max(0, maxIndividualLimit - currentIndividualCount)} / {maxIndividualLimit}</div>
          </div>
          
          <button 
            className="btn btn-outline" 
            onClick={() => setStep('search')}
            style={{ marginLeft: '16px' }}
          >
            Change Student
          </button>
        </div>
      </div>

      {/* Two Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 'var(--spacing-lg)' }}>
        
        {/* LEFT COLUMN: Available */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', height: '600px' }}>
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--primary)' }}>Available Programs</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Click + to assign matching programs.</p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.8rem' }}>🔍</span>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search programs..." 
                value={programQuery}
                onChange={(e) => setProgramQuery(e.target.value)}
                style={{ paddingLeft: '30px', margin: 0, height: '36px', fontSize: '0.85rem' }}
              />
            </div>
            
            <select 
              className="form-input" 
              style={{ width: 'auto', margin: 0, height: '36px', fontSize: '0.85rem' }}
              value={programFilter}
              onChange={(e: any) => setProgramFilter(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="GROUP">Group</option>
              <option value="GENERAL">General</option>
            </select>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
            {availableFiltered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No available programs match your filters.
              </div>
            ) : (
              availableFiltered.map(program => {
                const isLimitReached = program.type === "INDIVIDUAL" && currentIndividualCount >= maxIndividualLimit;
                const canAssign = !isLimitReached;
                const isLoading = loadingId === program.id;

                return (
                  <div key={program.id} style={{ 
                    padding: '12px 16px', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--surface-color)',
                    opacity: canAssign ? 1 : 0.6
                  }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{program.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {program.type} {program.category && `• ${program.category.name}`}
                      </div>
                      {!canAssign && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--error)', marginTop: '4px', fontWeight: 600 }}>
                          Limit reached ({currentIndividualCount}/{maxIndividualLimit})
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => handleAssign(program.id)}
                      disabled={!canAssign || loadingId !== null}
                      style={{ 
                        width: '36px', height: '36px', 
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        background: canAssign ? 'rgba(15, 92, 70, 0.05)' : 'transparent',
                        color: canAssign ? 'var(--primary)' : 'var(--text-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.2rem',
                        cursor: (!canAssign || loadingId !== null) ? 'not-allowed' : 'pointer',
                        transition: 'var(--transition-fast)'
                      }}
                    >
                      {isLoading ? <span style={{ fontSize: '0.9rem' }}>⏳</span> : '+'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Assigned */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', height: '600px', background: 'rgba(255,255,255,0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>Assigned Programs</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Programs currently enrolled. Click × to remove.</p>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px', background: 'var(--surface-color)', borderRadius: '9999px', border: '1px solid var(--border-color)' }}>
              {selectedCandidate.programs.length} Assigned
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
            {selectedCandidate.programs.length === 0 ? (
              <div style={{ 
                height: '100%', display: 'flex', flexDirection: 'column', 
                alignItems: 'center', justifyContent: 'center', 
                color: 'var(--text-muted)', textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', opacity: 0.2, marginBottom: '16px' }}>📋</div>
                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>No programs assigned yet</div>
                <div style={{ fontSize: '0.85rem' }}>Add programs from the left list.</div>
              </div>
            ) : (
              selectedCandidate.programs.map((p: any) => {
                const isLoading = loadingId === p.programId;
                return (
                  <div key={p.programId} style={{ 
                    padding: '12px 16px', 
                    border: '1px solid rgba(224, 82, 46, 0.2)', 
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--surface-color)'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{p.program.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {p.program.type}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleUnassign(p.programId)}
                      disabled={loadingId !== null}
                      style={{ 
                        width: '32px', height: '32px', 
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        background: 'rgba(224, 82, 46, 0.1)',
                        color: 'var(--error)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.2rem',
                        cursor: loadingId !== null ? 'not-allowed' : 'pointer',
                        transition: 'var(--transition-fast)'
                      }}
                    >
                      {isLoading ? <span style={{ fontSize: '0.9rem' }}>⏳</span> : '×'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
