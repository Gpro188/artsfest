"use client";

import React, { useState, useEffect } from "react";
import { submitMarks, submitBulkProgramResults } from "./actions";
import { Sparkles, Trophy, Award, CheckCircle2 } from "lucide-react";

export type BulkEntryRow = {
  rank: string;
  grade: string;
  marks: string;
  status?: string;
};

export default function ScoringForm({ events }: { events: any[] }) {
  const [eventId, setEventId] = useState(events[0]?.id || "");
  const [programType, setProgramType] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [programId, setProgramId] = useState("");
  const [entryMode, setEntryMode] = useState<"bulk" | "single">("bulk");

  // Single Entry State
  const [participantId, setParticipantId] = useState(""); 
  const [marks, setMarks] = useState("");
  const [rank, setRank] = useState<string>(""); 
  const [grade, setGrade] = useState<string>(""); 
  const [singleStatus, setSingleStatus] = useState<string>("COMPLETED");

  // Bulk Entry State: Record of participantId -> BulkEntryRow
  const [bulkEntries, setBulkEntries] = useState<Record<string, BulkEntryRow>>({});

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'success', message: string } | null>(null);

  // Sync state with props only if eventId is empty or not in events
  useEffect(() => {
    if (events.length > 0 && (!eventId || !events.some(e => e.id === eventId))) {
      setEventId(events[0].id);
      setProgramType("");
      setCategoryId("");
      setProgramId("");
      setParticipantId("");
      setBulkEntries({});
    }
  }, [events, eventId]);

  const selectedEvent = events.find(e => e.id === eventId);
  const allPrograms = selectedEvent?.programs || [];
  
  // Filter programs based on Type first
  const typeFilteredPrograms = allPrograms.filter((p: any) => {
    if (programType) return p.type === programType;
    return true;
  });

  // Extract unique categories from type-filtered programs, deduplicating by normalized name
  const seenCatNames = new Map<string, string>();
  const categories: { id: string, name: string }[] = [];

  typeFilteredPrograms.forEach((p: any) => {
    if (p.category && p.category.name) {
      const norm = p.category.name.trim().toUpperCase();
      if (!seenCatNames.has(norm)) {
        seenCatNames.set(norm, p.category.id);
        categories.push({ id: p.category.id, name: p.category.name.trim() });
      }
    } else {
      if (!seenCatNames.has("GENERAL-CAT")) {
        seenCatNames.set("GENERAL-CAT", "general-cat");
        categories.push({ id: "general-cat", name: "General / No Category" });
      }
    }
  });

  const selectedCategoryObj = categories.find(c => c.id === categoryId);

  // Final filtered programs for step 4
  const programs = typeFilteredPrograms.filter((p: any) => {
    if (categoryId === "general-cat") return !p.category;
    if (categoryId) {
      if (p.category?.id === categoryId) return true;
      if (p.category?.name && selectedCategoryObj?.name && p.category.name.trim().toUpperCase() === selectedCategoryObj.name.trim().toUpperCase()) {
        return true;
      }
      return false;
    }
    return true;
  });

  const selectedProgram = programs.find((p: any) => p.id === programId);
  const isIndividual = selectedProgram?.type === "INDIVIDUAL";

  // Compute participants list with Squad support
  const participants = isIndividual 
    ? (selectedProgram?.assignments?.map((a: any) => ({
        id: a.candidate.id,
        candidateId: a.candidate.id,
        teamId: a.candidate.teamId,
        chestNumber: a.candidate.chestNumber,
        name: a.candidate.name,
        teamName: a.candidate.team?.name,
        flagColor: a.candidate.team?.flagColor
      })) || [])
    : (() => {
        // Group assignments by (teamId, slotNumber)
        const teamSlotMap = new Map<string, { team: any, slotNumber: number, candidates: any[] }>();
        
        (selectedProgram?.assignments || []).forEach((a: any) => {
          const tId = a.candidate?.teamId || a.candidate?.team?.id;
          if (!tId) return;
          const slot = a.slotNumber || 1;
          const key = `${tId}_${slot}`;
          
          if (!teamSlotMap.has(key)) {
            teamSlotMap.set(key, {
              team: a.candidate?.team,
              slotNumber: slot,
              candidates: []
            });
          }
          if (a.candidate) {
            teamSlotMap.get(key)!.candidates.push(a.candidate);
          }
        });

        // Convert Map into flat participant entries
        const resultEntries: any[] = [];
        teamSlotMap.forEach((data, key) => {
          const candidateNames = data.candidates.map(c => c.name).join(", ");
          const chestNumbers = data.candidates.map(c => c.chestNumber).filter(Boolean).join(", ");
          
          resultEntries.push({
            id: key,
            teamId: data.team?.id,
            slotNumber: data.slotNumber,
            name: data.team?.name,
            teamName: data.team?.name,
            flagColor: data.team?.flagColor,
            squadLabel: data.slotNumber > 1 ? `Squad ${data.slotNumber}` : `Team Entry`,
            memberCount: data.candidates.length,
            squadMembers: candidateNames,
            chestNumber: chestNumbers ? `#${chestNumbers}` : (data.slotNumber > 1 ? `Squad #${data.slotNumber}` : `Team`)
          });
        });

        return resultEntries;
      })();

  // Quick points calculator helper for display
  const getPointsForRankGrade = (r: string, g: string): number => {
    let pts = 0;
    if (r === "1") pts += 5;
    else if (r === "2") pts += 3;
    else if (r === "3") pts += 1;

    if (g === "A") pts += 5;
    else if (g === "B") pts += 3;
    else if (g === "C") pts += 1;

    return pts;
  };

  const handleBulkChange = (participantId: string, field: 'rank' | 'grade' | 'marks' | 'status', value: string) => {
    setBulkEntries(prev => {
      const current = prev[participantId] || { rank: "", grade: "", marks: "", status: "COMPLETED" };
      const updated = { ...current, [field]: value };

      if (field === "status" && value === "ABSENT") {
        updated.rank = "";
        updated.grade = "";
        updated.marks = "0";
      } else if (field === 'rank' || field === 'grade') {
        const calculatedPoints = getPointsForRankGrade(updated.rank, updated.grade);
        if (calculatedPoints > 0) {
          updated.marks = calculatedPoints.toString();
        }
      }
      return { ...prev, [participantId]: updated };
    });
  };

  const updateSingleMarks = (newRank: string, newGrade: string) => {
    setRank(newRank);
    setGrade(newGrade);
    const calculatedPoints = getPointsForRankGrade(newRank, newGrade);
    if (calculatedPoints > 0) {
      setMarks(calculatedPoints.toString());
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    if (!programId) {
      setStatus({ type: 'error', message: 'Please select a program' });
      setLoading(false);
      return;
    }

    if (!participantId) {
      setStatus({ type: 'error', message: `Please select a participant / squad` });
      setLoading(false);
      return;
    }

    const selectedParticipant = participants.find((p: any) => p.id === participantId);
    const isAbsent = singleStatus === "ABSENT";
    
    const result = await submitMarks({
      eventId,
      programId,
      candidateId: isIndividual ? participantId : undefined,
      teamId: !isIndividual ? selectedParticipant?.teamId : undefined,
      marks: isAbsent ? 0 : (parseFloat(marks) || 0),
      manualRank: isAbsent ? null : (rank ? parseInt(rank) : null),
      manualGrade: isAbsent ? null : (grade || null),
      status: singleStatus
    });
    
    if (result.success) {
      setStatus({ type: 'success', message: 'Result recorded successfully!' });
      setParticipantId("");
      setMarks("");
      setRank("");
      setGrade("");
      setSingleStatus("COMPLETED");
    } else {
      setStatus({ type: 'error', message: result.error || "Failed to submit result" });
    }
    setLoading(false);
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    if (!programId) {
      setStatus({ type: 'error', message: 'Please select a program first' });
      setLoading(false);
      return;
    }

    const entriesToSave = Object.entries(bulkEntries)
      .filter(([_, data]) => 
        data.rank || 
        data.grade || 
        (parseFloat(data.marks) > 0) || 
        data.status === "ABSENT"
      )
      .map(([id, data]) => {
        const p = participants.find((part: any) => part.id === id);
        const isAbsent = data.status === "ABSENT";
        return {
          candidateId: isIndividual ? id : undefined,
          teamId: !isIndividual ? p?.teamId : undefined,
          rank: isAbsent ? null : (data.rank ? parseInt(data.rank) : null),
          grade: isAbsent ? null : (data.grade || null),
          marks: isAbsent ? 0 : (parseFloat(data.marks) || 0),
          status: data.status || "COMPLETED"
        };
      });

    if (entriesToSave.length === 0) {
      setStatus({ type: 'error', message: 'No places or grades entered yet.' });
      setLoading(false);
      return;
    }

    const res = await submitBulkProgramResults({
      eventId,
      programId,
      entries: entriesToSave
    });

    if (res.success) {
      setStatus({ type: 'success', message: `Successfully recorded results for ${entriesToSave.length} participant(s)!` });
    } else {
      setStatus({ type: 'error', message: res.error || "Failed to submit bulk results" });
    }
    setLoading(false);
  };

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
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {status.type === 'error' ? '❌' : '✅'} {status.message}
        </div>
      )}

      {/* Mode Switcher Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--primary)" />
            {entryMode === "bulk" ? "Program All-Results Sheet" : "Rapid Result Entry"}
          </h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {entryMode === "bulk" 
              ? "Select a program to display all enrolled students together and enter 1st, 2nd, 3rd & grades on one single screen."
              : "Select a single candidate and record marks individually."}
          </p>
        </div>

        <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.06)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <button
            type="button"
            onClick={() => setEntryMode("bulk")}
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
              backgroundColor: entryMode === "bulk" ? 'var(--primary)' : 'transparent',
              color: entryMode === "bulk" ? '#fff' : 'var(--text-secondary)'
            }}
          >
            📋 Bulk Table Entry
          </button>
          <button
            type="button"
            onClick={() => setEntryMode("single")}
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
              backgroundColor: entryMode === "single" ? 'var(--primary)' : 'transparent',
              color: entryMode === "single" ? '#fff' : 'var(--text-secondary)'
            }}
          >
            ⚡ Single Entry
          </button>
        </div>
      </div>

      {/* 4-Step Filter Cascader */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: entryMode === "bulk" ? '1fr 1.2fr 1.5fr' : '1fr 1.2fr 1.4fr 1.6fr',
        gap: 'var(--spacing-md)',
        backgroundColor: 'rgba(255,255,255,0.02)',
        padding: '14px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)'
      }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>1. Type</label>
          <select 
            className="form-input" 
            value={programType} 
            onChange={(e) => {
              setProgramType(e.target.value);
              setCategoryId("");
              setProgramId("");
              setParticipantId("");
              setBulkEntries({});
            }}
            style={{ padding: '8px', fontSize: '0.85rem', fontWeight: 700 }}
          >
            <option value="">-- All Types --</option>
            <option value="INDIVIDUAL">Individual</option>
            <option value="GROUP">Group</option>
            <option value="GENERAL">General</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>2. Category</label>
          <select 
            className="form-input" 
            value={categoryId} 
            onChange={(e) => {
              setCategoryId(e.target.value);
              setProgramId("");
              setParticipantId("");
              setBulkEntries({});
            }}
            style={{ padding: '8px', fontSize: '0.85rem', fontWeight: 700 }}
          >
            <option value="">-- All Categories --</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>3. Program</label>
          <select 
            className="form-input" 
            value={programId}
            onChange={(e) => {
              setProgramId(e.target.value);
              setParticipantId("");
              setBulkEntries({});
            }}
            required
            disabled={!categoryId}
            style={{ padding: '8px', fontSize: '0.85rem', fontWeight: 700 }}
          >
            <option value="">-- Choose Program --</option>
            {programs.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {entryMode === "single" && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase' }}>
              {isIndividual ? "4. Participant" : "4. Institution / Squad"}
            </label>
            <select 
              className="form-input" 
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              required
              disabled={!programId}
              style={{ padding: '8px', fontSize: '0.85rem', fontWeight: 700 }}
            >
              <option value="">{isIndividual ? "-- Select Candidate --" : "-- Select Team / Squad --"}</option>
              {participants.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {isIndividual 
                    ? `${p.chestNumber ? `[#${p.chestNumber}] ` : ''}${p.name} (${p.teamName || 'Independent'})`
                    : `🏛️ ${p.teamName || p.name} - [${p.chestNumber || p.squadLabel || 'Entry'}] ${p.memberCount ? `(${p.memberCount} members)` : ''}`
                  }
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* MODE 1: BULK ALL-RESULTS TABLE FOR SELECTED PROGRAM */}
      {entryMode === "bulk" && (
        <div>
          {!programId ? (
            <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '12px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</div>
              <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>Select a Program Above</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                All enrolled students for the selected program will appear here so you can assign 1st, 2nd, 3rd places and grades simultaneously.
              </p>
            </div>
          ) : participants.length === 0 ? (
            <div className="glass-panel" style={{ padding: '35px 20px', textAlign: 'center', borderRadius: '12px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚠️</div>
              <strong style={{ fontSize: '1rem', color: 'var(--warning)' }}>No Students Enrolled in this Program</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Please assign candidates to this program in <strong>Program Assignments</strong> before recording results.
              </p>
            </div>
          ) : (
            <form onSubmit={handleBulkSubmit} className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 800 }}>
                    {selectedProgram?.name}
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Total Enrolled: {participants.length} {isIndividual ? 'Candidates' : 'Squads/Teams'}
                  </span>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading}
                  style={{
                    padding: '10px 24px',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
                  }}
                >
                  <CheckCircle2 size={18} />
                  {loading ? "Saving All Results..." : "💾 Save All Results For This Program"}
                </button>
              </div>

              {/* Table of Enrolled Candidates */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '10px 12px', width: isIndividual ? '80px' : '110px' }}>
                        {isIndividual ? 'Chest No' : 'Entry / Squad'}
                      </th>
                      <th style={{ padding: '10px 12px' }}>
                        {isIndividual ? 'Participant Name' : 'Team / Institution & Participants'}
                      </th>
                      <th style={{ padding: '10px 12px', width: '130px' }}>
                        {isIndividual ? 'Team' : 'Entry Scope'}
                      </th>
                      <th style={{ padding: '10px 12px', width: '160px' }}>Place (Rank)</th>
                      <th style={{ padding: '10px 12px', width: '140px' }}>Grade</th>
                      <th style={{ padding: '10px 12px', width: '120px', textAlign: 'center' }}>Total Points</th>
                      <th style={{ padding: '10px 12px', width: '120px', textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p: any, idx: number) => {
                      const entry = bulkEntries[p.id] || { rank: "", grade: "", marks: "", status: "COMPLETED" };
                      const isWinner = entry.rank === "1" || entry.rank === "2" || entry.rank === "3";
                      const isAbsent = entry.status === "ABSENT";

                      return (
                        <tr 
                          key={p.id}
                          style={{ 
                            borderBottom: '1px solid var(--border-color)',
                            backgroundColor: isAbsent 
                              ? 'rgba(239, 68, 68, 0.05)'
                              : isWinner 
                                ? 'rgba(16, 185, 129, 0.05)' 
                                : idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'
                          }}
                        >
                          <td style={{ padding: '10px 12px', fontWeight: 800, color: 'var(--primary)' }}>
                            {p.chestNumber || (isIndividual ? `T-${idx + 1}` : `Team-${idx + 1}`)}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {isIndividual ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</span>
                                {isAbsent && (
                                  <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#ef444420', color: '#ef4444', fontWeight: 800 }}>
                                    ❌ ABSENT
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                                    🏛️ {p.teamName || p.name}
                                  </span>
                                  {p.squadLabel && (
                                    <span style={{ 
                                      fontSize: '0.7rem', 
                                      fontWeight: 700, 
                                      padding: '1px 6px', 
                                      borderRadius: '4px',
                                      backgroundColor: p.flagColor ? `${p.flagColor}25` : 'rgba(99, 102, 241, 0.15)',
                                      color: p.flagColor || 'var(--primary)'
                                    }}>
                                      {p.squadLabel}
                                    </span>
                                  )}
                                  {isAbsent && (
                                    <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#ef444420', color: '#ef4444', fontWeight: 800 }}>
                                      ❌ ABSENT
                                    </span>
                                  )}
                                </div>
                                {p.squadMembers ? (
                                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.3' }}>
                                    <strong style={{ color: 'var(--text-primary)' }}>Enrolled ({p.memberCount || 0}):</strong> {p.squadMembers}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                    Institution entry (results scored to team score)
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: p.flagColor ? `${p.flagColor}20` : 'rgba(255,255,255,0.06)',
                              color: p.flagColor || 'var(--text-secondary)'
                            }}>
                              {isIndividual ? (p.teamName || 'Independent') : (p.squadLabel || 'Team Entry')}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <select
                              value={entry.rank}
                              onChange={(e) => handleBulkChange(p.id, 'rank', e.target.value)}
                              disabled={isAbsent}
                              className="form-input"
                              style={{ 
                                margin: 0, 
                                padding: '6px 8px', 
                                fontSize: '0.85rem',
                                fontWeight: entry.rank ? 800 : 500,
                                color: entry.rank === "1" ? '#10b981' : entry.rank === "2" ? '#f97316' : entry.rank === "3" ? '#ef4444' : 'inherit'
                              }}
                            >
                              <option value="">-- No Rank --</option>
                              <option value="1">🥇 1st Place</option>
                              <option value="2">🥈 2nd Place</option>
                              <option value="3">🥉 3rd Place</option>
                            </select>
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <select
                              value={entry.grade}
                              onChange={(e) => handleBulkChange(p.id, 'grade', e.target.value)}
                              disabled={isAbsent}
                              className="form-input"
                              style={{ 
                                margin: 0, 
                                padding: '6px 8px', 
                                fontSize: '0.85rem',
                                fontWeight: entry.grade ? 800 : 500
                              }}
                            >
                              <option value="">-- No Grade --</option>
                              <option value="A">Grade A</option>
                              <option value="B">Grade B</option>
                              <option value="C">Grade C</option>
                            </select>
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <input
                              type="number"
                              step="0.1"
                              value={entry.marks}
                              onChange={(e) => handleBulkChange(p.id, 'marks', e.target.value)}
                              disabled={isAbsent}
                              placeholder="0"
                              className="form-input"
                              style={{
                                margin: 0,
                                padding: '6px 8px',
                                width: '75px',
                                textAlign: 'center',
                                fontWeight: 800,
                                fontSize: '0.9rem',
                                display: 'inline-block'
                              }}
                            />
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleBulkChange(p.id, 'status', isAbsent ? "COMPLETED" : "ABSENT")}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                borderRadius: '6px',
                                border: isAbsent ? '1px solid #dc2626' : '1px solid var(--border-color)',
                                backgroundColor: isAbsent ? '#ef444420' : 'rgba(255, 255, 255, 0.05)',
                                color: isAbsent ? '#ef4444' : 'var(--text-secondary)',
                                cursor: 'pointer'
                              }}
                            >
                              {isAbsent ? "❌ Absent" : "Present"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading}
                  style={{ padding: '10px 28px', fontWeight: 800, fontSize: '0.95rem' }}
                >
                  {loading ? "Saving..." : "💾 Save All Results For This Program"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* MODE 2: SINGLE PARTICIPANT RESULT ENTRY */}
      {entryMode === "single" && (
        <form onSubmit={handleSingleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1.2fr 1.2fr 1.5fr', 
            gap: 'var(--spacing-md)', 
            backgroundColor: 'rgba(255,255,255,0.03)', 
            padding: '16px', 
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            alignItems: 'flex-end'
          }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 800 }}>PLACE</label>
              <select 
                className="form-input" 
                value={rank} 
                onChange={(e) => updateSingleMarks(e.target.value, grade)}
                disabled={singleStatus === "ABSENT"}
                style={{ padding: '10px', height: '45px', backgroundColor: '#fff', color: '#1f2937', border: '2px solid #e5e7eb' }}
              >
                <option value="">-- No Rank --</option>
                <option value="1">1st Place</option>
                <option value="2">2nd Place</option>
                <option value="3">3rd Place</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 800 }}>GRADE</label>
              <select 
                className="form-input" 
                value={grade} 
                onChange={(e) => updateSingleMarks(rank, e.target.value)}
                disabled={singleStatus === "ABSENT"}
                style={{ padding: '10px', height: '45px', backgroundColor: '#fff', color: '#1f2937', border: '2px solid #e5e7eb' }}
              >
                <option value="">-- No Grade --</option>
                <option value="A">A Grade</option>
                <option value="B">B Grade</option>
                <option value="C">C Grade</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 900 }}>TOTAL MARKS</label>
              <input 
                type="number" 
                step="0.01"
                className="form-input" 
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                disabled={singleStatus === "ABSENT"}
                placeholder="0.00"
                required={singleStatus !== "ABSENT"}
                style={{ 
                  padding: '10px', 
                  height: '45px', 
                  fontSize: '1.2rem', 
                  backgroundColor: '#fff', 
                  color: '#1f2937', 
                  border: '3px solid var(--primary)', 
                  fontWeight: 800,
                  textAlign: 'center'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 800 }}>STATUS</label>
              <select
                className="form-input"
                value={singleStatus}
                onChange={(e) => {
                  const val = e.target.value;
                  setSingleStatus(val);
                  if (val === "ABSENT") {
                    setRank("");
                    setGrade("");
                    setMarks("0");
                  }
                }}
                style={{ padding: '10px', height: '45px', backgroundColor: '#fff', color: '#1f2937', border: '2px solid #e5e7eb' }}
              >
                <option value="COMPLETED">✅ Present</option>
                <option value="ABSENT">❌ Absent</option>
              </select>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ height: '45px', width: '100%', fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase' }} 
              disabled={loading}
            >
              {loading ? "Recording..." : "🚀 Submit Result"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
