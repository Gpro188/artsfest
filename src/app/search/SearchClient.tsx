"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchClient({ 
  initialQuery, 
  initialType,
  events,
  categories,
  initialEventId,
  initialCategoryId,
  initialStageType,
  initialProgramType
}: { 
  initialQuery: string, 
  initialType: string,
  events: any[],
  categories: any[],
  initialEventId: string,
  initialCategoryId: string,
  initialStageType: string,
  initialProgramType: string
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState(initialType);
  const [eventId, setEventId] = useState(initialEventId);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [stageType, setStageType] = useState(initialStageType);
  const [programType, setProgramType] = useState(initialProgramType);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const params = new URLSearchParams();
    if (query.trim()) params.append('q', query);
    params.append('type', type);
    if (eventId) params.append('eventId', eventId);
    if (categoryId) params.append('categoryId', categoryId);
    if (stageType) params.append('stageType', stageType);
    if (programType) params.append('programType', programType);
    
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
      <form onSubmit={handleSearch}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-md)', alignItems: 'flex-end' }}>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search By</label>
            <select 
              className="form-input" 
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="chestNumber">Chest Number / Candidate</option>
              <option value="program">Program Name / Results</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Query (Optional)</label>
            <input 
              type="text" 
              className="form-input" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={type === 'chestNumber' ? 'e.g. 101' : 'e.g. Quran'}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Select Event</label>
            <select 
              className="form-input" 
              value={eventId}
              onChange={(e) => {
                setEventId(e.target.value);
                setCategoryId(""); // Reset category when event changes
              }}
            >
              <option value="">All Events</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Category</label>
            <select 
              className="form-input" 
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>

          {type === "program" && (
            <>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Stage</label>
                <select 
                  className="form-input" 
                  value={stageType}
                  onChange={(e) => setStageType(e.target.value)}
                >
                  <option value="">All Stages</option>
                  <option value="ON_STAGE">ON STAGE</option>
                  <option value="OFF_STAGE">OFF STAGE</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Type</label>
                <select 
                  className="form-input" 
                  value={programType}
                  onChange={(e) => setProgramType(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="INDIVIDUAL">INDIVIDUAL</option>
                  <option value="GROUP">GROUP</option>
                </select>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
            Filter & Search
          </button>
        </div>
        
        {(query || eventId || categoryId || stageType || programType) && (
          <div style={{ marginTop: '10px', display: 'flex', gap: '5px' }}>
             <button 
              type="button" 
              onClick={() => {
                setQuery("");
                setEventId("");
                setCategoryId("");
                setStageType("");
                setProgramType("");
                router.push(`/search?type=${type}`);
              }}
              style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.8rem' }}
             >
               Clear Filters
             </button>
          </div>
        )}
      </form>
    </div>
  );
}
