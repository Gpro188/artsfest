"use client";

import { useState } from "react";
import { togglePublishResult, deleteResult, publishProgramResults, unpublishProgramResults } from "./actions";
import EditResultModal from "./EditResultModal";

export default function ResultList({ results, role }: { results: any[], role: string }) {
  const [filter, setFilter] = useState<'all' | 'published' | 'pending'>('all');
  const [editingResult, setEditingResult] = useState<any | null>(null);

  // Group results by program
  const groupedResults: { [key: string]: { program: any, results: any[] } } = {};
  
  results.forEach(res => {
    if (!groupedResults[res.programId]) {
      groupedResults[res.programId] = {
        program: res.program,
        results: []
      };
    }
    groupedResults[res.programId].results.push(res);
  });

  const programIds = Object.keys(groupedResults).filter(pid => {
    const group = groupedResults[pid];
    const hasPublished = group.results.some(r => r.isPublished);
    const hasPending = group.results.some(r => !r.isPublished);
    
    if (filter === 'published') return hasPublished;
    if (filter === 'pending') return hasPending;
    return true;
  });

  if (results.length === 0) {
    return <div style={{ color: 'var(--text-muted)' }}>No marks entered yet.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
        <button 
          onClick={() => setFilter('all')}
          className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
        >
          All ({results.length})
        </button>
        <button 
          onClick={() => setFilter('pending')}
          className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', borderColor: filter !== 'pending' ? 'var(--warning)' : undefined }}
        >
          Pending ({results.filter(r => !r.isPublished).length})
        </button>
        <button 
          onClick={() => setFilter('published')}
          className={`btn ${filter === 'published' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', borderColor: filter !== 'published' ? 'var(--success)' : undefined }}
        >
          Published ({results.filter(r => r.isPublished).length})
        </button>
      </div>

      {programIds.length === 0 ? (
        <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          No {filter} results found.
        </div>
      ) : (
        programIds.map((pid) => {
          const group = groupedResults[pid];
          const isFullyPublished = group.results.length > 0 && group.results.every(r => r.isPublished);
          const hasPublished = group.results.some(r => r.isPublished);
          const hasPending = group.results.some(r => !r.isPublished);

          return (
            <div key={pid} className="glass-panel" style={{ padding: '0', overflow: 'hidden', border: isFullyPublished ? '1px solid var(--success)' : (hasPublished ? '1px solid var(--primary)' : '1px solid var(--warning)') }}>
              <div style={{ 
                padding: 'var(--spacing-sm) var(--spacing-md)', 
                backgroundColor: isFullyPublished ? 'rgba(16, 185, 129, 0.1)' : (hasPublished ? 'rgba(99, 102, 241, 0.08)' : 'rgba(234, 179, 8, 0.1)'),
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color)',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>{group.program.name}</h4>
                    {isFullyPublished ? (
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)', fontWeight: 700 }}>
                        Published
                      </span>
                    ) : hasPublished ? (
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary)', fontWeight: 700 }}>
                        Partially Published
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.2)', color: 'var(--warning)', fontWeight: 700 }}>
                        Unpublished
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {group.program.category?.name || 'General'} • {group.program.type} • {group.results.length} entries
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                   <a 
                    href={`/print/results/${pid}`}
                    target="_blank"
                    className="btn btn-secondary"
                    style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--accent)', color: 'var(--accent)' }}
                  >
                    🖨️ {isFullyPublished ? "Notice Board" : "Announce Print"}
                  </a>

                  {role === "ADMIN" && (
                    <>
                      {hasPending && (
                        <button 
                          onClick={() => {
                            if (confirm(`Publish all results for ${group.program.name}?`)) {
                              publishProgramResults(pid);
                            }
                          }}
                          className="btn btn-primary"
                          style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          🚀 {hasPublished ? "Publish All" : "Publish Results"}
                        </button>
                      )}

                      {hasPublished && (
                        <button 
                          onClick={() => {
                            if (confirm(`Unpublish results for ${group.program.name}? This will hide them from live standings and boards.`)) {
                              unpublishProgramResults(pid);
                            }
                          }}
                          className="btn btn-secondary"
                          style={{ 
                            padding: '0.2rem 0.6rem', 
                            fontSize: '0.75rem', 
                            borderColor: 'var(--warning)', 
                            color: 'var(--warning)',
                            backgroundColor: 'rgba(245, 158, 11, 0.08)'
                          }}
                          title="Hide results from public leaderboards and boards"
                        >
                          🔒 Unpublish Results
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div style={{ padding: 'var(--spacing-sm)' }}>
                {group.results.sort((a,b) => (a.rank || 99) - (b.rank || 99)).map((result) => {
                  const isGroupOrGeneral = group.program.type !== "INDIVIDUAL";
                  const participantName = result.candidate ? result.candidate.name : (result.team ? result.team.name : 'Unknown');
                  const participantChest = result.candidate ? result.candidate.chestNumber : (result.team ? result.team.prefixCode : '-');
                  const teamInfo = result.candidate ? result.candidate.team : result.team;
                  const showPhoto = result.candidate?.photo || result.team?.leaderPhoto;

                  return (
                    <div key={result.id} style={{ 
                      padding: 'var(--spacing-xs) var(--spacing-sm)', 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      fontSize: '0.875rem'
                    }}>
                      <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center', flex: 1 }}>
                        <div style={{ width: '25px', fontWeight: 'bold', color: result.rank === 1 ? '#FCD34D' : (result.rank === 2 ? '#E2E8F0' : (result.rank === 3 ? '#F97316' : 'inherit')) }}>
                          {result.rank ? `${result.rank}.` : '-'}
                        </div>
                        
                        {/* PHOTO DISPLAY */}
                        <div style={{ position: 'relative' }}>
                          {showPhoto ? (
                            <img 
                              src={showPhoto} 
                              alt={participantName} 
                              style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', border: `1px solid ${teamInfo?.flagColor || 'var(--border-color)'}` }}
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          ) : (
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                              {isGroupOrGeneral ? '👥' : '👤'}
                            </div>
                          )}
                        </div>

                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 600 }}>{participantName}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '8px' }}>({participantChest})</span>
                          {isGroupOrGeneral && teamInfo?.leaderName && !result.candidate && (
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Leader: {teamInfo.leaderName}</div>
                          )}
                        </div>
                        
                        <div style={{ fontSize: '0.75rem', color: teamInfo?.flagColor || 'var(--primary)', fontWeight: 600, width: '80px' }}>
                          {teamInfo?.name}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                         <div style={{ fontWeight: 'bold', width: '35px', textAlign: 'right' }} title="Marks / Score">{result.marks}</div>
                         <div style={{ width: '20px', textAlign: 'center', color: 'var(--success)', fontWeight: 'bold' }} title="Grade">{result.grade || '-'}</div>
                         
                         {/* Publish status toggle button */}
                         {role === "ADMIN" ? (
                           <button
                             onClick={() => togglePublishResult(result.id, !result.isPublished)}
                             style={{
                               padding: '2px 8px',
                               fontSize: '0.7rem',
                               borderRadius: '4px',
                               border: `1px solid ${result.isPublished ? 'var(--success)' : 'var(--warning)'}`,
                               backgroundColor: result.isPublished ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                               color: result.isPublished ? 'var(--success)' : 'var(--warning)',
                               cursor: 'pointer',
                               fontWeight: 600,
                               transition: 'all 0.2s'
                             }}
                             title={result.isPublished ? "Click to unpublish this entry" : "Click to publish this entry"}
                           >
                             {result.isPublished ? "✓ Pub" : "Draft"}
                           </button>
                         ) : (
                           <span style={{
                             fontSize: '0.7rem',
                             padding: '2px 6px',
                             borderRadius: '4px',
                             backgroundColor: result.isPublished ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                             color: result.isPublished ? 'var(--success)' : 'var(--warning)',
                             fontWeight: 600
                           }}>
                             {result.isPublished ? "Pub" : "Draft"}
                           </span>
                         )}

                         <div style={{ display: 'flex', gap: '4px' }}>
                           {role === "ADMIN" && (
                             <>
                              <button 
                                onClick={() => setEditingResult(result)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', padding: '2px' }}
                                title="Edit Place, Grade, Marks & Status"
                              >
                                📝
                              </button>
                              <button 
                                onClick={() => {
                                  if (confirm(`Delete result for ${participantName}?`)) deleteResult(result.id);
                                }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', padding: '2px' }}
                                title="Delete Result"
                              >
                                🗑️
                              </button>
                             </>
                           )}
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {editingResult && (
        <EditResultModal 
          result={editingResult} 
          onClose={() => setEditingResult(null)} 
        />
      )}
    </div>
  );
}
