"use client";

import { useState } from "react";
import { deleteProgram } from "./actions";
import EditProgramModal from "./EditProgramModal";

type ProgramType = {
  id: string;
  programCode: string | null;
  name: string;
  type: string;
  categoryId: string | null;
  candidateLimitPerTeam?: number;
  category: { name: string } | null;
  event: { id: string, name: string };
  _count: { assignments: number };
};

export default function ProgramList({ 
  programs, 
  events = [], 
  categories = [] 
}: { 
  programs: ProgramType[], 
  events?: any[], 
  categories?: any[] 
}) {
  const [editingProgram, setEditingProgram] = useState<ProgramType | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>("ALL");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Extract strictly unique categories by name
  const seenNames = new Set<string>();
  const availableCategories: any[] = [];
  for (const c of categories.concat(programs.map(p => p.category).filter(Boolean))) {
    if (!c || !c.name) continue;
    const key = c.name.trim().toUpperCase();
    if (!seenNames.has(key)) {
      seenNames.add(key);
      availableCategories.push(c);
    }
  }

  const filteredPrograms = programs.filter(program => {
    // Event filter matching name or ID
    if (selectedEventId !== "ALL") {
      const selectedEvent = events.find(e => e.name === selectedEventId || e.id === selectedEventId);
      const isDirectMatch = program.event?.name === selectedEventId || (program as any).eventId === selectedEventId;
      const isParentMatch = selectedEvent?.parentId && ((program as any).eventId === selectedEvent.parentId || program.event?.id === selectedEvent.parentId);
      
      if (!isDirectMatch && !isParentMatch) {
        return false;
      }
    }

    // Category filter matching ID or Name (case-insensitive)
    if (selectedCategoryId !== "ALL") {
      if (selectedCategoryId === "GENERAL") {
        if (program.categoryId || program.category) return false;
      } else {
        const progCatName = program.category?.name?.trim().toUpperCase();
        const selKey = selectedCategoryId.trim().toUpperCase();
        if (program.categoryId !== selectedCategoryId && progCatName !== selKey) {
          return false;
        }
      }
    }

    // Text search query matching Code or Name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const codeMatch = program.programCode?.toLowerCase().includes(q);
      const nameMatch = program.name.toLowerCase().includes(q);
      if (!codeMatch && !nameMatch) return false;
    }

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      {/* Header & Filter Controls */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-sm)' }}>
          <h3 style={{ margin: 0 }}>All Programs ({filteredPrograms.length})</h3>
          {(selectedEventId !== "ALL" || selectedCategoryId !== "ALL" || searchQuery) && (
            <button 
              onClick={() => {
                setSelectedEventId("ALL");
                setSelectedCategoryId("ALL");
                setSearchQuery("");
              }}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              Clear Filters ❌
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
          gap: 'var(--spacing-sm)', 
          backgroundColor: 'rgba(15, 23, 42, 0.4)', 
          padding: 'var(--spacing-sm)', 
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          marginBottom: 'var(--spacing-sm)'
        }}>
          {/* Event Filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Filter by Event</label>
            <select 
              className="form-input" 
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '4px 8px' }}
            >
              <option value="ALL">All Events ({events.length || 'All'})</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.name}>{ev.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Filter by Category</label>
            <select 
              className="form-input" 
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '4px 8px' }}
            >
              <option value="ALL">All Categories</option>
              <option value="GENERAL">General (No Category)</option>
              {availableCategories.map(c => (
                <option key={c.id || c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Search Program</label>
            <input 
              type="text"
              className="form-input"
              placeholder="Search code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '4px 8px' }}
            />
          </div>
        </div>
      </div>

      {filteredPrograms.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
          No programs match the selected event or category filter.
        </div>
      ) : (
        filteredPrograms.map((program) => (
          <div key={program.id} style={{ 
            padding: 'var(--spacing-md)', 
            border: '1px solid var(--border-color)', 
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.4)'
          }}>
            <div>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {program.programCode && (
                  <span style={{ 
                    backgroundColor: 'var(--primary)', 
                    color: 'white', 
                    padding: '2px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem', 
                    fontWeight: 800,
                    letterSpacing: '0.05em'
                  }}>
                    {program.programCode}
                  </span>
                )}
                {program.name} 
                <span style={{ color: 'var(--secondary)', fontSize: '0.8rem', padding: '2px 6px', backgroundColor: 'rgba(14, 165, 233, 0.1)', borderRadius: '4px' }}>
                  {program.type}
                </span>
                {program.category && (
                  <span style={{ color: 'var(--success)', fontSize: '0.8rem', padding: '2px 6px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '4px' }}>
                    {program.category.name}
                  </span>
                )}
                <span style={{ 
                  color: program.type === "INDIVIDUAL" ? '#6366f1' : '#f59e0b', 
                  fontSize: '0.75rem', 
                  padding: '2px 8px', 
                  backgroundColor: program.type === "INDIVIDUAL" ? 'rgba(99, 102, 241, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                  border: `1px solid ${program.type === "INDIVIDUAL" ? 'rgba(99, 102, 241, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                  borderRadius: '12px',
                  fontWeight: 600
                }}>
                  {program.type === "INDIVIDUAL" 
                    ? `👤 Solo Limit: ${program.candidateLimitPerTeam || 1}` 
                    : `👥 Team Limit: ${program.candidateLimitPerTeam || 1} slots`}
                </span>
              </h4>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Event: {program.event.name} • Total Assigned: {program._count.assignments}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <a 
                href={`/print/judges-sheet?programId=${program.id}`} 
                target="_blank" 
                className="btn btn-secondary" 
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
              >
                📋 Tabulation Sheet
              </a>
              <button 
                onClick={() => setEditingProgram(program)}
                className="btn btn-secondary" 
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
              >
                Edit
              </button>
              <button 
                onClick={() => {
                  if (confirm('Are you sure you want to delete this program?')) {
                    deleteProgram(program.id);
                  }
                }}
                className="btn btn-secondary" 
                style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}

      {editingProgram && (
        <EditProgramModal 
          program={editingProgram} 
          categories={
            events.find(e => e.id === editingProgram.event?.id || e.id === (editingProgram as any).eventId)?.categories 
            || categories
          }
          onClose={() => setEditingProgram(null)} 
        />
      )}
    </div>
  );
}
