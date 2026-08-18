"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";

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
  const [showAdvanced, setShowAdvanced] = useState(!!(initialEventId || initialCategoryId || initialStageType || initialProgramType));

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

  const handleClear = () => {
    setQuery("");
    setEventId("");
    setCategoryId("");
    setStageType("");
    setProgramType("");
    router.push(`/search?type=${type}`);
  };

  return (
    <div className="search-client-card">
      <form onSubmit={handleSearch} className="search-form">
        {/* Top Primary Search Row */}
        <div className="search-top-row">
          <div className="form-field-group target-field">
            <label className="form-field-label font-body">Search Target</label>
            <select 
              className="form-select-input font-body" 
              value={type}
              onChange={(e) => {
                setType(e.target.value);
              }}
            >
              <option value="chestNumber">Candidate / Chest Number</option>
              <option value="program">Programme / Result Board</option>
            </select>
          </div>

          <div className="form-field-group field-grow relative-wrapper">
            <label className="form-field-label font-body">Search Term</label>
            <div className="input-with-icon">
              <Search size={16} className="input-search-icon" />
              <input 
                type="text" 
                className="form-text-input font-body" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={type === 'chestNumber' ? 'Type Chest Number or Candidate Name...' : 'Type Programme Name or Code...'}
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} className="clear-query-btn">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="form-buttons-group">
            <button type="submit" className="btn-search-submit font-body">
              <Search size={16} />
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns in Down Section */}
        <div className="filters-down-section">
          <div className="filters-down-grid">
            {/* Festival section is primarily for Program search or section filtering */}
            {events.length > 0 && (
              <div className="form-field-group">
                <label className="form-field-label font-body">
                  {type === "program" ? "Festival Section" : "Filter Section"}
                </label>
                <select 
                  className="form-select-input font-body" 
                  value={eventId}
                  onChange={(e) => {
                    setEventId(e.target.value);
                    setCategoryId("");
                  }}
                >
                  <option value="">All Festival Sections</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
              </div>
            )}

            <div className="form-field-group">
              <label className="form-field-label font-body">Category</label>
              <select 
                className="form-select-input font-body" 
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>

            {type === "program" && (
              <>
                <div className="form-field-group">
                  <label className="form-field-label font-body">Stage</label>
                  <select 
                    className="form-select-input font-body" 
                    value={stageType}
                    onChange={(e) => setStageType(e.target.value)}
                  >
                    <option value="">All Stages</option>
                    <option value="ON_STAGE">ON STAGE</option>
                    <option value="OFF_STAGE">OFF STAGE</option>
                  </select>
                </div>

                <div className="form-field-group">
                  <label className="form-field-label font-body">Type</label>
                  <select 
                    className="form-select-input font-body" 
                    value={programType}
                    onChange={(e) => setProgramType(e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="INDIVIDUAL">INDIVIDUAL</option>
                    <option value="GROUP">GROUP</option>
                    <option value="GENERAL">GENERAL</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
        
        {(query || eventId || categoryId || stageType || programType) && (
          <div className="clear-filters-row">
            <button 
              type="button" 
              onClick={handleClear}
              className="clear-all-link font-body"
            >
              ✕ Reset search & filters
            </button>
          </div>
        )}
      </form>

      <style jsx>{`
        .search-client-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 1.5rem;
          box-shadow: var(--shadow-sm);
        }

        .search-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        /* Top Row: Target + Search Term + Search Button */
        .search-top-row {
          display: grid;
          grid-template-columns: 240px 1fr auto;
          gap: 12px;
          align-items: flex-end;
        }

        .form-field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-field-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .form-select-input,
        .form-text-input {
          height: 46px;
          padding: 0 1rem;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--bg);
          color: var(--text);
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }

        .form-select-input:focus,
        .form-text-input:focus {
          border-color: var(--indigo);
          background: var(--surface);
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-search-icon {
          position: absolute;
          left: 14px;
          color: var(--muted);
          pointer-events: none;
        }

        .input-with-icon .form-text-input {
          width: 100%;
          padding-left: 42px;
          padding-right: 36px;
        }

        .clear-query-btn {
          position: absolute;
          right: 12px;
          background: transparent;
          border: none;
          color: var(--muted);
          cursor: pointer;
        }

        .form-buttons-group {
          display: flex;
          gap: 8px;
        }

        .btn-search-submit {
          height: 46px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 1.75rem;
          background: linear-gradient(135deg, var(--gold-bright) 0%, var(--gold) 100%);
          color: var(--gold-ink);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          white-space: nowrap;
        }

        .btn-search-submit:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(200, 151, 63, 0.35);
        }

        /* Down Section: Category, Stage, Type, Festival Section */
        .filters-down-section {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.25rem;
        }

        .filters-down-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }

        .clear-filters-row {
          display: flex;
          justify-content: flex-end;
          padding-top: 2px;
        }

        .clear-all-link {
          background: transparent;
          border: none;
          color: var(--live);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
        }

        .clear-all-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 720px) {
          .search-top-row {
            grid-template-columns: 1fr;
          }
          .btn-search-submit {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
