"use client";

import { useState } from "react";
import ScoringForm from "./ScoringForm";
import ResultList from "./ResultList";
import TeamScorePreview from "./TeamScorePreview";
import PendingProgramsList from "./PendingProgramsList";
import TotalPenaltyManager from "./TotalPenaltyManager";
import { PenTool, ShieldAlert, Award, AlertCircle } from "lucide-react";

export default function ScoringHubSessions({
  activeEvent,
  eventId,
  results,
  teamScores,
  pendingPrograms,
  role,
  candidates,
  teamPenalties,
  committeeRulesJson
}: {
  activeEvent: any;
  eventId: string;
  results: any[];
  teamScores: any[];
  pendingPrograms: any[];
  role: string;
  candidates: any[];
  teamPenalties: any[];
  committeeRulesJson?: string | null;
}) {
  const [activeSession, setActiveSession] = useState<"PROGRAM_MARKS" | "TOTAL_PENALTIES">("PROGRAM_MARKS");

  const totalPenaltiesCount = teamPenalties.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {/* Session Switcher Navigation */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          padding: '8px 12px',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveSession("PROGRAM_MARKS")}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: 800,
              border: activeSession === "PROGRAM_MARKS" ? '1px solid var(--primary)' : '1px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: activeSession === "PROGRAM_MARKS" ? 'var(--primary)' : 'transparent',
              color: activeSession === "PROGRAM_MARKS" ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s',
              boxShadow: activeSession === "PROGRAM_MARKS" ? '0 4px 12px rgba(99, 102, 241, 0.35)' : 'none'
            }}
          >
            <PenTool size={18} />
            <span>1. Program Mark Entry</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSession("TOTAL_PENALTIES")}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: 800,
              border: activeSession === "TOTAL_PENALTIES" ? '1px solid #ef4444' : '1px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: activeSession === "TOTAL_PENALTIES" ? '#ef4444' : 'transparent',
              color: activeSession === "TOTAL_PENALTIES" ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s',
              boxShadow: activeSession === "TOTAL_PENALTIES" ? '0 4px 12px rgba(239, 68, 68, 0.35)' : 'none'
            }}
          >
            <ShieldAlert size={18} />
            <span>2. Total Penalty Marks (-Mark Session)</span>
            {totalPenaltiesCount > 0 && (
              <span 
                style={{
                  fontSize: '0.75rem',
                  backgroundColor: activeSession === "TOTAL_PENALTIES" ? '#ffffff' : '#ef4444',
                  color: activeSession === "TOTAL_PENALTIES" ? '#ef4444' : '#ffffff',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontWeight: 900
                }}
              >
                {totalPenaltiesCount}
              </span>
            )}
          </button>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {activeSession === "PROGRAM_MARKS" 
            ? "Enter 1st, 2nd, 3rd places & grades for festival programs" 
            : "Direct -Mark deductions on Team Grand Total or Individual Total"}
        </div>
      </div>

      {/* SESSION 1: PROGRAM MARK ENTRY */}
      {activeSession === "PROGRAM_MARKS" && (
        <div style={{ display: 'grid', gridTemplateColumns: '2.8fr 1.2fr', gap: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {/* Primary Entry Area */}
            <div data-tour="scoring-form" className="glass-panel" style={{ padding: 'var(--spacing-xl)', border: '1px solid var(--primary)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: 'var(--primary)' }}></div>
              <h2 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                Rapid Result Entry
              </h2>
              <ScoringForm events={[activeEvent]} />
            </div>

            {/* Results Management Section */}
            <div data-tour="scoring-results" className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--secondary)' }}>Results Management Hub</h3>
              <ResultList results={results as any} role={role} />
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <div data-tour="scoring-teams">
              <TeamScorePreview scores={teamScores} />
            </div>
            
            <div data-tour="scoring-pending" className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
              <h3 style={{ marginBottom: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Pending Entries
                <span style={{ fontSize: '0.8rem', backgroundColor: 'var(--error)', color: 'white', padding: '2px 8px', borderRadius: '10px' }}>{pendingPrograms.length}</span>
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                Programs with assignments but no results recorded for <strong>{activeEvent.name}</strong>.
              </p>
              <PendingProgramsList programs={pendingPrograms} />
            </div>
          </div>
        </div>
      )}

      {/* SESSION 2: TOTAL PENALTY MARKS (-MARK) */}
      {activeSession === "TOTAL_PENALTIES" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <TotalPenaltyManager
            eventId={eventId}
            teams={activeEvent.teams || []}
            candidates={candidates}
            penalties={teamPenalties}
            committeeRulesJson={committeeRulesJson}
          />
        </div>
      )}
    </div>
  );
}
