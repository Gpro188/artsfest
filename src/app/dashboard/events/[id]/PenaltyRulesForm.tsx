"use client";

import { useState } from "react";
import { savePenaltyRules } from "./actions";
import { parsePenaltyRules, FestivalPenaltyRules, PenaltySituation, PenaltyTarget } from "@/lib/penaltyRules";
import { ShieldAlert, CheckCircle2, AlertTriangle } from "lucide-react";

export default function PenaltyRulesForm({ 
  eventId, 
  initialRulesJson 
}: { 
  eventId: string; 
  initialRulesJson?: string | null;
}) {
  const [rules, setRules] = useState<FestivalPenaltyRules>(() => parsePenaltyRules(initialRulesJson));
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const updateRule = (
    situation: PenaltySituation, 
    field: 'defaultDeduction' | 'defaultTarget' | 'disqualify' | 'label', 
    value: any
  ) => {
    setRules(prev => ({
      ...prev,
      [situation]: {
        ...prev[situation],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const res = await savePenaltyRules(eventId, JSON.stringify(rules));
    if (res.success) {
      setStatus({ type: 'success', message: 'Fest Committee Penalty & -Mark Rules saved successfully!' });
    } else {
      setStatus({ type: 'error', message: res.error || 'Failed to save penalty rules' });
    }
    setLoading(false);
  };

  const situations: { key: PenaltySituation; icon: string; title: string; hint: string }[] = [
    { key: "ABSENT", icon: "❌", title: "Absent", hint: "Candidate / Squad did not turn up to perform." },
    { key: "BEYOND_LIMIT", icon: "⏱️", title: "Beyond the Limit", hint: "Exceeded time limit, team size, accompaniment, or stage props." },
    { key: "IMPERSONATION", icon: "🎭", title: "Impersonation", hint: "Proxy attendance or unauthorized participant identity fraud." },
    { key: "CHEATING", icon: "🚫", title: "Cheating", hint: "Malpractice, using scripts/mobile devices, copying, or prompting." },
    { key: "OTHERS", icon: "📝", title: "Others", hint: "Stage damage, misconduct, dress code violations, or custom infractions." },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <ShieldAlert size={22} color="var(--primary)" />
        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Fest Committee Disciplinary & Negative Mark (-Mark) Matrix</h3>
      </div>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
        Configure the official deduction rules for infractions. During mark entry, administrators can apply these committee presets or customize the specific -Mark on the spot.
      </p>

      {status && (
        <div style={{
          color: status.type === 'error' ? '#dc2626' : '#059669',
          backgroundColor: status.type === 'error' ? '#fef2f2' : '#f0fdf4',
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '16px',
          border: `1px solid ${status.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          fontSize: '0.9rem',
          fontWeight: 600
        }}>
          {status.type === 'error' ? '❌' : '✅'} {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {situations.map(({ key, icon, title, hint }) => {
            const rule = rules[key];
            return (
              <div 
                key={key} 
                style={{ 
                  padding: '14px 16px', 
                  backgroundColor: 'rgba(255, 255, 255, 0.03)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '10px',
                  display: 'grid',
                  gridTemplateColumns: 'minmax(200px, 1.8fr) 1fr 1.2fr 1.1fr',
                  gap: '14px',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.95rem' }}>
                    <span>{icon}</span>
                    <span>{title}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {hint}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Default -Mark
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontWeight: 800, color: 'var(--danger, #ef4444)' }}>-</span>
                    <input 
                      type="number"
                      step="0.5"
                      min="0"
                      className="form-input"
                      value={rule.defaultDeduction}
                      onChange={(e) => updateRule(key, 'defaultDeduction', parseFloat(e.target.value) || 0)}
                      style={{ padding: '6px 10px', fontSize: '0.85rem', fontWeight: 700, width: '100%' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Deduction Target
                  </label>
                  <select
                    className="form-input"
                    value={rule.defaultTarget}
                    onChange={(e) => updateRule(key, 'defaultTarget', e.target.value as PenaltyTarget)}
                    style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                  >
                    <option value="INDIVIDUAL">🎯 Individual Program Mark</option>
                    <option value="TEAM_TOTAL">🏛️ Team Grand Total Mark</option>
                    <option value="BOTH">⚡ Both (Program + Team)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Disqualification
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', marginTop: '6px' }}>
                    <input 
                      type="checkbox"
                      checked={!!rule.disqualify}
                      onChange={(e) => updateRule(key, 'disqualify', e.target.checked)}
                      style={{ accentColor: 'var(--danger, #ef4444)', transform: 'scale(1.1)' }}
                    />
                    <span>Void Place/Grade</span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
          style={{ padding: '10px 24px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <CheckCircle2 size={18} />
          {loading ? "Saving Committee Rules..." : "💾 Save Fest Penalty Matrix"}
        </button>
      </form>
    </div>
  );
}
