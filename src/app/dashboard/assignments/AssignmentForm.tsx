"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignProgram, unassignProgram, batchAssignProgram } from "./actions";
import { User, Users, Search, Plus, Trash2, CheckCircle2, ShieldAlert, Sparkles, Layers } from "lucide-react";

export default function AssignmentForm({ 
  candidates, 
  programs, 
  teams = [],
  userRole = "ADMIN",
  userTeamId = null,
  isAssignmentOpen = true, 
  statusMessage = "" 
}: { 
  candidates: any[]; 
  programs: any[]; 
  teams?: any[];
  userRole?: string;
  userTeamId?: string | null;
  isAssignmentOpen?: boolean; 
  statusMessage?: string;
}) {
  const router = useRouter();
  
  // Primary Workflow Mode: 'by-candidate' (Student-centric) vs 'by-program' (Program/Group Squad-centric)
  const [workflowMode, setWorkflowMode] = useState<'by-candidate' | 'by-program'>('by-candidate');

  // Candidate-Centric State
  const [step, setStep] = useState<'search' | 'manage'>('search');
  const [candidateQuery, setCandidateQuery] = useState("");
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [programQuery, setProgramQuery] = useState("");
  const [programFilter, setProgramFilter] = useState<'ALL' | 'INDIVIDUAL' | 'GROUP'>('ALL');

  // Program/Group-Centric State
  const [selectedProgId, setSelectedProgId] = useState<string>(programs[0]?.id || "");
  const [selectedTeamId, setSelectedTeamId] = useState<string>(userTeamId || teams[0]?.id || "");
  const [selectedSquadSlot, setSelectedSquadSlot] = useState<number>(1); // 1 = Squad A, 2 = Squad B, 3 = Squad C
  const [teamCandidateQuery, setTeamCandidateQuery] = useState("");
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [progTypeFilter, setProgTypeFilter] = useState<'ALL' | 'GROUP' | 'GENERAL' | 'INDIVIDUAL'>('ALL');

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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

  // Helper for single candidate assignment
  const handleAssign = async (candId: string, progId: string, slot?: number) => {
    setLoadingId(progId + candId);
    setActionMessage(null);
    const res = await assignProgram(candId, progId, slot || 1);
    if (res && !res.success && res.error) {
      setActionMessage({ type: 'error', text: res.error });
    } else {
      setActionMessage({ type: 'success', text: "Candidate assigned successfully!" });
      router.refresh();
    }
    setLoadingId(null);
  };

  const handleUnassign = async (candId: string, progId: string) => {
    setLoadingId(progId + candId);
    setActionMessage(null);
    const res = await unassignProgram(candId, progId);
    if (res && !res.success && res.error) {
      setActionMessage({ type: 'error', text: res.error });
    } else {
      setActionMessage({ type: 'success', text: "Candidate unassigned successfully!" });
      router.refresh();
    }
    setLoadingId(null);
  };

  const handleBatchAssign = async () => {
    if (selectedCandidateIds.length === 0 || !selectedProgId) return;
    setLoadingId("batch");
    setActionMessage(null);
    const res = await batchAssignProgram(selectedCandidateIds, selectedProgId, selectedSquadSlot);
    if (res && !res.success && res.error) {
      setActionMessage({ type: 'error', text: res.error });
    } else {
      setActionMessage({ type: 'success', text: `Assigned ${res.count || selectedCandidateIds.length} candidate(s) to Squad ${String.fromCharCode(64 + selectedSquadSlot)}!` });
      setSelectedCandidateIds([]);
      router.refresh();
    }
    setLoadingId(null);
  };

  // ==========================================
  // WORKFLOW 1: BY CANDIDATE (Student-Centric)
  // ==========================================
  const renderByCandidateView = () => {
    if (step === 'search') {
      const q = candidateQuery.toLowerCase().trim();
      const filteredCandidates = q === "" 
        ? candidates.slice(0, 15) 
        : candidates.filter(c => 
            c.name.toLowerCase().includes(q) || 
            (c.chestNumber && c.chestNumber.toLowerCase().includes(q)) ||
            (c.team?.name && c.team.name.toLowerCase().includes(q))
          ).slice(0, 60);

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 'var(--spacing-md)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={18} color="var(--primary)" />
              Search Student
            </h3>
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
              Search Results ({q === "" ? "Recent Candidates" : filteredCandidates.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {filteredCandidates.map(c => {
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
                        width: '42px', height: '42px', 
                        borderRadius: '50%', 
                        background: 'rgba(99, 102, 241, 0.1)', 
                        color: 'var(--primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 'bold', fontSize: '1.2rem'
                      }}>
                        👤
                      </div>
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                          {c.name} {c.chestNumber && <span style={{ color: 'var(--primary)', fontSize: '0.8rem', marginLeft: '6px', padding: '2px 6px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '4px' }}>{c.chestNumber}</span>}
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
                      Select & Assign →
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

    // MANAGE STEP
    const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);
    if (!selectedCandidate) {
      setStep('search');
      return null;
    }

    const assignedProgramIds = selectedCandidate.programs.map((p: any) => p.programId);
    const categoryPointMatrix = selectedCandidate.category?.pointMatrix;
    const maxIndividualLimit = categoryPointMatrix?.maxIndividualPrograms || 3;
    const currentIndividualCount = selectedCandidate.programs.filter((p: any) => p.program.type === "INDIVIDUAL").length;

    const availableFiltered = programs
      .filter(p => !assignedProgramIds.includes(p.id))
      .filter(p => {
        const teamEventId = selectedCandidate.team?.eventId;
        const teamParentEventId = selectedCandidate.team?.event?.parentId;
        let isEventMatch = true;
        if (teamEventId || teamParentEventId) {
          isEventMatch = (p.eventId === teamEventId || (teamParentEventId && p.eventId === teamParentEventId));
        }
        if (!isEventMatch) return false;

        const candCatName = selectedCandidate.category?.name?.trim().toLowerCase();
        const progCatName = p.category?.name?.trim().toLowerCase();
        const categoryMatch = (
          p.type === "GENERAL" || 
          p.categoryId === selectedCandidate.categoryId || 
          (candCatName && progCatName && candCatName === progCatName)
        );
        if (!categoryMatch) return false;

        if (programQuery && !p.name.toLowerCase().includes(programQuery.toLowerCase().trim())) return false;
        if (programFilter !== 'ALL' && p.type !== programFilter) return false;

        return true;
      });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
        {/* Header Card */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.5rem' }}>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Individual Limit</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{maxIndividualLimit} Programs</div>
            </div>
            <div style={{ width: '1px', height: '32px', background: 'var(--border-color)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Assigned Ind.</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{currentIndividualCount} Programs</div>
            </div>
            <button className="btn btn-outline" onClick={() => setStep('search')} style={{ marginLeft: '12px' }}>
              Change Student
            </button>
          </div>
        </div>

        {/* Two Columns Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 'var(--spacing-lg)' }}>
          {/* LEFT: Available */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', height: '600px' }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--primary)' }}>Available Programs</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Click + to enroll student into eligible programs.</p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Search available programs..." 
                  value={programQuery}
                  onChange={(e) => setProgramQuery(e.target.value)}
                  style={{ margin: 0, height: '36px', fontSize: '0.85rem' }}
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

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {availableFiltered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                  No programs match the criteria.
                </div>
              ) : (
                availableFiltered.map(program => {
                  const teamLimit = program.candidateLimitPerTeam || 1;
                  const teamAssignedCount = program.assignments 
                    ? program.assignments.filter((a: any) => a.candidate?.teamId === selectedCandidate.teamId).length 
                    : 0;
                  const isTeamLimitReached = teamAssignedCount >= teamLimit;
                  const isIndLimitReached = program.type === "INDIVIDUAL" && currentIndividualCount >= maxIndividualLimit;
                  const canAssign = !isIndLimitReached && !isTeamLimitReached;

                  return (
                    <div key={program.id} style={{ 
                      padding: '12px', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--surface-color)',
                      opacity: canAssign ? 1 : 0.6
                    }}>
                      <div style={{ flex: 1, marginRight: '10px' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{program.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {program.type} {program.category && `• ${program.category.name}`} • Slots: {teamAssignedCount}/{teamLimit}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleAssign(selectedCandidateId, program.id)}
                        disabled={!canAssign || loadingId !== null}
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        + Assign
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Assigned Programs */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', height: '600px' }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--success)' }}>Assigned Programs ({selectedCandidate.programs.length})</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Currently enrolled programs for this student.</p>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedCandidate.programs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
                  No programs assigned yet.
                </div>
              ) : (
                selectedCandidate.programs.map((pa: any) => (
                  <div key={pa.id} style={{ 
                    padding: '12px', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--surface-color)'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{pa.program.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {pa.program.type}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleUnassign(selectedCandidateId, pa.programId)}
                      disabled={loadingId !== null}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--error)' }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================
  // WORKFLOW 2: BY PROGRAM / GROUP SESSION (Squad Manager)
  // =========================================================
  const renderByProgramView = () => {
    // Filter programs
    const filteredPrograms = programs.filter(p => {
      if (progTypeFilter !== 'ALL' && p.type !== progTypeFilter) return false;
      return true;
    });

    const activeProgram = programs.find(p => p.id === selectedProgId) || programs[0];
    const activeTeam = teams.find(t => t.id === selectedTeamId) || teams[0];

    // Determine squads count
    const candidateLimit = activeProgram?.candidateLimitPerTeam || 1;
    // Squads calculation: check teamsAllowed field or fall back to limit calculation
    const squadCount = (activeProgram?.type !== "INDIVIDUAL" && (activeProgram?.teamsAllowed || 1) > 1)
      ? (activeProgram.teamsAllowed || 1)
      : (activeProgram?.type !== "INDIVIDUAL" && candidateLimit >= 10 && candidateLimit % 5 === 0 ? Math.floor(candidateLimit / 5) : (activeProgram?.teamsAllowed || 1));

    // Filter candidates belonging to active team and matching category
    const teamCandidates = candidates.filter(c => {
      if (c.teamId !== selectedTeamId && c.team?.id !== selectedTeamId) return false;
      if (activeProgram?.type !== "GENERAL" && activeProgram?.categoryId && c.categoryId !== activeProgram.categoryId) {
        // match by name fallback
        if (c.category?.name?.trim().toLowerCase() !== activeProgram.category?.name?.trim().toLowerCase()) {
          return false;
        }
      }
      if (teamCandidateQuery.trim()) {
        const q = teamCandidateQuery.toLowerCase().trim();
        const matchName = c.name.toLowerCase().includes(q);
        const matchChest = c.chestNumber?.toLowerCase().includes(q);
        if (!matchName && !matchChest) return false;
      }
      return true;
    });

    // Enrolled candidates in active program for active team
    const enrolledAssignments = (activeProgram?.assignments || []).filter((a: any) => {
      const tId = a.candidate?.teamId || a.candidate?.team?.id;
      return tId === selectedTeamId;
    });

    const enrolledCandidateIds = enrolledAssignments.map((a: any) => a.candidate?.id || a.candidateId);
    
    // Squad filtered assignments
    const squadAssignments = enrolledAssignments.filter((a: any) => {
      if (squadCount <= 1) return true;
      return (a.slotNumber || 1) === selectedSquadSlot;
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
        {/* Selector Header Bar */}
        <div className="glass-panel" style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
          {/* Program Type Filter */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Program Filter</label>
            <select 
              className="form-input" 
              value={progTypeFilter} 
              onChange={(e: any) => setProgTypeFilter(e.target.value)}
              style={{ margin: 0 }}
            >
              <option value="ALL">All Program Types</option>
              <option value="GROUP">👥 Group Programs</option>
              <option value="GENERAL">🌐 General Programs</option>
              <option value="INDIVIDUAL">👤 Individual Programs</option>
            </select>
          </div>

          {/* Select Program */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>1. Choose Program</label>
            <select 
              className="form-input" 
              value={selectedProgId} 
              onChange={(e) => setSelectedProgId(e.target.value)}
              style={{ margin: 0, fontWeight: 700 }}
            >
              {filteredPrograms.map(p => (
                <option key={p.id} value={p.id}>
                  {p.programCode ? `[${p.programCode}] ` : ''}{p.name} ({p.type} • {p.category?.name || 'General'})
                </option>
              ))}
            </select>
          </div>

          {/* Select Team */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>2. Select Team / House</label>
            <select 
              className="form-input" 
              value={selectedTeamId} 
              onChange={(e) => setSelectedTeamId(e.target.value)}
              disabled={userRole === "MANAGER"}
              style={{ margin: 0, fontWeight: 700 }}
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Program & Squad Banner */}
        {activeProgram && (
          <div className="glass-panel" style={{ 
            padding: '16px 20px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '16px',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderLeft: '4px solid var(--primary)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {activeProgram.name}
                </span>
                <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
                  {activeProgram.type}
                </span>
                {activeProgram.category && (
                  <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
                    {activeProgram.category.name}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Team: <strong>{activeTeam?.name || 'Selected Team'}</strong> • Max Allowed Slots: <strong>{candidateLimit} candidates</strong>
              </div>
            </div>

            {/* Squads Tabs */}
            {squadCount > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.06)', padding: '4px', borderRadius: '10px' }}>
                {Array.from({ length: squadCount }).map((_, idx) => {
                  const sSlot = idx + 1;
                  const sLetter = String.fromCharCode(65 + idx); // A, B, C...
                  const sMembers = enrolledAssignments.filter((a: any) => (a.slotNumber || 1) === sSlot);
                  const isAct = selectedSquadSlot === sSlot;

                  return (
                    <button
                      key={sSlot}
                      onClick={() => setSelectedSquadSlot(sSlot)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: isAct ? 'var(--primary)' : 'transparent',
                        color: isAct ? '#ffffff' : 'var(--text-secondary)'
                      }}
                    >
                      <span>Squad {sLetter}</span>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        padding: '1px 5px', 
                        borderRadius: '10px', 
                        backgroundColor: isAct ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)' 
                      }}>
                        {sMembers.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ 
              padding: '6px 14px', 
              borderRadius: '8px', 
              fontSize: '0.85rem', 
              fontWeight: 700,
              backgroundColor: enrolledAssignments.length >= candidateLimit ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              color: enrolledAssignments.length >= candidateLimit ? 'var(--error)' : 'var(--success)',
              border: `1px solid ${enrolledAssignments.length >= candidateLimit ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
            }}>
              Total Team Slots: {enrolledAssignments.length} / {candidateLimit} filled
            </div>
          </div>
        )}

        {/* Two-Column Management Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: 'var(--spacing-lg)' }}>
          {/* LEFT: Eligible Candidates in Team */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', height: '620px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 2px 0', fontSize: '1rem', color: 'var(--primary)' }}>
                  👥 Eligible Students ({activeTeam?.name})
                </h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Select students to assign to {squadCount > 1 ? `Squad ${String.fromCharCode(64 + selectedSquadSlot)}` : 'this program'}.
                </p>
              </div>

              {selectedCandidateIds.length > 0 && (
                <button 
                  onClick={handleBatchAssign}
                  disabled={loadingId !== null || enrolledAssignments.length >= candidateLimit}
                  className="btn btn-primary"
                  style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                >
                  + Add Selected ({selectedCandidateIds.length})
                </button>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search candidates in this team..." 
                value={teamCandidateQuery}
                onChange={(e) => setTeamCandidateQuery(e.target.value)}
                style={{ margin: 0, height: '36px', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {teamCandidates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No candidates found in this team for this category.
                </div>
              ) : (
                teamCandidates.map(c => {
                  const isAlreadyEnrolled = enrolledCandidateIds.includes(c.id);
                  const isChecked = selectedCandidateIds.includes(c.id);
                  const indCount = c.programs?.filter((p: any) => p.program?.type === "INDIVIDUAL").length || 0;
                  const maxInd = c.category?.pointMatrix?.maxIndividualPrograms || 3;
                  const isIndFull = activeProgram?.type === "INDIVIDUAL" && indCount >= maxInd;
                  const canAssign = !isAlreadyEnrolled && !isIndFull && (enrolledAssignments.length < candidateLimit);

                  return (
                    <div key={c.id} style={{ 
                      padding: '10px 14px', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isAlreadyEnrolled ? 'rgba(16, 185, 129, 0.04)' : 'var(--surface-color)',
                      opacity: canAssign ? 1 : 0.6
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          disabled={!canAssign}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCandidateIds(prev => [...prev, c.id]);
                            } else {
                              setSelectedCandidateIds(prev => prev.filter(id => id !== c.id));
                            }
                          }}
                          style={{ width: '16px', height: '16px', cursor: canAssign ? 'pointer' : 'default' }}
                        />
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {c.name} {c.chestNumber && <span style={{ color: 'var(--primary)', fontSize: '0.75rem', marginLeft: '4px' }}>({c.chestNumber})</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {c.category?.name} • Ind: {indCount}/{maxInd}
                          </div>
                        </div>
                      </div>

                      {isAlreadyEnrolled ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          ✓ In Program
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleAssign(c.id, selectedProgId, selectedSquadSlot)}
                          disabled={!canAssign || loadingId !== null}
                          className="btn btn-primary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: Enrolled Squad Members */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', height: '620px' }}>
            <div>
              <h4 style={{ margin: '0 0 2px 0', fontSize: '1rem', color: 'var(--success)' }}>
                ✅ {squadCount > 1 ? `Squad ${String.fromCharCode(64 + selectedSquadSlot)} Members` : 'Enrolled Members'} ({squadAssignments.length})
              </h4>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Candidates currently assigned from {activeTeam?.name}.
              </p>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {squadAssignments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                  No candidates assigned to this squad yet.
                </div>
              ) : (
                squadAssignments.map((a: any) => {
                  const cand = a.candidate;
                  return (
                    <div key={a.id || cand?.id} style={{ 
                      padding: '10px 14px', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'var(--surface-color)'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                          {cand?.name} {cand?.chestNumber && <span style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>({cand.chestNumber})</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {cand?.team?.name} • {squadCount > 1 ? `Squad ${String.fromCharCode(64 + (a.slotNumber || 1))}` : 'Team Entry'}
                        </div>
                      </div>

                      <button 
                        onClick={() => handleUnassign(cand?.id || a.candidateId, selectedProgId)}
                        disabled={loadingId !== null}
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--error)' }}
                      >
                        ✕ Remove
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
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {/* Workflow Mode Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--primary)" />
            {workflowMode === 'by-candidate' ? "Assign by Candidate" : "Assign by Program & Group Squad"}
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {workflowMode === 'by-candidate' 
              ? "Select a student to enroll them into solo and group programs."
              : "Select a program and team to manage squad members and group entries with one click."}
          </p>
        </div>

        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.06)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => setWorkflowMode('by-candidate')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: workflowMode === 'by-candidate' ? 'var(--primary)' : 'transparent',
              color: workflowMode === 'by-candidate' ? '#ffffff' : 'var(--text-secondary)'
            }}
          >
            <User size={15} />
            By Candidate (Student-centric)
          </button>
          <button
            type="button"
            onClick={() => setWorkflowMode('by-program')}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: workflowMode === 'by-program' ? 'var(--primary)' : 'transparent',
              color: workflowMode === 'by-program' ? '#ffffff' : 'var(--text-secondary)'
            }}
          >
            <Layers size={15} />
            By Program / Group Squad (Fast)
          </button>
        </div>
      </div>

      {actionMessage && (
        <div style={{ 
          color: actionMessage.type === 'error' ? '#dc2626' : '#059669', 
          backgroundColor: actionMessage.type === 'error' ? '#fef2f2' : '#f0fdf4',
          padding: '12px 16px', 
          borderRadius: '10px',
          border: `1px solid ${actionMessage.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          fontSize: '0.95rem',
          fontWeight: 600
        }}>
          {actionMessage.type === 'error' ? '❌ ' : '✅ '} {actionMessage.text}
        </div>
      )}

      {workflowMode === 'by-candidate' ? renderByCandidateView() : renderByProgramView()}
    </div>
  );
}
